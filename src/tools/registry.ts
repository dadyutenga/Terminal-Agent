import { Tool, ToolContext, ToolResult } from './types.js';

/**
 * Central registry for all available tools
 * Handles tool discovery and invocation
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): Tool[] {
    return this.getAll().filter((tool) => tool.category === category);
  }

  /**
   * Get all tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Execute a tool by name
   */
  async execute<TInput = any, TOutput = any>(
    toolName: string,
    input: TInput,
    context: ToolContext,
  ): Promise<ToolResult<TOutput>> {
    const tool = this.get(toolName);
    if (!tool) {
      return {
        status: 'error',
        error: `Tool "${toolName}" not found`,
      };
    }

    // Validate input
    const validation = await tool.validate(input, context);
    if (!validation.valid) {
      return {
        status: 'error',
        error: `Validation failed: ${validation.errors?.join(', ')}`,
        metadata: { validation },
      };
    }

    // Execute the tool
    return tool.execute(input, context);
  }

  /**
   * Get preview for a tool action
   */
  async preview<TInput = any>(
    toolName: string,
    input: TInput,
    context: ToolContext,
  ): Promise<string> {
    const tool = this.get(toolName);
    if (!tool) {
      return `❌ Tool "${toolName}" not found`;
    }

    return tool.preview(input, context);
  }

  /**
   * Get tool metadata as JSON for LLM
   */
  getToolsMetadata(): Array<{
    name: string;
    description: string;
    category: string;
    requiresApproval: boolean;
    isDangerous: boolean;
  }> {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      requiresApproval: tool.requiresApproval,
      isDangerous: tool.isDangerous,
    }));
  }
}

/**
 * Create and initialize the default tool registry
 */
export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // Import and register all tools
  // Note: These will be imported dynamically to avoid circular dependencies
  return registry;
}
