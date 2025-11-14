import {
  Tool,
  ToolResult,
  ToolContext,
  ToolValidationResult,
} from './types.js';

/**
 * Abstract base class for all tools
 * Provides common functionality and enforces interface
 */
export abstract class BaseTool<TInput = any, TOutput = any>
  implements Tool<TInput, TOutput>
{
  abstract name: string;
  abstract description: string;
  abstract category: string;
  abstract requiresApproval: boolean;
  abstract isDangerous: boolean;

  /**
   * Validate input - override in subclasses for specific validation
   */
  async validate(
    input: TInput,
    context: ToolContext,
  ): Promise<ToolValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic null check
    if (!input) {
      errors.push('Input cannot be null or undefined');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Generate preview - must be implemented by subclasses
   */
  abstract preview(input: TInput, context: ToolContext): Promise<string>;

  /**
   * Execute the action - must be implemented by subclasses
   */
  abstract execute(
    input: TInput,
    context: ToolContext,
  ): Promise<ToolResult<TOutput>>;

  /**
   * Rollback support - override if the tool supports undo
   */
  async rollback(
    input: TInput,
    context: ToolContext,
    executionResult: ToolResult<TOutput>,
  ): Promise<ToolResult<void>> {
    return {
      status: 'error',
      error: `Rollback not supported for tool: ${this.name}`,
    };
  }

  /**
   * Helper: Create a success result
   */
  protected success<T>(data: T, metadata?: Record<string, any>): ToolResult<T> {
    return {
      status: 'success',
      data,
      metadata,
    };
  }

  /**
   * Helper: Create an error result
   */
  protected error(error: string, metadata?: Record<string, any>): ToolResult<TOutput> {
    return {
      status: 'error',
      error,
      metadata,
    };
  }

  /**
   * Helper: Validate file path is within project
   */
  protected isPathSafe(filePath: string, projectRoot: string): boolean {
    const path = require('path');
    const resolved = path.resolve(projectRoot, filePath);
    const normalized = path.normalize(resolved);
    return normalized.startsWith(path.normalize(projectRoot));
  }
}
