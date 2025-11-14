import { ActionPlan, ActionStep, ExecutionRecord, ToolResult } from './types.js';
import { ToolRegistry } from './registry.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Manages action approval workflow
 * Shows previews, gets user confirmation, tracks execution
 */
export class ApprovalManager {
  private executionHistory: ExecutionRecord[] = [];
  private pendingActions: Map<string, ActionStep> = new Map();

  constructor(private toolRegistry: ToolRegistry) {}

  /**
   * Generate a preview for an action plan
   */
  async generatePlanPreview(
    plan: ActionPlan,
    context: any,
  ): Promise<string> {
    const lines: string[] = [];

    // Plan header
    lines.push(`\n${'='.repeat(60)}`);
    lines.push(`📋 ACTION PLAN: ${plan.title}`);
    lines.push(`${'='.repeat(60)}`);
    
    if (plan.description) {
      lines.push(`\n${plan.description}`);
    }

    lines.push(`\n⚠️ Danger Level: ${this.getDangerEmoji(plan.dangerLevel)} ${plan.dangerLevel.toUpperCase()}`);
    lines.push(`📊 Total Steps: ${plan.steps.length}`);
    
    if (plan.estimatedDuration) {
      lines.push(`⏱️ Estimated Duration: ${plan.estimatedDuration}s`);
    }

    // Individual step previews
    lines.push(`\n${'─'.repeat(60)}`);
    lines.push('STEPS:');
    lines.push(`${'─'.repeat(60)}\n`);

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const stepNum = `${i + 1}/${plan.steps.length}`;
      
      lines.push(`[${stepNum}] ${step.description}`);
      
      // Get tool preview
      const preview = await this.toolRegistry.preview(
        step.toolName,
        step.input,
        context,
      );
      lines.push(`      ${preview.replace(/\n/g, '\n      ')}`);
      
      // Show dependencies
      if (step.dependsOn && step.dependsOn.length > 0) {
        lines.push(`      📌 Depends on: ${step.dependsOn.join(', ')}`);
      }
      
      if (!step.required) {
        lines.push(`      ℹ️ Optional step (failure won't stop plan)`);
      }
      
      lines.push('');
    }

    lines.push(`${'='.repeat(60)}\n`);

    return lines.join('\n');
  }

  /**
   * Generate a preview for a single action
   */
  async generateActionPreview(
    toolName: string,
    input: any,
    context: any,
  ): Promise<string> {
    const tool = this.toolRegistry.get(toolName);
    if (!tool) {
      return `❌ Tool "${toolName}" not found`;
    }

    const lines: string[] = [];
    lines.push(`\n${'='.repeat(60)}`);
    lines.push(`🔧 ${tool.name.toUpperCase()}`);
    lines.push(`${'='.repeat(60)}`);
    lines.push(`\n${tool.description}`);
    lines.push(`\nCategory: ${tool.category}`);
    lines.push(`Requires Approval: ${tool.requiresApproval ? 'YES' : 'NO'}`);
    lines.push(`Dangerous: ${tool.isDangerous ? '⚠️ YES' : 'NO'}`);
    lines.push(`\n${'─'.repeat(60)}`);
    lines.push('PREVIEW:');
    lines.push(`${'─'.repeat(60)}\n`);

    const preview = await tool.preview(input, context);
    lines.push(preview);

    lines.push(`\n${'='.repeat(60)}\n`);

    return lines.join('\n');
  }

  /**
   * Add an action to the pending queue
   */
  addPendingAction(step: ActionStep): void {
    this.pendingActions.set(step.id, step);
  }

  /**
   * Remove an action from pending queue
   */
  removePendingAction(stepId: string): void {
    this.pendingActions.delete(stepId);
  }

  /**
   * Get all pending actions
   */
  getPendingActions(): ActionStep[] {
    return Array.from(this.pendingActions.values());
  }

  /**
   * Record an execution in history
   */
  recordExecution(
    toolName: string,
    input: any,
    result: ToolResult,
  ): ExecutionRecord {
    const tool = this.toolRegistry.get(toolName);
    const record: ExecutionRecord = {
      id: uuidv4(),
      timestamp: new Date(),
      toolName,
      input,
      result,
      canRollback: !!tool?.rollback && result.status === 'success',
    };

    this.executionHistory.push(record);
    return record;
  }

  /**
   * Get execution history
   */
  getHistory(limit?: number): ExecutionRecord[] {
    const history = [...this.executionHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Rollback a specific execution
   */
  async rollback(
    recordId: string,
    context: any,
  ): Promise<ToolResult<void>> {
    const record = this.executionHistory.find((r) => r.id === recordId);
    if (!record) {
      return {
        status: 'error',
        error: 'Execution record not found',
      };
    }

    if (!record.canRollback) {
      return {
        status: 'error',
        error: 'This action cannot be rolled back',
      };
    }

    const tool = this.toolRegistry.get(record.toolName);
    if (!tool || !tool.rollback) {
      return {
        status: 'error',
        error: 'Tool does not support rollback',
      };
    }

    return tool.rollback(record.input, context, record.result);
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Get danger emoji based on level
   */
  private getDangerEmoji(level: 'safe' | 'caution' | 'dangerous'): string {
    switch (level) {
      case 'safe':
        return '✅';
      case 'caution':
        return '⚠️';
      case 'dangerous':
        return '🚨';
    }
  }

  /**
   * Format execution result for display
   */
  formatExecutionResult(result: ToolResult): string {
    const lines: string[] = [];

    if (result.status === 'success') {
      lines.push('✅ SUCCESS');
    } else if (result.status === 'error') {
      lines.push('❌ ERROR');
      if (result.error) {
        lines.push(`   ${result.error}`);
      }
    } else if (result.status === 'cancelled') {
      lines.push('🚫 CANCELLED');
    }

    if (result.metadata) {
      lines.push('\n📊 Metadata:');
      lines.push(JSON.stringify(result.metadata, null, 2));
    }

    return lines.join('\n');
  }
}
