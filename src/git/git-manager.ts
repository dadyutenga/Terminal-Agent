import { execSync } from 'node:child_process';
import path from 'node:path';

export type GitStatus = {
  branch: string;
  ahead: number;
  behind: number;
  changes: string[];
};

export class GitManager {
  constructor(private readonly projectRoot: string) {}

  private runGit(args: string[]): string {
    return execSync(`git ${args.join(' ')}`, {
      cwd: this.projectRoot,
      encoding: 'utf-8',
    }).trim();
  }

  status(): GitStatus {
    const porcelain = this.runGit(['status', '--porcelain=v2', '--branch']);
    const lines = porcelain.split('\n');
    const branchInfo = lines.find((line) => line.startsWith('# branch.head')) ?? '# branch.head unknown';
    const aheadInfo = lines.find((line) => line.startsWith('# branch.ab')) ?? '# branch.ab +0 -0';
    const [, , branch] = branchInfo.split(' ');
    const [, , aheadRaw, behindRaw] = aheadInfo.split(' ');
    const ahead = Number.parseInt(aheadRaw.replace('+', ''), 10);
    const behind = Number.parseInt(behindRaw.replace('-', ''), 10);
    const changes = lines.filter((line) => line.startsWith('1 ')).map((line) => line.substring(2));

    return { branch, ahead, behind, changes };
  }

  createBranch(name: string): string {
    this.runGit(['checkout', '-b', name]);
    return name;
  }

  checkout(branch: string): void {
    this.runGit(['checkout', branch]);
  }

  commit(message: string): void {
    this.runGit(['commit', '-am', JSON.stringify(message)]);
  }

  diff(pathspec?: string): string {
    const args = ['diff'];
    if (pathspec) {
      args.push('--', pathspec);
    }
    return this.runGit(args);
  }

  push(remote = 'origin', branch?: string): string {
    const currentBranch = branch ?? this.status().branch;
    return this.runGit(['push', remote, currentBranch]);
  }

  root(): string {
    return this.runGit(['rev-parse', '--show-toplevel']) || path.resolve(this.projectRoot);
  }
}
