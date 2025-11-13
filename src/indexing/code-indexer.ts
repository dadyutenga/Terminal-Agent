import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  ClassDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  Project,
  ProjectOptions,
  SyntaxKind,
  VariableDeclaration,
} from 'ts-morph';
import type { TermiMindConfig } from '../config/index.js';
import { cosineSimilarity } from '../utils/math.js';

export type IndexedFile = {
  path: string;
  symbolCount: number;
  exports: string[];
  content: string;
  embedding: number[];
};

const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];

const ensureDir = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const computeEmbedding = (text: string): number[] => {
  const vector = new Array(16).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const charCode = text.charCodeAt(i);
    vector[i % vector.length] += charCode / 255;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
};

export class CodeIndexer {
  private readonly projectRoot: string;
  private readonly databasePath: string;
  private db?: Database.Database;
  private project?: Project;

  constructor(config: TermiMindConfig) {
    this.projectRoot = config.projectRoot;
    this.databasePath = config.databasePath;
  }

  async initialize(): Promise<void> {
    ensureDir(this.databasePath);
    this.db = new Database(this.databasePath);
    this.db.pragma('journal_mode = WAL');
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS files (
          path TEXT PRIMARY KEY,
          symbol_count INTEGER,
          exports TEXT,
          content TEXT,
          embedding TEXT
        )`
      )
      .run();

    const options: ProjectOptions = {
      skipAddingFilesFromTsConfig: true,
      compilerOptions: { allowJs: true },
    };
    const tsConfig = this.findTsConfig();
    if (tsConfig) {
      options.tsConfigFilePath = tsConfig;
    }

    this.project = new Project(options);
  }

  private findTsConfig(): string | undefined {
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    return fs.existsSync(tsconfigPath) ? tsconfigPath : undefined;
  }

  indexProject(): void {
    if (!this.db) throw new Error('Database not initialized');
    if (!this.project) throw new Error('Project not initialized');

    const filePaths = this.walkProject();
    const insert = this.db.prepare(
      `INSERT OR REPLACE INTO files(path, symbol_count, exports, content, embedding) VALUES (@path, @symbol_count, @exports, @content, @embedding)`
    );

    for (const filePath of filePaths) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.projectRoot, filePath);
      const sourceFile = this.project.addSourceFileAtPathIfExists(filePath);
      const exports = sourceFile ? this.extractExports(sourceFile) : [];
      const embedding = computeEmbedding(content);

      insert.run({
        path: relativePath,
        symbol_count: content.length,
        exports: JSON.stringify(exports),
        content,
        embedding: JSON.stringify(embedding),
      });
    }
  }

  search(query: string, limit = 5): IndexedFile[] {
    if (!this.db) throw new Error('Database not initialized');
    const embedding = computeEmbedding(query);
    const rows = this.db.prepare('SELECT * FROM files').all();
    const scored = rows
      .map((row: any) => {
        const vector = JSON.parse(row.embedding) as number[];
        const score = cosineSimilarity(embedding, vector);
        return {
          path: row.path as string,
          symbolCount: row.symbol_count as number,
          exports: JSON.parse(row.exports) as string[],
          content: row.content as string,
          embedding: vector,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ score, ...file }) => file);
  }

  describeFile(relativePath: string, focusSymbol?: string): string {
    if (!this.project) {
      throw new Error('Project not initialized');
    }
    const absolutePath = path.join(this.projectRoot, relativePath);
    let sourceFile = this.project.getSourceFile(absolutePath);
    if (!sourceFile) {
      sourceFile = this.project.addSourceFileAtPathIfExists(absolutePath);
    }

    if (!sourceFile) {
      return `No TypeScript AST available for ${relativePath}.`;
    }

    const descriptions: string[] = [];
    const focus = focusSymbol?.toLowerCase();

    const pushDescription = (label: string, value: string) => {
      descriptions.push(`${label}: ${value}`);
    };

    const functions = sourceFile.getFunctions();
    for (const fn of functions) {
      if (descriptions.length > 12) break;
      if (focus && fn.getName()?.toLowerCase() !== focus) continue;
      pushDescription('function', this.describeFunction(fn));
    }

    const classes = sourceFile.getClasses();
    for (const cls of classes) {
      if (descriptions.length > 12) break;
      if (focus && cls.getName()?.toLowerCase() !== focus) continue;
      pushDescription('class', this.describeClass(cls));
    }

    const interfaces = sourceFile.getInterfaces();
    for (const iface of interfaces) {
      if (descriptions.length > 12) break;
      if (focus && iface.getName()?.toLowerCase() !== focus) continue;
      pushDescription('interface', this.describeInterface(iface));
    }

    const variables = sourceFile.getVariableDeclarations();
    for (const variable of variables) {
      if (descriptions.length > 12) break;
      if (focus && variable.getName().toLowerCase() !== focus) continue;
      pushDescription('variable', this.describeVariable(variable));
    }

    if (descriptions.length === 0) {
      return `No notable declarations found in ${relativePath}.`;
    }

    return descriptions.join('\n');
  }

  private describeFunction(fn: FunctionDeclaration): string {
    const name = fn.getName() ?? 'anonymous';
    const params = fn
      .getParameters()
      .map((param) => `${param.getName()}: ${param.getType().getText()}`)
      .join(', ');
    const returnType = fn.getReturnType().getText();
    return `${name}(${params}) -> ${returnType}`;
  }

  private describeClass(cls: ClassDeclaration): string {
    const name = cls.getName() ?? 'AnonymousClass';
    const heritage = cls
      .getExtends()
      ?.getExpression()
      .getText();
    const methods = cls
      .getMethods()
      .slice(0, 5)
      .map((method) => this.describeMethod(method))
      .join('; ');
    const bases = heritage ? ` extends ${heritage}` : '';
    return `${name}${bases} { ${methods} }`;
  }

  private describeMethod(method: MethodDeclaration): string {
    const params = method
      .getParameters()
      .map((param) => `${param.getName()}: ${param.getType().getText()}`)
      .join(', ');
    const returnType = method.getReturnType().getText();
    return `${method.getName()}(${params}) -> ${returnType}`;
  }

  private describeInterface(iface: InterfaceDeclaration): string {
    const name = iface.getName();
    const properties = iface
      .getProperties()
      .slice(0, 6)
      .map((prop) => `${prop.getName()}: ${prop.getType().getText()}`)
      .join('; ');
    return `${name} { ${properties} }`;
  }

  private describeVariable(variable: VariableDeclaration): string {
    const type = variable.getType().getText();
    const initializer = variable.getInitializer()?.getKind();
    const initializerInfo = initializer ? ` = ${SyntaxKind[initializer]}` : '';
    return `${variable.getName()}: ${type}${initializerInfo}`;
  }

  private walkProject(): string[] {
    const results: string[] = [];
    const stack: string[] = [this.projectRoot];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const stat = fs.statSync(current);
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(current);
        for (const entry of entries) {
          if (entry === 'node_modules' || entry.startsWith('.git')) continue;
          stack.push(path.join(current, entry));
        }
      } else if (SUPPORTED_EXTENSIONS.includes(path.extname(current))) {
        results.push(current);
      }
    }

    return results;
  }

  private extractExports(sourceFile: import('ts-morph').SourceFile): string[] {
    const exports: string[] = [];
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    exportedDeclarations.forEach((declarations, name) => {
      if (name) {
        exports.push(name);
      } else {
        declarations.forEach((declaration) => {
          if (declaration.getKind() === SyntaxKind.DefaultKeyword) {
            exports.push('default');
          }
        });
      }
    });

    return exports;
  }
}
