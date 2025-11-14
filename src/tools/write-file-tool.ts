import { promises as fs } from 'fs';
import * as path from 'path';
import { BaseTool } from './base-tool.js';
import {
  WriteFileInput,
  WriteFileOutput,
  ToolResult,
  ToolContext,
  ToolValidationResult,
} from './types.js';

/**
 * Tool for writing/modifying existing files
 * Requires approval - modifies existing content
 */
export class WriteFileTool extends BaseTool<WriteFileInput, WriteFileOutput> {
  name = 'write_file';
  description = 'Write content to an existing file (with backup)';
  category = 'file';
  requiresApproval = true; // Modifying files requires approval
  isDangerous = false;

  async validate(
    input: WriteFileInput,
    context: ToolContext,
  ): Promise<ToolValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.filePath) {
      errors.push('File path is required');
    }

    if (!input.content && input.content !== '') {
      errors.push('Content is required');
    }

    if (input.filePath && !this.isPathSafe(input.filePath, context.projectRoot)) {
      errors.push('File path is outside project directory');
    }

    const filePath = path.resolve(context.projectRoot, input.filePath);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        errors.push('Path exists but is not a file');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        errors.push('File does not exist (use create_file tool instead)');
      }
    }

    // Warn about important files
    const fileName = path.basename(input.filePath);
    const dangerousFiles = ['package.json', '.env', 'tsconfig.json', '.gitignore'];
    if (dangerousFiles.includes(fileName)) {
      warnings.push(`Modifying critical file: ${fileName}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async preview(input: WriteFileInput, context: ToolContext): Promise<string> {
    const filePath = path.resolve(context.projectRoot, input.filePath);
    const relativePath = path.relative(context.projectRoot, filePath);
    
    try {
      // Read current content to show diff
      const currentContent = await fs.readFile(filePath, 'utf8');
      const currentLines = currentContent.split('\n').length;
      const newLines = input.content.split('\n').length;
      const backup = input.createBackup !== false ? ' (with backup)' : '';
      
      return [
        `✏️ Write file: ${relativePath}${backup}`,
        `   Lines: ${currentLines} → ${newLines}`,
        `   Size: ${currentContent.length} → ${input.content.length} bytes`,
      ].join('\n');
    } catch {
      return `✏️ Write file: ${relativePath}`;
    }
  }

  async execute(
    input: WriteFileInput,
    context: ToolContext,
  ): Promise<ToolResult<WriteFileOutput>> {
    try {
      const filePath = path.resolve(context.projectRoot, input.filePath);
      const encoding = (input.encoding || 'utf8') as BufferEncoding;
      
      let backupPath: string | undefined;

      // Create backup if requested (default: true)
      if (input.createBackup !== false) {
        const backupContent = await fs.readFile(filePath, encoding);
        backupPath = `${filePath}.backup-${Date.now()}`;
        await fs.writeFile(backupPath, backupContent, encoding);
      }

      // Write new content
      await fs.writeFile(filePath, input.content, encoding);
      const bytesWritten = Buffer.byteLength(input.content, encoding);

      return this.success({
        bytesWritten,
        backupPath,
      });
    } catch (error: any) {
      return this.error(`Failed to write file: ${error.message}`);
    }
  }

  async rollback(
    input: WriteFileInput,
    context: ToolContext,
    executionResult: ToolResult<WriteFileOutput>,
  ): Promise<ToolResult<void>> {
    if (!executionResult.data?.backupPath) {
      return this.error('No backup available for rollback');
    }

    try {
      const filePath = path.resolve(context.projectRoot, input.filePath);
      const backupContent = await fs.readFile(executionResult.data.backupPath, 'utf8');
      await fs.writeFile(filePath, backupContent, 'utf8');
      await fs.unlink(executionResult.data.backupPath);

      return this.success(undefined);
    } catch (error: any) {
      return this.error(`Failed to rollback: ${error.message}`);
    }
  }
}
