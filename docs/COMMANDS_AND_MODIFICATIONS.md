# 🚀 Command Execution & File Modification Guide

## ✅ What's Fixed

### 1. **Command Execution** ⚡
ASIA can now run ANY command on your system with your approval!

### 2. **File Modification** ✏️
File modification now properly shows file info and guides you through the process.

### 3. **Better Intent Detection** 🧠
Natural language understanding improved for commands like "do a dir" or "list files".

---

## 🎯 How to Run Commands

### Method 1: Explicit Command Syntax
```
"run command: dir"
"run command: npm test"
"run command: git status"
"execute command: ls -la"
```

### Method 2: Natural Language
```
"do a dir"
"do a ls command"
"list files"
"show files"
"run npm test"
```

### What Happens:
1. 🔍 ASIA detects you want to run a command
2. 📋 Shows you a preview:
   ```
   ============================================================
   📋 ACTION PLAN: Run command: dir
   ============================================================
   
   Execute shell command
   
   ⚠️ Danger Level: 🚨 DANGEROUS
   📊 Total Steps: 1
   ⏱️ Estimated Duration: 10s
   
   ────────────────────────────────────────────────────────────
   STEPS:
   ────────────────────────────────────────────────────────────
   
   [1/1] Run: dir
         ⚡ Run command: dir
            Working directory: C:\Users\DADI\Desktop\Terminal-Agent
   
   ============================================================
   
   ⚠️ This action requires approval.
   Reply with "yes" to proceed or "no" to cancel.
   ```

3. ⏳ Waits for your approval
4. ✅ Executes when you say "yes"
5. 📊 Shows the output

### Safety Features
- ⚠️ Dangerous commands are flagged (rm -rf, sudo, etc.)
- ⏱️ 60-second timeout by default
- 🚨 Requires explicit approval
- 📝 Command execution is logged

---

## ✏️ How to Modify Files

### Step 1: Initiate Modification
```
"modify index.html"
"update src/config.ts"
"change package.json"
"edit README.md"
```

### Step 2: ASIA Shows Current File Info
```
📝 Ready to modify: index.html

📄 Current file info:
   Language: html
   Lines: 119
   Size: 2816 bytes

What would you like to change? Tell me specifically:
  • "Add a new function called X"
  • "Change the title to Y"
  • "Replace line 10 with Z"
  • "Add import statement for A"

Or provide the complete new content for the file.
```

### Step 3: Tell ASIA What to Change
```
"Change the title to 'My Awesome Website'"
"Add a new section with contact information"
"Replace the header background to blue"
```

### Step 4: ASIA Generates Changes
- 🤖 LLM reads current content
- ✨ Generates modified version
- 📋 Shows you a diff/preview
- ⏳ Waits for approval
- ✅ Applies changes after "yes"
- 💾 Creates automatic backup

---

## 📝 Command Examples

### File System Commands

**Windows:**
```
"run command: dir"
"run command: dir /s"
"run command: type package.json"
"run command: copy file1.txt file2.txt"
```

**Unix/Linux/Mac:**
```
"run command: ls"
"run command: ls -la"
"run command: cat package.json"
"run command: cp file1.txt file2.txt"
```

**Cross-Platform:**
```
"list files"           → Automatically uses 'dir' (Windows) or 'ls' (Unix)
"show files"           → Platform-appropriate command
```

### Git Commands
```
"run command: git status"
"run command: git log --oneline"
"run command: git branch"
"run command: git diff"
```

### NPM Commands
```
"run command: npm test"
"run command: npm run dev"
"run command: npm install express"
"run command: npm list"
```

### Node Commands
```
"run command: node -v"
"run command: node script.js"
"run command: npm run build"
```

### Python Commands
```
"run command: python --version"
"run command: python script.py"
"run command: pip list"
```

---

## 🛡️ Safety Guardrails

### Dangerous Command Detection
These patterns trigger extra warnings:
- `rm -rf` (recursive deletion)
- `sudo` (elevated privileges)
- `chmod`, `chown` (permission changes)
- `shutdown`, `reboot` (system control)
- `kill` (process termination)
- `format` (disk formatting)
- `dd if=` (disk writing)
- `/dev/` writes (device access)

### Example: Dangerous Command Warning
```
⚠️ DANGEROUS COMMAND DETECTED: rm -rf node_modules

⚠️ Danger Level: 🚨 DANGEROUS

This command could:
• Delete files permanently
• Modify system settings
• Cause data loss

⚠️ This action requires approval.
Reply with "yes" to proceed or "no" to cancel.
```

### Timeout Protection
- Default: 60 seconds
- Configurable per command
- Prevents hanging processes
- Can be extended for long-running tasks

---

## 🔄 Complete Workflow Example

### Scenario: Create and Run a Script

**Step 1: Create a file**
```
YOU: create test.js

ASIA: [Shows preview of JavaScript file]
      Reply with "yes" to create

YOU: yes

ASIA: ✅ Successfully created test.js
```

**Step 2: Modify the file**
```
YOU: modify test.js

ASIA: What would you like to change?

YOU: Add code that prints "Hello, World!"

ASIA: [Shows preview with console.log added]
      Reply with "yes" to modify

YOU: yes

ASIA: ✅ Successfully modified test.js (backup created)
```

**Step 3: Run the file**
```
YOU: run command: node test.js

ASIA: [Shows command preview]
      Reply with "yes" to execute

YOU: yes

ASIA: ✅ Command executed successfully
      
      stdout:
      Hello, World!
      
      exit code: 0
```

---

## 🎯 Quick Command Reference

| What You Want | What to Say |
|--------------|-------------|
| **List files** | `"do a dir"` or `"list files"` |
| **Run tests** | `"run command: npm test"` |
| **Check Git status** | `"run command: git status"` |
| **Install package** | `"run command: npm install <package>"` |
| **Run build** | `"run command: npm run build"` |
| **Check Node version** | `"run command: node -v"` |
| **View file** | `"read <filename>"` |
| **Create file** | `"create <filename>"` |
| **Modify file** | `"modify <filename>"` |
| **Delete file** | `"delete <filename>"` |

---

## 🐛 Troubleshooting

### Commands Not Executing?

**Check 1: Did you approve?**
- Commands require explicit "yes" approval
- Type exactly: `yes` (not "okay" or "sure")

**Check 2: Is command available?**
- Some commands may not exist on your system
- Try: `"run command: where <command>"` (Windows)
- Try: `"run command: which <command>"` (Unix)

**Check 3: Timeout?**
- Default timeout is 60 seconds
- Long-running commands may be killed
- Check terminal output for timeout messages

### File Modification Not Working?

**Current Limitation:**
File modification is a **two-step process**:

1. First command: `"modify <file>"` → Shows file info
2. Second command: Tell ASIA what to change

**Future Enhancement:**
Will support single-step modifications like:
`"modify index.html and change the title to 'New Title'"`

---

## 📊 Command Execution Details

### What Gets Logged
```typescript
{
  id: "uuid",
  timestamp: Date,
  toolName: "run_command",
  input: {
    command: "dir",
    args: [],
    cwd: "C:\\Users\\DADI\\Desktop\\Terminal-Agent"
  },
  result: {
    status: "success",
    stdout: "...",
    stderr: "",
    exitCode: 0,
    duration: 125
  },
  canRollback: false  // Commands cannot be undone!
}
```

### Output Format
```
command: <command> <args>

stdout:
<command output>

stderr:
<error output if any>

exit code: <0 for success, non-zero for errors>
```

---

## 🚀 What's Next?

### Planned Enhancements

**File Modification:**
- [ ] Diff view showing exact changes
- [ ] Line-by-line editing
- [ ] Find and replace
- [ ] Merge conflict resolution

**Command Execution:**
- [ ] Command history
- [ ] Re-run previous commands
- [ ] Command aliases
- [ ] Background processes
- [ ] Real-time streaming output

**Safety:**
- [ ] Dry-run mode (show what would happen)
- [ ] Undo for file operations
- [ ] Command sandboxing
- [ ] Resource limits

---

## ✅ Testing Checklist

Try these commands to test the functionality:

### Basic Commands
- [ ] `"list files"` or `"do a dir"`
- [ ] `"run command: npm --version"`
- [ ] `"run command: git status"`

### File Operations
- [ ] `"create test.txt"`
- [ ] `"read test.txt"`
- [ ] `"modify test.txt"`
- [ ] `"delete test.txt"`

### Combined Workflow
- [ ] Create a file
- [ ] Modify it
- [ ] Run a command on it
- [ ] Delete it

---

## 🎉 You're Ready!

ASIA is now a **fully capable agentic assistant** that can:

1. ✅ Execute ANY command (with your approval)
2. ✅ Create files with AI-generated content
3. ✅ Read files with syntax highlighting
4. ✅ Guide you through file modifications
5. ✅ Delete files safely with backups
6. ✅ Detect dangerous operations
7. ✅ Track execution history

**Remember:** You're always in control. ASIA will NEVER execute anything without your explicit approval! 🛡️

---

**Pro Tip:** Use natural language! ASIA understands:
- "list the files here"
- "run the tests"
- "check git status"
- "install express package"

No need to memorize exact command syntax! 🎯
