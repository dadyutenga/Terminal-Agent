import { ActionPlan, ActionStep } from './types.js';
import { ToolRegistry } from './registry.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates action plans from user requests
 * Breaks down complex tasks into steps
 */
export class PlanGenerator {
  constructor(private toolRegistry: ToolRegistry) {}

  /**
   * Generate a plan for creating a new file
   */
  generateCreateFilePlan(
    filePath: string,
    content: string,
    createDirs = true,
  ): ActionPlan {
    const stepId = uuidv4();
    
    return {
      id: uuidv4(),
      title: `Create file: ${filePath}`,
      description: `Create a new file with ${content.split('\n').length} lines of content`,
      steps: [
        {
          id: stepId,
          toolName: 'create_file',
          description: `Create ${filePath}`,
          input: {
            filePath,
            content,
            createDirs,
          },
          required: true,
        },
      ],
      dangerLevel: 'safe',
    };
  }

  /**
   * Generate a plan for modifying an existing file
   */
  generateModifyFilePlan(
    filePath: string,
    content: string,
    createBackup = true,
  ): ActionPlan {
    const stepId = uuidv4();
    
    return {
      id: uuidv4(),
      title: `Modify file: ${filePath}`,
      description: `Update existing file with new content`,
      steps: [
        {
          id: stepId,
          toolName: 'write_file',
          description: `Write to ${filePath}`,
          input: {
            filePath,
            content,
            createBackup,
          },
          required: true,
        },
      ],
      dangerLevel: 'caution',
    };
  }

  /**
   * Generate a plan for deleting a file
   */
  generateDeleteFilePlan(
    filePath: string,
    backup = true,
    confirmDangerous = false,
  ): ActionPlan {
    const stepId = uuidv4();
    
    return {
      id: uuidv4(),
      title: `Delete file: ${filePath}`,
      description: `Remove file from project${backup ? ' (with backup)' : ''}`,
      steps: [
        {
          id: stepId,
          toolName: 'delete_file',
          description: `Delete ${filePath}`,
          input: {
            filePath,
            backup,
            confirmDangerous,
          },
          required: true,
        },
      ],
      dangerLevel: 'dangerous',
    };
  }

  /**
   * Generate a plan for running a command
   */
  generateRunCommandPlan(
    command: string,
    args: string[] = [],
    cwd?: string,
  ): ActionPlan {
    const stepId = uuidv4();
    const fullCommand = `${command} ${args.join(' ')}`.trim();
    
    return {
      id: uuidv4(),
      title: `Run command: ${fullCommand}`,
      description: `Execute shell command`,
      steps: [
        {
          id: stepId,
          toolName: 'run_command',
          description: `Run: ${fullCommand}`,
          input: {
            command,
            args,
            cwd,
          },
          required: true,
        },
      ],
      dangerLevel: 'dangerous',
      estimatedDuration: 10,
    };
  }

  /**
   * Generate a complex multi-step plan
   */
  generateMultiStepPlan(
    title: string,
    description: string,
    steps: Array<{
      toolName: string;
      description: string;
      input: any;
      dependsOn?: string[];
      required?: boolean;
    }>,
  ): ActionPlan {
    // Calculate danger level based on tools used
    const hasDangerousTool = steps.some((step) => {
      const tool = this.toolRegistry.get(step.toolName);
      return tool?.isDangerous;
    });

    const hasModifyTool = steps.some((step) => {
      const tool = this.toolRegistry.get(step.toolName);
      return tool?.requiresApproval;
    });

    const dangerLevel = hasDangerousTool
      ? 'dangerous'
      : hasModifyTool
        ? 'caution'
        : 'safe';

    return {
      id: uuidv4(),
      title,
      description,
      steps: steps.map((step) => ({
        id: uuidv4(),
        toolName: step.toolName,
        description: step.description,
        input: step.input,
        dependsOn: step.dependsOn,
        required: step.required !== false,
      })),
      dangerLevel,
    };
  }

  /**
   * Generate a plan for reading multiple files
   */
  generateReadFilesPlan(filePaths: string[]): ActionPlan {
    return {
      id: uuidv4(),
      title: `Read ${filePaths.length} files`,
      description: `Read multiple files from the project`,
      steps: filePaths.map((filePath) => ({
        id: uuidv4(),
        toolName: 'read_file',
        description: `Read ${filePath}`,
        input: { filePath },
        required: false, // Reading is optional
      })),
      dangerLevel: 'safe',
    };
  }

  /**
   * Generate a plan for creating multiple files
   */
  generateCreateFilesPlan(
    files: Array<{ path: string; content: string }>,
  ): ActionPlan {
    return {
      id: uuidv4(),
      title: `Create ${files.length} files`,
      description: `Create multiple new files`,
      steps: files.map((file) => ({
        id: uuidv4(),
        toolName: 'create_file',
        description: `Create ${file.path}`,
        input: {
          filePath: file.path,
          content: file.content,
          createDirs: true,
        },
        required: true,
      })),
      dangerLevel: 'caution',
    };
  }
}
