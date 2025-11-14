import { v4 as uuid } from 'uuid';
import type { CommandExecutor, ExecutionResult } from '../executor/command-executor.js';
import type { GitManager } from '../git/git-manager.js';
import type { CodeIndexer } from '../indexing/code-indexer.js';
import type { AiManager } from '../ai/ai-manager.js';
import type { ChatMessage } from '../ai/types.js';
import type { PatchEngine } from '../patches/patch-engine.js';
import type { SessionMemory } from '../memory/session-memory.js';
import type { IntentParser, ParsedIntent } from '../intents/intent-parser.js';

export type AssistantDependencies = {
  intents: IntentParser;
  indexer: CodeIndexer;
  git: GitManager;
  llm: AiManager;
  executor: CommandExecutor;
  patches: PatchEngine;
  memory: SessionMemory;
};

export class ASIATAssistant {
  private pendingPatch: string | null = null;

  constructor(private readonly deps: AssistantDependencies) {}

  async handleMessage(message: string): Promise<string> {
    const intent = this.deps.intents.parse(message);

    switch (intent.type) {
      case 'run':
        return this.handleRunIntent(message, intent);
      case 'git':
        return this.handleGitIntent(intent);
      case 'create-file':
        return this.handleCreateFile(intent);
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

  private async handleCreateFile(intent: ParsedIntent): Promise<string> {
    const targetPath = intent.arguments?.path ?? `notes/${uuid()}.md`;
    this.deps.patches.writeFile(targetPath, '');
    await this.deps.indexer.indexProject();
    return `Created file ${targetPath}`;
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
    const related = await this.deps.indexer.search(message, 3);
    const contextBlocks = related
      .map((file) => {
        const summary = this.deps.indexer.describeFile(file.path);
        return `File: ${file.path}\nSummary:\n${summary}`;
      })
      .join('\n\n');

    const response = await this.deps.llm.chat(
      this.buildMessages(
        'You are ASIA, an adaptive software intelligence assistant comfortable working across all languages. Provide concise, actionable guidance grounded in the project context.',
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
