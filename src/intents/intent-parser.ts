export type IntentType =
  | 'explain'
  | 'refactor'
  | 'run'
  | 'git'
  | 'create-file'
  | 'modify-file'
  | 'delete-file'
  | 'read-file'
  | 'run-command'
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
  { type: 'create-file', patterns: [/create (?:new )?(?:a )?file/i, /new file/i, /make (?:a )?file/i] },
  { type: 'modify-file', patterns: [/modify (?:the )?file/i, /update (?:the )?file/i, /change (?:the )?file/i, /edit (?:the )?file/i, /write to/i] },
  { type: 'delete-file', patterns: [/delete (?:the )?file/i, /remove (?:the )?file/i, /rm\s+/i] },
  { type: 'read-file', patterns: [/^(read|open|view|show|cat|display)\s+/i, /show (?:me )?(?:the )?file/i, /open (?:the )?file/i] },
  { type: 'run-command', patterns: [/run command/i, /execute command/i, /shell/i] },
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
      // Extract file path and optionally content
      const patterns = [
        /create (?:new )?(?:a )?file\s+(?:called\s+|named\s+)?([^\s]+)/i,
        /new file\s+([^\s]+)/i,
        /make (?:a )?file\s+([^\s]+)/i,
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
          return { type: 'create-file', arguments: { path: match[1].trim() } };
        }
      }
    }

    if (matched.type === 'modify-file') {
      const patterns = [
        /(?:modify|update|change|edit) (?:the )?file\s+([^\s]+)/i,
        /write to (?:file\s+)?([^\s]+)/i,
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
          return { type: 'modify-file', arguments: { path: match[1].trim() } };
        }
      }
    }

    if (matched.type === 'delete-file') {
      const patterns = [
        /(?:delete|remove) (?:the )?file\s+([^\s]+)/i,
        /rm\s+([^\s]+)/i,
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
          return { type: 'delete-file', arguments: { path: match[1].trim() } };
        }
      }
    }

    if (matched.type === 'run-command') {
      const patterns = [
        /run command:?\s+(.+)/i,
        /execute command:?\s+(.+)/i,
        /shell:?\s+(.+)/i,
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
          return { type: 'run-command', arguments: { command: match[1].trim() } };
        }
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

    if (matched.type === 'read-file') {
      // Try to extract file path from various patterns
      const patterns = [
        /^(?:read|open|view|show|cat|display)\s+(?:file\s+)?(.+?)$/i,
        /show (?:me )?(?:the )?file\s+(.+?)$/i,
        /open (?:the )?file\s+(.+?)$/i,
        /(?:read|view)\s+(.+?)$/i,
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
          const filePath = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
          return { type: 'read-file', arguments: { path: filePath } };
        }
      }

      // If no specific pattern matched, return generic read-file intent
      return { type: 'read-file' };
    }

    return { type: matched.type };
  }
}
