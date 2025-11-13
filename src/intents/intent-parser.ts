export type IntentType = 'explain' | 'refactor' | 'run' | 'git' | 'create-file' | 'unknown';

export type ParsedIntent = {
  type: IntentType;
  arguments?: Record<string, string>;
};

const intentMatchers: Array<{ type: IntentType; patterns: RegExp[] }> = [
  { type: 'explain', patterns: [/explain/i, /what does/i, /describe/i] },
  { type: 'refactor', patterns: [/refactor/i, /improve/i, /optimi[sz]e/i] },
  { type: 'run', patterns: [/(run|execute)\b/i, /test/i, /build/i] },
  { type: 'git', patterns: [/git/i, /commit/i, /branch/i, /push/i] },
  { type: 'create-file', patterns: [/create file/i, /new file/i, /write file/i] },
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

    return { type: matched.type };
  }
}
