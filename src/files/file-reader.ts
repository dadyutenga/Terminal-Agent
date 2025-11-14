import fs from 'node:fs';
import path from 'node:path';

export type ReadFileResult = {
  success: boolean;
  content?: string;
  error?: string;
  filePath: string;
  relativePath: string;
};

export class FileReader {
  constructor(private readonly projectRoot: string) {}

  /**
   * Read a file from the project directory
   * @param filePath - Can be absolute or relative to project root
   * @returns ReadFileResult with file content or error
   */
  readFile(filePath: string): ReadFileResult {
    try {
      // Resolve the path relative to project root
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.projectRoot, filePath);

      // Security check: ensure the file is within the project root
      const normalizedPath = path.normalize(absolutePath);
      const normalizedRoot = path.normalize(this.projectRoot);
      
      if (!normalizedPath.startsWith(normalizedRoot)) {
        return {
          success: false,
          error: 'Access denied: File is outside project directory',
          filePath: absolutePath,
          relativePath: filePath,
        };
      }

      // Check if file exists
      if (!fs.existsSync(normalizedPath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`,
          filePath: normalizedPath,
          relativePath: filePath,
        };
      }

      // Check if it's a file (not a directory)
      const stats = fs.statSync(normalizedPath);
      if (!stats.isFile()) {
        return {
          success: false,
          error: `Not a file: ${filePath}`,
          filePath: normalizedPath,
          relativePath: filePath,
        };
      }

      // Read the file content
      const content = fs.readFileSync(normalizedPath, 'utf-8');

      return {
        success: true,
        content,
        filePath: normalizedPath,
        relativePath: path.relative(this.projectRoot, normalizedPath),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to read file: ${message}`,
        filePath,
        relativePath: filePath,
      };
    }
  }

  /**
   * Check if a file exists in the project
   * @param filePath - Can be absolute or relative to project root
   */
  fileExists(filePath: string): boolean {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.projectRoot, filePath);

      return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Get file extension
   */
  getExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * Detect language from file extension
   */
  detectLanguage(filePath: string): string {
    const ext = this.getExtension(filePath);
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.json': 'json',
      '.md': 'markdown',
      '.py': 'python',
      '.rs': 'rust',
      '.go': 'go',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.toml': 'toml',
      '.xml': 'xml',
      '.sql': 'sql',
      '.sh': 'bash',
      '.bash': 'bash',
      '.zsh': 'zsh',
      '.fish': 'fish',
    };

    return languageMap[ext] || 'plaintext';
  }
}
