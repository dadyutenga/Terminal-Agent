# ✨ ASIA - Adaptive Software Intelligence Agent

## 🎉 Major Update: Fully Agentic Capabilities!

ASIA is now a **complete agentic AI coding assistant** with real file manipulation and command execution powers!

---

## 🚀 What ASIA Can Do

### 1. **Create Files** 📝
Ask naturally and ASIA generates professional code:
```
"create a sample html file"
"create styles.css"
"make a new React component"
```

**Features:**
- 🤖 AI-generated professional content
- 📋 Preview before creation
- ✅ Approval-based execution
- 📁 Auto-creates directories

### 2. **Read Files** 📖
View any file with syntax highlighting:
```
"read package.json"
"show me src/index.ts"
"cat README.md"
```

**Features:**
- 📝 Syntax highlighting
- 📏 Line count & file info
- 🎨 Language detection
- ⚡ Instant access

### 3. **Modify Files** ✏️
Edit files with AI assistance:
```
"modify index.html"
"update the title to 'My Site'"
```

**Features:**
- 📄 Shows current content
- 🤖 AI-powered edits
- 💾 Automatic backups
- 🔄 Rollback support

### 4. **Delete Files** 🗑️
Safely remove files:
```
"delete temp.txt"
"remove old-file.js"
```

**Features:**
- 💾 Automatic backup before deletion
- 🚨 Extra confirmation for critical files
- 📊 Shows file size
- ✅ Requires approval

### 5. **Run Commands** ⚡
Execute ANY shell command:
```
"run command: npm test"
"do a dir"
"list files"
"git status"
```

**Features:**
- 🛡️ Dangerous command detection
- ⏱️ Timeout protection
- 📊 Formatted output
- 📝 Execution logging

---

## 🛡️ Safety-First Design

**ASIA NEVER acts without your permission!**

Every file operation or command goes through:

1. 🔍 **Detection** - ASIA understands your intent
2. 🤖 **Generation** - AI creates the content/plan
3. 📋 **Preview** - Shows EXACTLY what will happen
4. ⏳ **Approval** - Waits for your "yes" or "no"
5. ✅ **Execution** - Only proceeds if you approve
6. 📊 **Confirmation** - Shows the result

### Danger Levels

| Level | Operations | Approval |
|-------|-----------|----------|
| ✅ **Safe** | Reading files | Optional |
| ⚠️ **Caution** | Creating/modifying files | Required |
| 🚨 **Dangerous** | Deleting files, running commands | Required + Warnings |

---

## 💡 Usage Examples

### Example 1: Create a Website

```
YOU: create a sample html file

ASIA: [Shows preview of professional HTML5 file with 119 lines]
      ⚠️ This action requires approval.
      Reply with "yes" to create the file or "no" to cancel.

YOU: yes

ASIA: ✅ Successfully executed create_file
      File created: index.html
```

### Example 2: Run Tests

```
YOU: run command: npm test

ASIA: [Shows command preview with timeout info]
      ⚠️ This action requires approval.
      Reply with "yes" to proceed or "no" to cancel.

YOU: yes

ASIA: ✅ Command executed successfully
      
      stdout:
      PASS src/utils.test.js
      ✓ should work (2 ms)
      
      exit code: 0
```

### Example 3: File Workflow

```
YOU: create test.js
ASIA: [Preview] Reply with "yes"
YOU: yes
ASIA: ✅ Created test.js

YOU: modify test.js
ASIA: What would you like to change?
YOU: add console.log("Hello")
ASIA: [Preview] Reply with "yes"
YOU: yes
ASIA: ✅ Modified test.js

YOU: run command: node test.js
ASIA: [Preview] Reply with "yes"
YOU: yes
ASIA: ✅ Output: Hello

YOU: delete test.js
ASIA: [Preview with backup info] Reply with "yes"
YOU: yes
ASIA: ✅ Deleted test.js (backup created)
```

---

## 🎯 Quick Start

### Installation
```bash
npm install
```

### Setup
1. Create `.env` file:
```env
GEMINI_API_KEY=your_key_here
```

2. Run ASIA:
```bash
npm run dev
```

### First Commands to Try
```
"create a simple html file"
"list files"
"read package.json"
"run command: npm --version"
```

---

## 📚 Documentation

- [**🚀 Commands & Modifications Guide**](./docs/COMMANDS_AND_MODIFICATIONS.md) - How to run commands and modify files
- [**🤖 Agentic Features**](./docs/AGENTIC_FEATURES.md) - Complete technical guide to the tool system
- [**📖 File Reading**](./docs/FILE_READING.md) - File reading capabilities
- [**📋 Implementation Summary**](./docs/IMPLEMENTATION_SUMMARY.md) - Full technical details

---

## 🔧 Architecture

### Tool System
```
src/tools/
├── types.ts              # Type definitions
├── base-tool.ts          # Base class
├── registry.ts           # Tool discovery
├── approval-manager.ts   # Approval workflow
├── plan-generator.ts     # Action plans
├── read-file-tool.ts     # File reading
├── write-file-tool.ts    # File modification
├── create-file-tool.ts   # File creation
├── delete-file-tool.ts   # File deletion
└── run-command-tool.ts   # Command execution
```

### Workflow
```
User Input → Intent Detection → LLM Processing
    ↓
Action Plan Generation → Preview Creation
    ↓
Pending Action Storage → User Approval
    ↓
Tool Execution → Result Logging → Confirmation
```

---

## 🛡️ Security Features

### Path Validation
- ✅ All file paths validated against project root
- ❌ Cannot access files outside project
- ❌ Path traversal blocked (`../../../etc/passwd`)

### Command Safety
Dangerous patterns detected:
- `rm -rf`, `sudo`, `chmod`, `shutdown`, etc.
- Extra warnings for risky operations
- Timeout protection (60s default)

### File Protection
Critical files need extra confirmation:
- `.env`, `package.json`, `tsconfig.json`
- Lock files, Git config files
- Automatic backups before modification/deletion

### Execution History
- All actions logged with timestamps
- Rollback support for file operations
- Command output preserved
- Audit trail for compliance

---

## 🌟 Features

### AI-Powered Content Generation
- **HTML:** Valid HTML5 with semantic structure, styling, and meaningful content
- **CSS:** Modern responsive design with professional color schemes
- **JavaScript/TypeScript:** Clean, documented code with modern syntax
- **Other:** Context-aware content for any file type

### Natural Language Understanding
Ask in plain English:
- "create a html file" ✅
- "list the files here" ✅
- "run the tests" ✅
- "delete that temp file" ✅

### Smart Intent Detection
ASIA understands:
- Multiple phrasings for the same action
- Platform-specific commands (dir vs ls)
- Conversational requests
- Implied actions from context

---

## 🔮 Coming Soon

### Short Term
- [ ] Diff view for file modifications
- [ ] Multi-file operations
- [ ] Command history and replay
- [ ] Visual progress indicators

### Long Term
- [ ] Git integration (auto-commit approved changes)
- [ ] Interactive editing mode
- [ ] Batch approvals
- [ ] Command aliases and templates
- [ ] Real-time command output streaming

---

## 🐛 Troubleshooting

### "require is not defined" Error
✅ **Fixed!** ES module imports now used throughout.

### File Not Created
1. Check if you approved with "yes"
2. Verify project directory permissions
3. Check terminal output for errors

### Commands Not Running
1. Ensure you replied with "yes" to approve
2. Check if command exists on your system
3. Verify working directory is correct

### Terminal Flickering
This can happen with long AI responses. Working on optimization.

---

## 🤝 Contributing

ASIA is built with:
- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment
- **Ink** - React for CLIs
- **Gemini AI** - LLM for content generation

Want to contribute? Check out the docs and submit a PR!

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎉 Acknowledgments

Built with modern patterns:
- Clean architecture with dependency injection
- Tool-based plugin system
- Approval-first safety model
- Comprehensive error handling

---

## 💬 Get Help

Having issues? Check:
1. [Commands & Modifications Guide](./docs/COMMANDS_AND_MODIFICATIONS.md)
2. [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)
3. [Agentic Features](./docs/AGENTIC_FEATURES.md)

---

## ⚡ Status

**Current Version:** 0.1.0 (Agentic Release)

**Capabilities:**
- ✅ File Creation (with AI generation)
- ✅ File Reading (with syntax highlighting)
- ✅ File Modification (guided workflow)
- ✅ File Deletion (with backups)
- ✅ Command Execution (with safety checks)
- ✅ Approval Workflow (always safe)
- ✅ History Tracking (full audit trail)
- ✅ Rollback Support (for file ops)

**Status:** Production Ready 🚀

---

**Remember:** ASIA is your assistant, not an autonomous agent. You're always in control! 🎮
