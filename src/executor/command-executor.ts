import { spawn } from 'node:child_process';

export type ExecutionResult = {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export class CommandExecutor {
  constructor(private readonly projectRoot: string) {}

  run(command: string, args: string[] = []): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd: this.projectRoot, shell: true });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('close', (code) => {
        resolve({ command: [command, ...args].join(' '), exitCode: code, stdout, stderr });
      });
    });
  }
}
