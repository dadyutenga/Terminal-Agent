import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export type ExecutionResult = {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export class CommandExecutor {
  private readonly scripts: Set<string>;

  constructor(private readonly projectRoot: string) {
    this.scripts = this.loadScripts();
  }

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

  async runScript(script: string): Promise<ExecutionResult> {
    if (!this.scripts.has(script)) {
      throw new Error(`Script "${script}" is not defined in package.json`);
    }

    return this.run('npm', ['run', script]);
  }

  private loadScripts(): Set<string> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return new Set();
    }
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { scripts?: Record<string, string> };
      return new Set(Object.keys(packageJson.scripts ?? {}));
    } catch {
      return new Set();
    }
  }

  hasScript(script: string): boolean {
    return this.scripts.has(script);
  }

  listScripts(): string[] {
    return [...this.scripts];
  }
}
