import { v4 as uuid } from 'uuid';
import type { CommandExecutor, ExecutionResult } from '../executor/command-executor.js';
import type { GitManager } from '../git/git-manager.js';
import type { CodeIndexer } from '../indexing/code-indexer.js';
import type { AiManager } from '../ai/ai-manager.js';
import type { ChatMessage } from '../ai/types.js';
import type { PatchEngine } from '../patches/patch-engine.js';
import type { SessionMemory } from '../memory/session-memory.js';
import type { IntentParser, ParsedIntent } from '../intents/intent-parser.js';
import type { FileReader } from '../files/file-reader.js';
import type { ToolRegistry } from '../tools/registry.js';
import type { ApprovalManager } from '../tools/approval-manager.js';
import type { PlanGenerator } from '../tools/plan-generator.js';

export type AssistantDependencies = {
  intents: IntentParser;
  indexer: CodeIndexer;
  git: GitManager;
  llm: AiManager;
  executor: CommandExecutor;
  patches: PatchEngine;
  memory: SessionMemory;
  fileReader: FileReader;
  toolRegistry: ToolRegistry;
  approvalManager: ApprovalManager;
  planGenerator: PlanGenerator;
  projectRoot: string;
};

export class ASIATAssistant {
  private pendingPatch: string | null = null;
  private pendingAction: {
    type: 'create-file' | 'modify-file' | 'delete-file' | 'run-command';
    toolName: string;
    input: any;
    preview: string;
  } | null = null;

  constructor(private readonly deps: AssistantDependencies) {}

  /**
   * Check if there's a pending action awaiting approval
   */
  hasPendingAction(): boolean {
    return this.pendingAction !== null;
  }

  /**
   * Get the pending action details
   */
  getPendingAction() {
    return this.pendingAction;
  }

  /**
   * Execute the pending action after approval
   */
  async executePendingAction(): Promise<string> {
    if (!this.pendingAction) {
      return '❌ No pending action to execute';
    }

    const { toolName, input } = this.pendingAction;
    
    try {
      const context = {
        projectRoot: this.deps.projectRoot,
        currentDir: process.cwd(),
      };

      const result = await this.deps.toolRegistry.execute(toolName, input, context);
      
      // Record the execution
      this.deps.approvalManager.recordExecution(toolName, input, result);
      
      // Clear pending action
      this.pendingAction = null;

      if (result.status === 'success') {
        // Re-index project if file was created/modified
        if (toolName === 'create_file' || toolName === 'write_file') {
          await this.deps.indexer.indexProject();
        }
        
        return `✅ Successfully executed ${toolName}\n\n${this.deps.approvalManager.formatExecutionResult(result)}`;
      } else {
        return `❌ Failed to execute ${toolName}\n\n${result.error || 'Unknown error'}`;
      }
    } catch (error) {
      this.pendingAction = null;
      return `❌ Error executing action: ${(error as Error).message}`;
    }
  }

  /**
   * Cancel the pending action
   */
  cancelPendingAction(): string {
    if (!this.pendingAction) {
      return 'No pending action to cancel';
    }
    
    const actionType = this.pendingAction.type;
    this.pendingAction = null;
    return `🚫 Cancelled ${actionType} action`;
  }

  updateLlm(newLlm: AiManager): void {
    this.deps.llm = newLlm;
  }

  async handleMessage(message: string): Promise<string> {
    const trimmed = message.trim().toLowerCase();
    
    // Check if user is responding to a pending action
    if (this.pendingAction) {
      if (trimmed === 'yes' || trimmed === 'y') {
        return this.executePendingAction();
      } else if (trimmed === 'no' || trimmed === 'n' || trimmed === 'cancel') {
        return this.cancelPendingAction();
      }
      // If not yes/no, continue with normal processing
      // but remind them they have a pending action
    }
    
    const intent = this.deps.intents.parse(message);

    switch (intent.type) {
      case 'run':
        return this.handleRunIntent(message, intent);
      case 'git':
        return this.handleGitIntent(intent);
      case 'create-file':
        return this.handleCreateFile(intent);
      case 'modify-file':
        return this.handleModifyFile(intent);
      case 'delete-file':
        return this.handleDeleteFile(intent);
      case 'read-file':
        return this.handleReadFile(intent);
      case 'run-command':
        return this.handleRunCommand(intent);
      case 'explain':
        return this.handleExplain(message, intent);
      case 'refactor':
        return this.handleRefactor(message, intent);
      case 'apply-patch':
        return this.applyPendingPatch();
      case 'discard-patch':
        return this.discardPendingPatch();
      case 'unknown':
      default:
        return this.handleGeneralConversation(message);
    }
  }

  private async handleRunIntent(message: string, intent: ParsedIntent): Promise<string> {
    try {
      if (intent.arguments?.script) {
        const script = this.resolveScriptName(intent.arguments.script);
        if (!script) {
          return `No script named "${intent.arguments.script}" is defined. Available scripts: ${this.listScripts()}`;
        }
        const result = await this.deps.executor.runScript(script);
        return this.formatExecutionResult(result);
      }

      const command = intent.arguments?.command ?? message;
      const result = await this.deps.executor.run(command);
      return this.formatExecutionResult(result);
    } catch (error) {
      return `Failed to run command: ${(error as Error).message}`;
    }
  }

  private async handleGitIntent(intent: ParsedIntent): Promise<string> {
    const action = intent.arguments?.action;
    try {
      if (action === 'create-branch') {
        const name = intent.arguments?.name;
        if (!name) {
          return 'Branch name is required.';
        }
        this.deps.git.createBranch(name);
        return `Created and switched to branch ${name}.`;
      }

      if (action === 'commit') {
        const message = intent.arguments?.message;
        if (!message) {
          return 'Commit message is required.';
        }
        this.deps.git.commit(message);
        return `Committed changes with message: ${message}`;
      }

      if (action === 'show-unstaged') {
        const diff = this.deps.git.unstagedChanges();
        return diff.trim() ? diff : 'No unstaged changes found.';
      }

      if (action === 'generate-commit-message') {
        const stagedDiff = this.deps.git.stagedDiff();
        const diff = stagedDiff.trim() ? stagedDiff : this.deps.git.diff();
        if (!diff.trim()) {
          return 'No changes detected to summarize.';
        }
        const response = await this.deps.llm.chat(this.buildMessages('Write a concise conventional commit-style subject line for these changes.', diff));
        return response.content.trim() || 'Language model did not return a commit message.';
      }

      const statusInfo = this.deps.git.status();
      return [
        `Branch: ${statusInfo.branch}`,
        `Ahead: ${statusInfo.ahead}, Behind: ${statusInfo.behind}`,
        statusInfo.changes.length ? 'Changes:' : 'No pending changes.',
        ...statusInfo.changes,
      ]
        .filter(Boolean)
        .join('\n');
    } catch (error) {
      return `Git command failed: ${(error as Error).message}`;
    }
  }

  /**
   * Handle create-file intent using the tool system
   * Uses LLM to generate content based on user request, then shows preview for approval
   */
  private async handleCreateFile(intent: ParsedIntent): Promise<string> {
    const targetPath = intent.arguments?.path;
    
    if (!targetPath) {
      return 'Please specify a file path. Example: "create file index.html"';
    }

    // Determine file type from extension
    const extension = targetPath.split('.').pop() || '';
    const fileType = extension || 'file';

    // Generate content using LLM based on file type
    let content = '';
    
    try {
      const prompt = this.buildContentGenerationPrompt(targetPath, fileType);
      const response = await this.deps.llm.chat(prompt);
      content = this.extractCodeFromResponse(response.content);
      
      if (!content) {
        content = response.content.trim();
      }
    } catch (error) {
      // Fallback to basic content
      content = this.getDefaultContent(fileType);
    }

    // Generate a creation plan with the generated content
    const plan = this.deps.planGenerator.generateCreateFilePlan(
      targetPath,
      content,
      true // create directories if needed
    );
    
    // Generate preview
    const preview = await this.deps.approvalManager.generatePlanPreview(plan, {
      projectRoot: this.deps.projectRoot,
      currentDir: process.cwd(),
    });

    // Store the pending action for user approval
    this.pendingAction = {
      type: 'create-file',
      toolName: 'create_file',
      input: {
        filePath: targetPath,
        content,
        createDirs: true,
      },
      preview,
    };

    // Return the preview and wait for approval
    return [
      preview,
      '',
      '📋 FILE CONTENT PREVIEW:',
      '─'.repeat(60),
      content.split('\n').slice(0, 30).join('\n'), // Show first 30 lines
      content.split('\n').length > 30 ? `\n... (${content.split('\n').length - 30} more lines)` : '',
      '─'.repeat(60),
      '',
      '⚠️ This action requires approval.',
      'Reply with "yes" to create the file or "no" to cancel.',
    ].join('\n');
  }

  /**
   * Build a prompt for LLM to generate file content
   */
  private buildContentGenerationPrompt(filePath: string, fileType: string): ChatMessage[] {
    const systemPrompt = 'You are a code generation assistant. Generate ONLY the code content without explanations, markdown formatting, or code fences. Output raw code that can be saved directly to a file.';
    
    let userPrompt = '';
    
    switch (fileType) {
      case 'html':
        userPrompt = `Generate a complete, modern HTML5 file for ${filePath}. Include:
- Proper DOCTYPE and semantic HTML5 structure
- Meta tags for charset and viewport
- A professional, clean layout
- Basic styling (either inline or in a <style> tag)
- Meaningful content (not just "Hello World")

Output ONLY the HTML code, no explanations.`;
        break;
        
      case 'css':
        userPrompt = `Generate a comprehensive CSS file for ${filePath}. Include:
- CSS reset/normalize styles
- Modern, responsive design patterns
- Flexbox or Grid layouts
- Professional color scheme and typography
- Responsive breakpoints

Output ONLY the CSS code, no explanations.`;
        break;
        
      case 'js':
      case 'ts':
        userPrompt = `Generate a well-structured ${fileType === 'ts' ? 'TypeScript' : 'JavaScript'} file for ${filePath}. Include:
- Proper module structure
- Type definitions (if TypeScript)
- Clean, documented code
- Modern ES6+ syntax

Output ONLY the code, no explanations.`;
        break;
        
      case 'md':
        userPrompt = `Generate a well-formatted Markdown file for ${filePath}. Include:
- Clear headings and structure
- Professional documentation format
- Relevant sections based on the filename

Output ONLY the Markdown content, no explanations.`;
        break;
        
      default:
        userPrompt = `Generate appropriate content for a ${fileType} file named ${filePath}. 
Make it professional, complete, and ready to use.
Output ONLY the file content, no explanations.`;
    }
    
    return this.buildMessages(systemPrompt, userPrompt);
  }

  /**
   * Extract code from LLM response (removes markdown code fences if present)
   */
  private extractCodeFromResponse(response: string): string {
    // Remove markdown code fences
    const codeBlockMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // Check if response starts with code fence
    if (response.startsWith('```')) {
      const lines = response.split('\n');
      lines.shift(); // Remove first ```
      if (lines[lines.length - 1].trim() === '```') {
        lines.pop(); // Remove last ```
      }
      return lines.join('\n').trim();
    }
    
    return response.trim();
  }

  /**
   * Get default/fallback content for a file type
   */
  private getDefaultContent(fileType: string): string {
    switch (fileType) {
      case 'html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a basic HTML file.</p>
</body>
</html>`;
      
      case 'css':
        return `/* Stylesheet */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
}`;
      
      case 'js':
        return `// JavaScript file
console.log('Hello, World!');`;
      
      case 'ts':
        return `// TypeScript file
console.log('Hello, World!');`;
      
      case 'md':
        return `# Document

## Overview

This is a markdown file.`;
      
      default:
        return '';
    }
  }

  private handleReadFile(intent: ParsedIntent): string {
    const filePath = intent.arguments?.path;
    
    if (!filePath) {
      return 'Please specify a file path. Example: "read src/index.ts"';
    }

    const result = this.deps.fileReader.readFile(filePath);

    if (!result.success) {
      return `❌ ${result.error}`;
    }

    const language = this.deps.fileReader.detectLanguage(result.filePath);
    const lineCount = result.content?.split('\n').length || 0;

    // Format the output with file info and content
    return [
      `📄 File: ${result.relativePath}`,
      `📝 Language: ${language}`,
      `📏 Lines: ${lineCount}`,
      '',
      '```' + language,
      result.content,
      '```',
    ].join('\n');
  }

  /**
   * Handle modify-file intent using the tool system
   * Shows a preview and requires approval before modifying
   */
  private async handleModifyFile(intent: ParsedIntent): Promise<string> {
    const filePath = intent.arguments?.path;
    
    if (!filePath) {
      return 'Please specify a file path to modify. Example: "modify src/index.ts"';
    }

    // For now, return a message indicating this requires the agentic workflow
    // The full implementation will be done through the approval UI
    return [
      `📝 To modify ${filePath}, please provide the new content or specific changes.`,
      ``,
      `I can help you:`,
      `  • Replace specific text`,
      `  • Add new code sections`,
      `  • Refactor existing code`,
      ``,
      `Tell me what changes you'd like to make!`,
    ].join('\n');
  }

  /**
   * Handle delete-file intent using the tool system
   * Shows a preview and requires approval before deleting
   */
  private async handleDeleteFile(intent: ParsedIntent): Promise<string> {
    const filePath = intent.arguments?.path;
    
    if (!filePath) {
      return 'Please specify a file path to delete. Example: "delete temp.txt"';
    }

    // Generate a deletion plan
    const plan = this.deps.planGenerator.generateDeleteFilePlan(filePath, true);
    
    // Generate preview
    const preview = await this.deps.approvalManager.generatePlanPreview(plan, {
      projectRoot: this.deps.projectRoot,
      currentDir: process.cwd(),
    });

    return [
      preview,
      '',
      '⚠️ This action requires approval.',
      'Use "yes" to proceed or "no" to cancel.',
      '',
      'Note: A backup will be created before deletion.',
    ].join('\n');
  }

  /**
   * Handle run-command intent using the tool system
   * Shows a preview and requires approval before executing
   */
  private async handleRunCommand(intent: ParsedIntent): Promise<string> {
    const command = intent.arguments?.command;
    
    if (!command) {
      return 'Please specify a command to run. Example: "run command: npm test"';
    }

    // Parse command and args
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    // Generate a command execution plan
    const plan = this.deps.planGenerator.generateRunCommandPlan(cmd, args);
    
    // Generate preview
    const preview = await this.deps.approvalManager.generatePlanPreview(plan, {
      projectRoot: this.deps.projectRoot,
      currentDir: process.cwd(),
    });

    return [
      preview,
      '',
      '⚠️ This action requires approval.',
      'Use "yes" to proceed or "no" to cancel.',
    ].join('\n');
  }

  private async handleExplain(message: string, intent: ParsedIntent): Promise<string> {
    const focusPath = intent.arguments?.path;
    const focusSymbol = intent.arguments?.symbol;
    const related = await this.deps.indexer.search(focusPath ?? message, 4);

    if (related.length === 0) {
      return 'No relevant files found to explain.';
    }

    const contextBlocks = related
      .map((file) => {
        const summary = this.deps.indexer.describeFile(file.path, focusSymbol);
        const snippet = file.content.slice(0, 500);
        return [`File: ${file.path}`, `Summary:`, summary, 'Excerpt:', snippet].join('\n');
      })
      .join('\n\n');

    const llmResponse = await this.deps.llm.chat(
      this.buildMessages(
        'Explain the referenced code to a developer. Focus on responsibilities, important APIs, and how the pieces interact.',
        `User request: ${message}\n\nCode context:\n${contextBlocks}`
      )
    );

    return llmResponse.content.trim() || 'No explanation available.';
  }

  private async handleRefactor(message: string, intent: ParsedIntent): Promise<string> {
    const focusPath = intent.arguments?.path;
    const related = await this.deps.indexer.search(focusPath ?? message, 4);

    if (related.length === 0) {
      return 'No relevant files found to refactor.';
    }

    const contextBlocks = related
      .map((file) => {
        const summary = this.deps.indexer.describeFile(file.path);
        const snippet = file.content.slice(0, 400);
        return [`File: ${file.path}`, `Summary:`, summary, 'Excerpt:', snippet].join('\n');
      })
      .join('\n\n');

    const llmResponse = await this.deps.llm.chat(
      this.buildMessages(
        'Produce a unified diff (git apply format) that addresses the requested refactor. Do not include explanations outside the diff.',
        `Refactor request: ${message}\n\nProject context:\n${contextBlocks}`
      )
    );

    const patch = llmResponse.content.trim();
    if (!patch.includes('diff --git')) {
      return patch || 'Model did not return a valid patch. Please refine the request.';
    }

    this.pendingPatch = patch;
    return `Proposed patch:\n\n${patch}\n\nReply "apply patch" to apply or "discard patch" to cancel.`;
  }

  private async handleGeneralConversation(message: string): Promise<string> {
    // Check if this might be a file creation request that wasn't caught by intent parser
    const fileCreationIndicators = [
      /create.*(?:html|css|js|ts|file)/i,
      /make.*(?:html|css|js|ts|file)/i,
      /generate.*(?:html|css|js|file)/i,
      /build.*(?:html|css|js|file)/i,
    ];
    
    const seemsLikeFileCreation = fileCreationIndicators.some(pattern => pattern.test(message));
    
    if (seemsLikeFileCreation) {
      // Extract file type or use default
      const fileTypeMatch = message.match(/(html|css|js|ts|jsx|tsx|json|md)/i);
      const fileType = fileTypeMatch ? fileTypeMatch[1].toLowerCase() : 'html';
      
      // Re-route to create-file handler with detected file type
      return this.handleCreateFile({
        type: 'create-file',
        arguments: { path: `index.${fileType}` }
      });
    }
    
    const related = await this.deps.indexer.search(message, 3);
    const contextBlocks = related
      .map((file) => {
        const summary = this.deps.indexer.describeFile(file.path);
        return `File: ${file.path}\nSummary:\n${summary}`;
      })
      .join('\n\n');

    const systemPrompt = `You are ASIA, an adaptive software intelligence assistant with powerful file manipulation capabilities.

Available Actions:
- CREATE files: Just ask me to "create [filename]" or "create an HTML file"
- READ files: Ask to "read [filename]"
- MODIFY files: Ask to "modify [filename]"
- DELETE files: Ask to "delete [filename]"

When users want to create or manipulate files, I should USE my file tools, not just explain how they could do it manually.

Provide concise, actionable guidance grounded in the project context.`;

    const response = await this.deps.llm.chat(
      this.buildMessages(
        systemPrompt,
        `User request: ${message}${contextBlocks ? `\n\nIndexed context:\n${contextBlocks}` : ''}`
      )
    );

    return response.content.trim() || 'No response from language model.';
  }

  private async applyPendingPatch(): Promise<string> {
    if (!this.pendingPatch) {
      return 'No patch is awaiting approval.';
    }

    try {
      this.deps.patches.applyUnifiedDiff(this.pendingPatch);
      await this.deps.indexer.indexProject();
      const appliedSummary = this.pendingPatch.split('\n').slice(0, 20).join('\n');
      this.pendingPatch = null;
      return `Patch applied successfully. Preview:\n${appliedSummary}`;
    } catch (error) {
      return `Failed to apply patch: ${(error as Error).message}`;
    }
  }

  private discardPendingPatch(): string {
    if (!this.pendingPatch) {
      return 'No patch to discard.';
    }
    this.pendingPatch = null;
    return 'Discarded pending patch.';
  }

  private listScripts(): string {
    const scripts = this.deps.executor.listScripts();
    return scripts.length ? scripts.join(', ') : 'none';
  }

  private resolveScriptName(script: string): string | null {
    if (this.deps.executor.hasScript(script)) {
      return script;
    }

    const aliases: Record<string, string[]> = {
      migrate: ['migrations', 'db:migrate', 'database:migrate'],
      lint: ['lint:fix', 'lint:ci'],
      test: ['test:watch', 'test:ci'],
      build: ['compile'],
      dev: ['start', 'serve'],
    };

    const candidates = aliases[script];
    if (!candidates) {
      return null;
    }

    return candidates.find((candidate) => this.deps.executor.hasScript(candidate)) ?? null;
  }

  private formatExecutionResult(result: ExecutionResult): string {
    const parts = [
      `command: ${result.command}`,
      result.stdout.trim() ? `stdout:\n${result.stdout.trim()}` : '',
      result.stderr.trim() ? `stderr:\n${result.stderr.trim()}` : '',
      `exit code: ${result.exitCode}`,
    ];
    return parts.filter(Boolean).join('\n\n');
  }

  private buildMessages(systemInstruction: string, userPrompt: string): ChatMessage[] {
    const historyEntries = this.deps.memory.list().slice(-10);
    if (historyEntries.length && historyEntries[historyEntries.length - 1].role === 'user') {
      historyEntries.pop();
    }
    const history = historyEntries.map(({ role, content }) => ({ role, content }));

    const base: ChatMessage[] = [{ role: 'system', content: systemInstruction }];
    return base.concat(history).concat({ role: 'user', content: userPrompt });
  }
}
