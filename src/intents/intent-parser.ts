export type IntentType =
  | 'explain'
  | 'refactor'
  | 'run'
  | 'git'
  | 'create-file'
  | 'apply-patch'
  | 'discard-patch'
  | 'unknown';

export type ParsedIntent = {
  type: IntentType;
  arguments?: Record<string, string>;
};

const intentMatchers: Array<{ type: IntentType; patterns: RegExp[] }> = [
  { type: 'explain', patterns: [/explain/i, /what does/i, /describe/i] },
  { type: 'refactor', patterns: [/refactor/i, /improve/i, /optimi[sz]e/i] },
  { type: 'run', patterns: [/(run|execute)\b/i, /test/i, /build/i, /lint/i, /dev/i, /migration/i] },
  { type: 'git', patterns: [/git/i, /commit/i, /branch/i, /push/i, /unstaged/i] },
  { type: 'create-file', patterns: [/create file/i, /new file/i, /write file/i] },
  { type: 'apply-patch', patterns: [/apply patch/i, /accept patch/i] },
  { type: 'discard-patch', patterns: [/discard patch/i, /reject patch/i] },
];

export class IntentParser {
  parse(input: string): ParsedIntent {
    const trimmed = input.trim();
    if (!trimmed) {
      return { type: 'unknown' };
    }

    const matched = intentMatchers.find(({ patterns }) => patterns.some((pattern) => pattern.test(trimmed)));

    if (!matched) {
      return { type: 'unknown' };
    }

    if (matched.type === 'run') {
      const normalized = trimmed.toLowerCase();
      if (/\bbuild\b/.test(normalized)) {
        return { type: 'run', arguments: { script: 'build' } };
      }
      if (/\bdev\b/.test(normalized)) {
        return { type: 'run', arguments: { script: 'dev' } };
      }
      if (/\btest\b/.test(normalized)) {
        return { type: 'run', arguments: { script: 'test' } };
      }
      if (/\blint\b/.test(normalized)) {
        return { type: 'run', arguments: { script: 'lint' } };
      }
      if (/migration/.test(normalized)) {
        return { type: 'run', arguments: { script: 'migrate' } };
      }

      const commandMatch = trimmed.match(/(?:run|execute)\s+(.+)/i);
      if (commandMatch) {
        return { type: 'run', arguments: { command: commandMatch[1].trim() } };
      }
    }

    if (matched.type === 'create-file') {
      const fileMatch = trimmed.match(/(?:create|new) file\s+([\w./-]+)/i);
      if (fileMatch) {
        return { type: 'create-file', arguments: { path: fileMatch[1].trim() } };
      }
    }

    if (matched.type === 'git') {
      const createBranch = trimmed.match(/create branch\s+([\w./-]+)/i);
      if (createBranch) {
        return { type: 'git', arguments: { action: 'create-branch', name: createBranch[1] } };
      }

      const commitMessage = trimmed.match(/commit(?: with)? message:?\s+(.+)/i);
      if (commitMessage) {
        return { type: 'git', arguments: { action: 'commit', message: commitMessage[1].trim() } };
      }

      if (/show unstaged changes/i.test(trimmed)) {
        return { type: 'git', arguments: { action: 'show-unstaged' } };
      }

      if (/write commit message from diff/i.test(trimmed)) {
        return { type: 'git', arguments: { action: 'generate-commit-message' } };
      }
    }

    if (matched.type === 'explain') {
      const fileMatch = trimmed.match(/file\s+([\w./-]+\.[\w]+)/i);
      const symbolMatch = trimmed.match(/(?:function|class|symbol)\s+([\w]+)/i);
      if (fileMatch || symbolMatch) {
        return {
          type: 'explain',
          arguments: {
            ...(fileMatch ? { path: fileMatch[1] } : {}),
            ...(symbolMatch ? { symbol: symbolMatch[1] } : {}),
          },
        };
      }
    }

    if (matched.type === 'refactor') {
      const fileMatch = trimmed.match(/refactor(?: the)?\s+file\s+([\w./-]+\.[\w]+)/i);
      if (fileMatch) {
        return { type: 'refactor', arguments: { path: fileMatch[1] } };
      }
    }

    return { type: matched.type };
  }
}
