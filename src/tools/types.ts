/**
 * Core types for ASIA's tool/action system
 */

export type ToolStatus = 'success' | 'error' | 'pending' | 'cancelled';

export interface ToolResult<T = any> {
  status: ToolStatus;
  data?: T;
  error?: string;
  preview?: string; // Human-readable preview of what will happen
  metadata?: Record<string, any>;
}

export interface ToolContext {
  projectRoot: string;
  currentDir: string;
  userId?: string;
  sessionId?: string;
}

export interface ToolValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Base interface for all tools/actions in ASIA
 */
export interface Tool<TInput = any, TOutput = any> {
  /** Unique identifier for the tool */
  name: string;
  
  /** Human-readable description */
  description: string;
  
  /** Categories: 'file', 'command', 'git', 'analysis', etc. */
  category: string;
  
  /** Whether this tool requires user approval before execution */
  requiresApproval: boolean;
  
  /** Whether this tool is potentially dangerous */
  isDangerous: boolean;
  
  /**
   * Validate input parameters before execution
   */
  validate(input: TInput, context: ToolContext): Promise<ToolValidationResult>;
  
  /**
   * Generate a human-readable preview of what this tool will do
   * This is shown to the user BEFORE execution for approval
   */
  preview(input: TInput, context: ToolContext): Promise<string>;
  
  /**
   * Execute the tool action
   * Only called AFTER user approval (if required)
   */
  execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
  
  /**
   * Rollback/undo the action (if supported)
   */
  rollback?(input: TInput, context: ToolContext, executionResult: ToolResult<TOutput>): Promise<ToolResult<void>>;
}

/**
 * Tool input types for different actions
 */
export interface ReadFileInput {
  filePath: string;
  encoding?: string;
}

export interface WriteFileInput {
  filePath: string;
  content: string;
  createBackup?: boolean;
  encoding?: string;
}

export interface CreateFileInput {
  filePath: string;
  content: string;
  overwrite?: boolean;
  createDirs?: boolean;
}

export interface DeleteFileInput {
  filePath: string;
  backup?: boolean;
  confirmDangerous?: boolean;
}

export interface RunCommandInput {
  command: string;
  args?: string[];
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface ApplyPatchInput {
  filePath: string;
  patch: string;
  createBackup?: boolean;
}

/**
 * Tool output types
 */
export interface ReadFileOutput {
  content: string;
  encoding: string;
  size: number;
  lines: number;
}

export interface WriteFileOutput {
  bytesWritten: number;
  backupPath?: string;
}

export interface CreateFileOutput {
  created: boolean;
  path: string;
}

export interface DeleteFileOutput {
  deleted: boolean;
  backupPath?: string;
}

export interface RunCommandOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface ApplyPatchOutput {
  success: boolean;
  backupPath?: string;
  linesChanged: number;
}

/**
 * Action plan for multi-step operations
 */
export interface ActionStep {
  id: string;
  toolName: string;
  description: string;
  input: any;
  dependsOn?: string[]; // IDs of steps that must complete first
  required: boolean; // If false, failure won't stop the plan
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  steps: ActionStep[];
  estimatedDuration?: number;
  dangerLevel: 'safe' | 'caution' | 'dangerous';
}

/**
 * Execution history for rollback
 */
export interface ExecutionRecord {
  id: string;
  timestamp: Date;
  toolName: string;
  input: any;
  result: ToolResult;
  canRollback: boolean;
}
