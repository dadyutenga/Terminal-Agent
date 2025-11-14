/**
 * ASIA Tool System
 * 
 * A comprehensive action/tool framework for file operations and command execution
 * with built-in approval flow and safety guards.
 */

// Types
export * from './types.js';

// Base classes
export { BaseTool } from './base-tool.js';

// Core tools
export { ReadFileTool } from './read-file-tool.js';
export { WriteFileTool } from './write-file-tool.js';
export { CreateFileTool } from './create-file-tool.js';
export { DeleteFileTool } from './delete-file-tool.js';
export { RunCommandTool } from './run-command-tool.js';

// System components
export { ToolRegistry, createToolRegistry } from './registry.js';
export { ApprovalManager } from './approval-manager.js';
export { PlanGenerator } from './plan-generator.js';

// Initialize default tool registry
import { ToolRegistry } from './registry.js';
import { ReadFileTool } from './read-file-tool.js';
import { WriteFileTool } from './write-file-tool.js';
import { CreateFileTool } from './create-file-tool.js';
import { DeleteFileTool } from './delete-file-tool.js';
import { RunCommandTool } from './run-command-tool.js';

/**
 * Create and register all default tools
 */
export function initializeToolSystem(): ToolRegistry {
  const registry = new ToolRegistry();

  // Register all file operation tools
  registry.register(new ReadFileTool());
  registry.register(new WriteFileTool());
  registry.register(new CreateFileTool());
  registry.register(new DeleteFileTool());
  
  // Register command execution tool
  registry.register(new RunCommandTool());

  return registry;
}
