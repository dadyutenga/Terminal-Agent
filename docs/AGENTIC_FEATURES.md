# 🤖 ASIA Agentic Features

ASIA is now a **fully agentic coding assistant** that can read, create, modify, and delete files, as well as run commands - all with your approval!

## 🌟 Core Capabilities

### 1. **File Creation** 📝
ASIA can create new files with AI-generated content based on your request.

**Examples:**
```
"Create an HTML file"
"Create index.html"
"Make a new CSS file called styles.css"
```

**What happens:**
1. 🧠 ASIA detects you want to create a file
2. 🤖 AI generates appropriate content (HTML boilerplate, CSS reset, etc.)
3. 📋 Shows you a preview of exactly what will be created
4. ⏳ Waits for your approval ("yes" or "no")
5. ✅ Creates the file only after you approve

### 2. **File Reading** 📖
Read any file in your project instantly.

**Examples:**
```
"Read package.json"
"Show me src/index.ts"
"Open README.md"
```

**Output includes:**
- 📄 File path
- 📝 Detected language
- 📏 Line count
- Syntax-highlighted content

### 3. **File Modification** ✏️
Modify existing files with precision (coming soon with full approval flow).

**Examples:**
```
"Modify src/index.ts"
"Update package.json"
```

### 4. **File Deletion** 🗑️
Delete files safely with automatic backups.

**Examples:**
```
"Delete temp.txt"
"Remove old-file.js"
```

**Safety features:**
- ⚠️ Shows file size before deletion
- 💾 Creates backup by default
- 🚨 Extra confirmation for critical files (.env, package.json, etc.)

### 5. **Command Execution** ⚡
Run shell commands with approval.

**Examples:**
```
"Run command: npm test"
"Execute command: git status"
```

## 🛡️ Safety-First Approval Workflow

**ASIA NEVER executes actions automatically!** Every file operation or command goes through an approval process:

### Approval Flow

```
┌─────────────────────┐
│   User Request      │
│ "Create index.html" │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AI Content         │
│  Generation         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Show Preview       │
│  • File path        │
│  • Full content     │
│  • Metadata         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Wait for Approval  │
│  "yes" or "no"?     │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
    yes          no
     │           │
     ▼           ▼
┌─────────┐  ┌──────────┐
│ Execute │  │  Cancel  │
└─────────┘  └──────────┘
```

### Danger Levels

Every action is classified by risk:

- ✅ **Safe** - Read-only operations (reading files)
- ⚠️ **Caution** - Modifying existing content (writing files, creating files)
- 🚨 **Dangerous** - Destructive or system-level actions (deleting files, running commands)

## 🔧 Tool System Architecture

ASIA uses a powerful tool framework:

### Available Tools

1. **ReadFileTool** - Read file contents
   - Category: `file`
   - Requires Approval: ❌ (safe operation)
   - Dangerous: ❌

2. **WriteFileTool** - Modify existing files
   - Category: `file`
   - Requires Approval: ✅
   - Dangerous: ❌
   - Features: Automatic backups, rollback support

3. **CreateFileTool** - Create new files
   - Category: `file`
   - Requires Approval: ✅
   - Dangerous: ❌
   - Features: Auto-create directories

4. **DeleteFileTool** - Delete files
   - Category: `file`
   - Requires Approval: ✅
   - Dangerous: ✅
   - Features: Automatic backups, critical file protection

5. **RunCommandTool** - Execute shell commands
   - Category: `command`
   - Requires Approval: ✅
   - Dangerous: ✅
   - Features: Timeout protection, dangerous pattern detection

### Tool Features

Each tool provides:

- ✅ **Validation** - Input validation before execution
- 📋 **Preview** - Show exactly what will happen
- 🔄 **Rollback** - Undo support (where applicable)
- 📊 **Metadata** - Detailed execution information

## 💡 Smart Content Generation

ASIA uses AI to generate context-aware content:

### HTML Files
```
Request: "Create index.html"

Generated:
- ✅ Valid HTML5 DOCTYPE
- ✅ Semantic structure
- ✅ Meta tags (charset, viewport)
- ✅ Professional styling
- ✅ Meaningful content
```

### CSS Files
```
Request: "Create styles.css"

Generated:
- ✅ CSS reset/normalize
- ✅ Modern responsive patterns
- ✅ Professional color scheme
- ✅ Typography rules
```

### JavaScript/TypeScript
```
Request: "Create app.js"

Generated:
- ✅ Module structure
- ✅ Modern ES6+ syntax
- ✅ Clean, documented code
- ✅ Type definitions (if TS)
```

## 📋 Action Plans

For complex operations, ASIA generates multi-step plans:

```javascript
{
  title: "Create 3 files for web project",
  steps: [
    { tool: "create_file", file: "index.html" },
    { tool: "create_file", file: "styles.css" },
    { tool: "create_file", file: "script.js" }
  ],
  dangerLevel: "caution",
  estimatedDuration: "5s"
}
```

## 🔐 Security Features

### Path Validation
- ✅ All file paths validated against project root
- ❌ Cannot access files outside project directory
- ❌ Path traversal attacks prevented (../)

### Command Safety
Dangerous commands are detected and warned:
- `rm -rf`
- `sudo`
- `chmod`, `chown`
- `shutdown`, `reboot`
- Device access (`/dev/`)

### File Protection
Critical files require extra confirmation:
- `.env`
- `package.json`
- `tsconfig.json`
- Lock files (`pnpm-lock.yaml`, etc.)

## 📜 Execution History

ASIA tracks all executed actions:

```typescript
{
  id: "uuid",
  timestamp: Date,
  toolName: "create_file",
  input: { filePath: "index.html", content: "..." },
  result: { status: "success", ... },
  canRollback: true
}
```

### Rollback Support

Supported for:
- ✅ File creation (delete created file)
- ✅ File modification (restore from backup)
- ✅ File deletion (restore from backup)
- ❌ Command execution (not reversible)

## 🎯 Usage Examples

### Example 1: Create a Web Page

**User:** "Create an HTML file"

**ASIA:**
```
════════════════════════════════════════
📋 ACTION PLAN: Create file: index.html
════════════════════════════════════════

⚠️ Danger Level: ✅ SAFE
📊 Total Steps: 1

────────────────────────────────────────
STEPS:
────────────────────────────────────────

[1/1] Create index.html
      📝 Create file: index.html
         Lines: 12
         Size: 450 bytes

════════════════════════════════════════

📋 FILE CONTENT PREVIEW:
────────────────────────────────────────
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a basic HTML file.</p>
</body>
</html>
────────────────────────────────────────

⚠️ This action requires approval.
Reply with "yes" to create the file or "no" to cancel.
```

**User:** "yes"

**ASIA:**
```
✅ Successfully executed create_file

✅ SUCCESS
```

### Example 2: Delete a File Safely

**User:** "Delete temp.txt"

**ASIA:**
```
⚠️ Danger Level: 🚨 DANGEROUS

🗑️ Delete file: temp.txt (will create backup)
   Size: 1.5 KB

⚠️ This action requires approval.
Use "yes" to proceed or "no" to cancel.

Note: A backup will be created before deletion.
```

## 🚀 Future Enhancements

Planned features:
- [ ] Multi-file operations (create entire project structures)
- [ ] Diff-based modifications (show exact changes before applying)
- [ ] Interactive editing mode
- [ ] Git integration (auto-commit approved changes)
- [ ] Batch approval (approve multiple actions at once)
- [ ] Approval presets (auto-approve certain safe actions)
- [ ] Execution replay (re-run previous actions)

## 🔗 API Reference

### Assistant Methods

```typescript
// Check for pending action
assistant.hasPendingAction(): boolean

// Get pending action details
assistant.getPendingAction(): PendingAction | null

// Execute pending action
await assistant.executePendingAction(): Promise<string>

// Cancel pending action
assistant.cancelPendingAction(): string
```

### Tool Registry

```typescript
// Get all tools
toolRegistry.getAll(): Tool[]

// Execute a tool
await toolRegistry.execute(toolName, input, context): Promise<ToolResult>

// Get preview
await toolRegistry.preview(toolName, input, context): Promise<string>
```

### Approval Manager

```typescript
// Generate plan preview
await approvalManager.generatePlanPreview(plan, context): Promise<string>

// Record execution
approvalManager.recordExecution(toolName, input, result): ExecutionRecord

// Get history
approvalManager.getHistory(limit?): ExecutionRecord[]

// Rollback action
await approvalManager.rollback(recordId, context): Promise<ToolResult>
```

## 📖 Learn More

- [File Reading Guide](./FILE_READING.md)
- [Tool System Architecture](../src/tools/README.md)
- [Safety & Security](./SECURITY.md)

---

**Remember:** ASIA is your assistant, not an autonomous agent. You're always in control! 🎮
