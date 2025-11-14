import { promises as fs } from 'fs';
import * as path from 'path';
import { BaseTool } from './base-tool.js';
import {
  ReadFileInput,
  ReadFileOutput,
  ToolResult,
  ToolContext,
  ToolValidationResult,
} from './types.js';

/**
 * Tool for reading file contents
 * Low risk - read-only operation
 */
export class ReadFileTool extends BaseTool<ReadFileInput, ReadFileOutput> {
  name = 'read_file';
  description = 'Read the contents of a file from the project directory';
  category = 'file';
  requiresApproval = false; // Reading is safe
  isDangerous = false;

  async validate(
    input: ReadFileInput,
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
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        errors.push('Path is not a file');
      }
      if (stat.size > 10 * 1024 * 1024) {
        // 10MB
        warnings.push('File is very large (>10MB), may be slow to read');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        errors.push('File does not exist');
      } else {
        errors.push(`Cannot access file: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async preview(input: ReadFileInput, context: ToolContext): Promise<string> {
    const filePath = path.resolve(context.projectRoot, input.filePath);
    const relativePath = path.relative(context.projectRoot, filePath);
    
    try {
      const stat = await fs.stat(filePath);
      const sizeKB = (stat.size / 1024).toFixed(2);
      return `📖 Read file: ${relativePath} (${sizeKB} KB)`;
    } catch {
      return `📖 Read file: ${relativePath}`;
    }
  }

  async execute(
    input: ReadFileInput,
    context: ToolContext,
  ): Promise<ToolResult<ReadFileOutput>> {
    try {
      const filePath = path.resolve(context.projectRoot, input.filePath);
      const encoding = (input.encoding || 'utf8') as BufferEncoding;
      
      const content = await fs.readFile(filePath, encoding);
      const stat = await fs.stat(filePath);
      const lines = content.split('\n').length;

      return this.success({
        content,
        encoding,
        size: stat.size,
        lines,
      });
    } catch (error: any) {
      return this.error(`Failed to read file: ${error.message}`);
    }
  }
}
