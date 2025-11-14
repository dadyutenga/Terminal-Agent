# File Reading Feature

## 🎯 Overview

ASIA now has full file-reading capabilities! You can ask ASIA to read, open, view, or display any file in your project, and it will show you the contents with syntax highlighting.

## ✨ Features

### 🔍 File Reader Module
- **Location**: `src/files/file-reader.ts`
- **Security**: Files are restricted to the project directory
- **Language Detection**: Automatic language detection from file extensions
- **Error Handling**: Clear error messages for missing files, access denied, etc.

### 📝 Supported Commands

ASIA understands many natural ways to ask for file content:

```
read <file>
open <file>
view <file>
show <file>
cat <file>
display <file>
show me the file <file>
open the file <file>
```

### 🎨 Output Format

When you read a file, ASIA displays:
- 📄 **File path** (relative to project root)
- 📝 **Language** (auto-detected)
- 📏 **Line count**
- **Syntax-highlighted content** in a code block

Example output:
```
📄 File: src/index.ts
📝 Language: typescript
📏 Lines: 45

```typescript
import { config } from 'dotenv';
...
```
```

## 🚀 Usage Examples

### Read a TypeScript file
```
read src/index.ts
```

### Open a configuration file
```
open package.json
```

### View a markdown file
```
show README.md
```

### Display a source file
```
view src/services/assistant.ts
```

### Cat a file (Unix-style)
```
cat .env.example
```

## 🔐 Security Features

1. **Path Validation**: Only files within the project directory can be accessed
2. **File Existence Check**: Verifies the file exists before reading
3. **Type Validation**: Ensures the path points to a file, not a directory
4. **Error Messages**: Clear feedback when files can't be accessed

## 🌍 Supported Languages

The file reader automatically detects and highlights these languages:

| Extension | Language |
|-----------|----------|
| `.ts`, `.tsx` | TypeScript |
| `.js`, `.jsx` | JavaScript |
| `.json` | JSON |
| `.md` | Markdown |
| `.py` | Python |
| `.rs` | Rust |
| `.go` | Go |
| `.java` | Java |
| `.c`, `.cpp` | C/C++ |
| `.cs` | C# |
| `.rb` | Ruby |
| `.php` | PHP |
| `.html` | HTML |
| `.css`, `.scss` | CSS/SCSS |
| `.yaml`, `.yml` | YAML |
| `.toml` | TOML |
| `.xml` | XML |
| `.sql` | SQL |
| `.sh`, `.bash`, `.zsh`, `.fish` | Shell scripts |

## 🎯 Intent Detection

The intent parser recognizes file-reading requests using these patterns:
- Commands starting with: `read`, `open`, `view`, `show`, `cat`, `display`
- Phrases like: "show me the file", "open the file"
- Automatic file path extraction from quotes or without

## 📊 Integration

### Runtime Context
File reader is available throughout the application:
```typescript
context.fileReader.readFile('path/to/file.ts')
```

### Assistant Integration
The assistant automatically routes file-reading intents to the file reader and formats the output for display.

## 💡 Tips

1. **Use relative paths**: Paths are relative to the project root
2. **Tab completion**: Use your shell's tab completion for file paths
3. **Quotes optional**: File paths with spaces should be quoted
4. **Case sensitive**: File names are case-sensitive on Unix systems

## 🐛 Error Messages

| Error | Meaning |
|-------|---------|
| `File not found` | The specified file doesn't exist |
| `Access denied: File is outside project directory` | Security: Can't access files outside the project |
| `Not a file` | The path points to a directory |
| `Failed to read file` | General read error (permissions, encoding, etc.) |

## 🔄 Workflow Example

```
👩‍💻 USER
read src/index.ts

ASIA
📄 File: src/index.ts
📝 Language: typescript
📏 Lines: 25

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig } from './config/index.js';
...
```
```

## 🎉 Benefits

- ✅ **No context switching**: Read files without leaving ASIA
- ✅ **Syntax highlighting**: Easy-to-read code
- ✅ **Metadata**: File info at a glance
- ✅ **Natural language**: Use commands you're familiar with
- ✅ **Secure**: Can't access files outside the project
- ✅ **Fast**: Instant file reading

## 🔮 Future Enhancements

Potential improvements for file reading:
- [ ] Read multiple files at once
- [ ] Read specific line ranges (`read index.ts lines 10-20`)
- [ ] Search within files
- [ ] Read files from git history
- [ ] Binary file detection and handling
- [ ] File size warnings for large files
- [ ] Streaming for very large files
