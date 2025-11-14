# ASIA TUI Features

## ✨ Recently Added Features

### 🎨 Visual Enhancements

#### 1. **Spinner Animations** ⏳
- Added `ink-spinner` package
- Animated dots spinner shows when AI is processing
- Displays "ASIA is thinking..." message with spinner

#### 2. **Better Chat Bubbles** 💬
- Each message now appears in a rounded border box
- Color-coded borders:
  - **Cyan** for user messages
  - **Magenta** for AI responses
  - **Gray** for system messages
- Added padding for better readability

#### 3. **Syntax Highlighting** 📝
- Automatic code block detection using ``` markdown syntax
- Code blocks displayed in:
  - Yellow bordered box
  - Green text for code
  - Language label (e.g., "typescript", "javascript")
- Format: \`\`\`language\\n code \\n\`\`\`

#### 4. **Emoji Support** 🚀
- Role indicators:
  - 👤 USER
  - 🤖 ASIA (AI Assistant)
  - ⚙️ SYSTEM
- Status indicators:
  - ✅ Ready
  - ⏳ Processing
- Welcome message with ✨ and 💡 emojis

#### 5. **Rainbow Gradient Header** 🌈
- Beautiful gradient header using `ink-gradient`
- "🤖 ASIA - AI Coding Assistant" in rainbow colors

## 🎯 Usage

All features work automatically! Just run:

```bash
npm run dev
```

### Code Block Example

When the AI responds with code, it will be highlighted:

\`\`\`typescript
function hello() {
  console.log("Hello, ASIA!");
}
\`\`\`

This will appear in a yellow-bordered box with syntax highlighting!

## 📦 New Dependencies

- `ink-spinner` - Loading animations
- `ink-gradient` - Gradient text effects

## 🎨 Color Scheme

- **Cyan** - User input, user messages
- **Magenta** - AI responses
- **Yellow** - Code blocks, processing state
- **Green** - Code syntax
- **Gray** - System messages, status text
- **Rainbow** - Header gradient
