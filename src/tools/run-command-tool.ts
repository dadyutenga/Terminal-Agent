import { spawn } from 'child_process';
import { BaseTool } from './base-tool.js';
import {
  RunCommandInput,
  RunCommandOutput,
  ToolResult,
  ToolContext,
  ToolValidationResult,
} from './types.js';

/**
 * Tool for running shell commands
 * DANGEROUS - Requires approval
 */
export class RunCommandTool extends BaseTool<RunCommandInput, RunCommandOutput> {
  name = 'run_command';
  description = 'Execute a shell command in the project directory';
  category = 'command';
  requiresApproval = true;
  isDangerous = true; // Commands can do anything!

  private readonly dangerousPatterns = [
    /rm\s+-rf/i,
    /sudo/i,
    /chmod/i,
    /chown/i,
    /kill/i,
    /shutdown/i,
    /reboot/i,
    /format/i,
    /dd\s+if=/i,
    />.*\/dev\//i, // Writing to devices
  ];

  async validate(
    input: RunCommandInput,
    context: ToolContext,
  ): Promise<ToolValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.command) {
      errors.push('Command is required');
    }

    // Check for dangerous patterns
    const fullCommand = `${input.command} ${(input.args || []).join(' ')}`;
    const isDangerous = this.dangerousPatterns.some((pattern) =>
      pattern.test(fullCommand),
    );

    if (isDangerous) {
      warnings.push(`⚠️ DANGEROUS COMMAND DETECTED: ${fullCommand}`);
    }

    // Validate timeout
    if (input.timeout && input.timeout < 0) {
      errors.push('Timeout must be positive');
    }

    if (input.timeout && input.timeout > 300000) {
      // 5 minutes
      warnings.push('Command timeout is very long (>5 minutes)');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async preview(input: RunCommandInput, context: ToolContext): Promise<string> {
    const args = input.args || [];
    const cwd = input.cwd || context.projectRoot;
    const fullCommand = `${input.command} ${args.join(' ')}`.trim();
    
    return [
      `⚡ Run command: ${fullCommand}`,
      `   Working directory: ${cwd}`,
      input.timeout ? `   Timeout: ${input.timeout}ms` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  async execute(
    input: RunCommandInput,
    context: ToolContext,
  ): Promise<ToolResult<RunCommandOutput>> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const cwd = input.cwd || context.projectRoot;
      const timeout = input.timeout || 60000; // Default 60s

      let stdout = '';
      let stderr = '';

      const child = spawn(input.command, input.args || [], {
        cwd,
        env: { ...process.env, ...input.env },
        shell: true,
      });

      // Timeout handler
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        resolve(
          this.error('Command timed out', {
            stdout,
            stderr,
            duration: Date.now() - startTime,
          }),
        );
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        resolve(
          this.error(`Failed to execute command: ${error.message}`, {
            stdout,
            stderr,
            duration: Date.now() - startTime,
          }),
        );
      });

      child.on('close', (exitCode) => {
        clearTimeout(timer);
        const duration = Date.now() - startTime;

        if (exitCode === 0) {
          resolve(
            this.success({
              stdout,
              stderr,
              exitCode: exitCode || 0,
              duration,
            }),
          );
        } else {
          resolve(
            this.error(`Command exited with code ${exitCode}`, {
              stdout,
              stderr,
              exitCode: exitCode || 1,
              duration,
            }),
          );
        }
      });
    });
  }
}
