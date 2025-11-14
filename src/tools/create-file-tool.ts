import { promises as fs } from 'fs';
import * as path from 'path';
import { BaseTool } from './base-tool.js';
import {
  CreateFileInput,
  CreateFileOutput,
  ToolResult,
  ToolContext,
  ToolValidationResult,
} from './types.js';

/**
 * Tool for creating new files
 * Requires approval - creates new content
 */
export class CreateFileTool extends BaseTool<CreateFileInput, CreateFileOutput> {
  name = 'create_file';
  description = 'Create a new file with specified content';
  category = 'file';
  requiresApproval = true;
  isDangerous = false;

  async validate(
    input: CreateFileInput,
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
      await fs.access(filePath);
      if (!input.overwrite) {
        errors.push('File already exists (set overwrite: true to replace)');
      } else {
        warnings.push('Will overwrite existing file');
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        errors.push(`Cannot access path: ${error.message}`);
      }
    }

    // Check if directory exists
    const dirPath = path.dirname(filePath);
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        errors.push('Parent path exists but is not a directory');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        if (!input.createDirs) {
          errors.push('Parent directory does not exist (set createDirs: true)');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async preview(input: CreateFileInput, context: ToolContext): Promise<string> {
    const filePath = path.resolve(context.projectRoot, input.filePath);
    const relativePath = path.relative(context.projectRoot, filePath);
    const lines = input.content.split('\n').length;
    const size = Buffer.byteLength(input.content, 'utf8');
    
    const action = input.overwrite ? 'Create/Overwrite' : 'Create';
    
    return [
      `📝 ${action} file: ${relativePath}`,
      `   Lines: ${lines}`,
      `   Size: ${size} bytes`,
    ].join('\n');
  }

  async execute(
    input: CreateFileInput,
    context: ToolContext,
  ): Promise<ToolResult<CreateFileOutput>> {
    try {
      const filePath = path.resolve(context.projectRoot, input.filePath);
      
      // Create directories if needed
      if (input.createDirs) {
        const dirPath = path.dirname(filePath);
        await fs.mkdir(dirPath, { recursive: true });
      }

      // Write the file
      await fs.writeFile(filePath, input.content, 'utf8');

      return this.success({
        created: true,
        path: filePath,
      });
    } catch (error: any) {
      return this.error(`Failed to create file: ${error.message}`);
    }
  }

  async rollback(
    input: CreateFileInput,
    context: ToolContext,
    executionResult: ToolResult<CreateFileOutput>,
  ): Promise<ToolResult<void>> {
    if (!executionResult.data?.created) {
      return this.error('File was not created, nothing to rollback');
    }

    try {
      const filePath = path.resolve(context.projectRoot, input.filePath);
      await fs.unlink(filePath);
      return this.success(undefined);
    } catch (error: any) {
      return this.error(`Failed to rollback file creation: ${error.message}`);
    }
  }
}
