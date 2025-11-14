import { promises as fs } from 'fs';
import * as path from 'path';
import { BaseTool } from './base-tool.js';
import {
  DeleteFileInput,
  DeleteFileOutput,
  ToolResult,
  ToolContext,
  ToolValidationResult,
} from './types.js';

/**
 * Tool for deleting files
 * DANGEROUS - Requires approval and confirmation
 */
export class DeleteFileTool extends BaseTool<DeleteFileInput, DeleteFileOutput> {
  name = 'delete_file';
  description = 'Delete a file from the project (with optional backup)';
  category = 'file';
  requiresApproval = true;
  isDangerous = true; // Deletion is dangerous!

  private readonly dangerousExtensions = [
    '.env',
    '.git',
    'package.json',
    'tsconfig.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'package-lock.json',
  ];

  async validate(
    input: DeleteFileInput,
    context: ToolContext,
  ): Promise<ToolValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.filePath) {
      errors.push('File path is required');
    }

    if (input.filePath && !this.isPathSafe(input.filePath, context.projectRoot)) {
      errors.push('File path is outside project directory');
    }

    const filePath = path.resolve(context.projectRoot, input.filePath);
    const fileName = path.basename(filePath);
    
    // Check if file exists
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        errors.push('Path is not a file (cannot delete directories)');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        errors.push('File does not exist');
      } else {
        errors.push(`Cannot access file: ${error.message}`);
      }
    }

    // Check for dangerous files
    const isDangerous = this.dangerousExtensions.some(
      (ext) => fileName === ext || fileName.endsWith(ext),
    );

    if (isDangerous && !input.confirmDangerous) {
      errors.push(
        `Deleting critical file "${fileName}" requires confirmDangerous: true`,
      );
    }

    if (isDangerous) {
      warnings.push(`⚠️ DANGEROUS: Deleting critical file: ${fileName}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async preview(input: DeleteFileInput, context: ToolContext): Promise<string> {
    const filePath = path.resolve(context.projectRoot, input.filePath);
    const relativePath = path.relative(context.projectRoot, filePath);
    
    try {
      const stat = await fs.stat(filePath);
      const sizeKB = (stat.size / 1024).toFixed(2);
      const backup = input.backup !== false ? ' (will create backup)' : ' ⚠️ NO BACKUP';
      
      return [
        `🗑️ Delete file: ${relativePath}${backup}`,
        `   Size: ${sizeKB} KB`,
      ].join('\n');
    } catch {
      return `🗑️ Delete file: ${relativePath}`;
    }
  }

  async execute(
    input: DeleteFileInput,
    context: ToolContext,
  ): Promise<ToolResult<DeleteFileOutput>> {
    try {
      const filePath = path.resolve(context.projectRoot, input.filePath);
      
      let backupPath: string | undefined;

      // Create backup if requested (default: true for safety)
      if (input.backup !== false) {
        const content = await fs.readFile(filePath, 'utf8');
        backupPath = `${filePath}.deleted-${Date.now()}`;
        await fs.writeFile(backupPath, content, 'utf8');
      }

      // Delete the file
      await fs.unlink(filePath);

      return this.success({
        deleted: true,
        backupPath,
      });
    } catch (error: any) {
      return this.error(`Failed to delete file: ${error.message}`);
    }
  }

  async rollback(
    input: DeleteFileInput,
    context: ToolContext,
    executionResult: ToolResult<DeleteFileOutput>,
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
      return this.error(`Failed to rollback deletion: ${error.message}`);
    }
  }
}
