# Model & Provider Selector

## 🎯 New Features

### `/model` Command
Opens an interactive modal to switch between available AI models for the current provider.

**Features:**
- 📋 Shows all available models for the current provider
- ✓ Highlights the currently selected model
- ⌨️ Keyboard navigation (↑/↓ arrows)
- ⚡ Instant switching - no restart required

**Example Models by Provider:**
- **Gemini**: gemini-1.5-flash, gemini-2.0-flash, gemini-2.0-pro
- **OpenAI**: gpt-4.1, gpt-4.1-mini, gpt-5
- **Anthropic**: claude-3.5-haiku, claude-3.5-sonnet
- **Kimi**: kimi-2, kimi-1.5, moonshot-128k
- **Groq**: llama-3.1, mixtral
- **Ollama**: llama3, deepseek-coder, qwen2

### `/provider` Command
Opens an interactive modal to switch AI providers with optional API key configuration.

**Features:**
- 🌐 Lists all available AI providers
- 🔑 API key input for providers that require it
- ✓ Shows current provider
- 🔄 Auto-reloads AI manager after switch
- 💾 Saves configuration for future sessions

**Providers:**
1. **OpenAI** 🔑 - GPT models (requires API key)
2. **Google Gemini** 🔑 - Gemini models (requires API key)
3. **Anthropic** 🔑 - Claude models (requires API key)
4. **Kimi/Moonshot** 🔑 - Kimi models (requires API key)
5. **Groq** 🔑 - Fast inference (requires API key)
6. **Ollama** - Local models (no API key needed)

## 🎮 Usage

### Switch Model
```
/model
```
or
```
/models
```

**Controls:**
- `↑` / `↓` - Navigate through models
- `Enter` - Select model
- `Esc` - Cancel

### Switch Provider
```
/provider
```
or
```
/providers
```

**Controls:**
- `↑` / `↓` - Navigate through providers
- `Enter` - Select provider (and enter API key if required)
- `Esc` - Cancel
- For providers with 🔑: After selection, you'll be prompted to enter an API key

**API Key Input:**
- Enter your API key when prompted
- Press `Enter` to confirm
- Press `Esc` to cancel
- Leave empty and press `Enter` to skip (uses existing key from .env)

## 🎨 UI Features

### Model Selector
- **Double border** in cyan
- **Current model** marked with ✓ and shown in green
- **Selected item** highlighted with cyan background
- Keyboard shortcuts shown at bottom

### Provider Selector
- **Double border** in magenta
- **Providers requiring API keys** marked with 🔑
- **Current provider** marked with ✓ and shown in green
- **API key input** appears in yellow-bordered modal

## 💡 Examples

### Example 1: Switch to Gemini 2.0 Flash
```
User: /model
[Modal opens showing Gemini models]
[Navigate to "gemini-2.0-flash"]
[Press Enter]
System: ✅ Model changed to: gemini-2.0-flash
```

### Example 2: Switch to OpenAI with New API Key
```
User: /provider
[Modal opens showing providers]
[Navigate to "OpenAI"]
[Press Enter]
[API key input modal appears]
User: sk-proj-...
[Press Enter]
System: ✅ Provider changed to: openai (gpt-4.1-mini)
```

### Example 3: Switch to Ollama (No API Key)
```
User: /provider
[Modal opens showing providers]
[Navigate to "Ollama"]
[Press Enter]
System: ✅ Provider changed to: ollama (llama3)
```

## 🔧 Technical Details

### State Management
- Provider and model state tracked in app component
- Automatic UI updates when switching
- Config persists across modal interactions

### AI Manager Reload
When switching providers:
1. Updates config with new provider/API key
2. Creates new AiManager instance
3. Updates assistant with new LLM
4. Refreshes UI with new provider/model info

### Error Handling
- Missing API keys show friendly error messages
- Invalid providers fall back to current selection
- Failed switches revert to previous state

## 📝 Notes

- **Ollama models**: Require Ollama to be running locally (http://localhost:11434)
- **API Keys**: Store in `.env` file for persistence
- **Model availability**: Depends on your API tier/access
- **No restart needed**: Changes apply immediately

## 🚀 Future Enhancements (TODO)

- [ ] Dynamic model loading from Ollama `/api/tags` endpoint
- [ ] Show model descriptions and capabilities
- [ ] Display pricing information
- [ ] Model performance metrics
- [ ] Favorite models quick-select
