import fs from 'node:fs';
import path from 'node:path';

export class PatchEngine {
  constructor(private readonly projectRoot: string) {}

  readFile(filePath: string): string {
    const absolutePath = this.resolvePath(filePath);
    return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf-8') : '';
  }

  writeFile(filePath: string, content: string): void {
    const absolutePath = this.resolvePath(filePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf-8');
  }

  applyUnifiedDiff(patch: string): void {
    const sections = patch
      .split(/^diff --git .*$/m)
      .map((section) => section.trim())
      .filter(Boolean);

    if (sections.length === 0) {
      throw new Error('Invalid patch: no diff sections found');
    }

    for (const section of sections) {
      this.applySection(section);
    }
  }

  private applySection(section: string): void {
    const lines = section.split('\n');
    const targetLine = lines.find((line) => line.startsWith('+++ '));
    if (!targetLine) {
      throw new Error('Invalid patch section: missing +++ header');
    }
    const targetPath = targetLine.replace('+++ b/', '').replace('+++ ', '').trim();
    const originalContent = this.readFile(targetPath).split('\n');
    const hunkLines = lines.filter((line) => line.startsWith('@@') || line.startsWith('+') || line.startsWith('-') || line.startsWith(' '));
    const hunks = this.parseHunks(hunkLines);
    const updated = this.applyHunks(originalContent, hunks);
    this.writeFile(targetPath, updated.join('\n'));
  }

  private parseHunks(lines: string[]): Hunk[] {
    const hunks: Hunk[] = [];
    let current: Hunk | undefined;
    for (const line of lines) {
      if (line.startsWith('@@')) {
        const match = /@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
        if (!match) {
          throw new Error(`Invalid hunk header: ${line}`);
        }
        current = {
          originalStart: Number.parseInt(match[1], 10),
          newStart: Number.parseInt(match[3], 10),
          lines: [],
        };
        hunks.push(current);
      } else if (current) {
        current.lines.push(line);
      }
    }
    return hunks;
  }

  private applyHunks(original: string[], hunks: Hunk[]): string[] {
    const result = [...original];
    let offset = 0;

    for (const hunk of hunks) {
      let index = hunk.originalStart - 1 + offset;
      for (const line of hunk.lines) {
        const indicator = line[0];
        const value = line.substring(1);
        switch (indicator) {
          case ' ': {
            index += 1;
            break;
          }
          case '-': {
            if (index >= 0 && index < result.length) {
              result.splice(index, 1);
              offset -= 1;
            }
            break;
          }
          case '+': {
            result.splice(index, 0, value);
            index += 1;
            offset += 1;
            break;
          }
          default:
            break;
        }
      }
    }

    return result;
  }

  private resolvePath(filePath: string): string {
    return path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
  }
}

type Hunk = {
  originalStart: number;
  newStart: number;
  lines: string[];
};
