# TermiMind

TermiMind is a terminal-native, Ink-powered TUI coding assistant that orchestrates code understanding, editing, and project automation for local repositories.

## Features

- **Interactive TUI chat** with an input box and scrollable history.
- **Natural language intent parsing** for explain, refactor, run, git, and file creation workflows.
- **TypeScript-aware code indexing** via `ts-morph`, persisted in a local SQLite database with lightweight embeddings for vector similarity.
- **LLM abstraction layer** supporting OpenAI or self-hosted LLaMA-compatible endpoints.
- **Patch engine and file utilities** for applying unified diffs or generating new files.
- **Git integration** for branch, status, diff, commit, and push workflows.
- **Command executor** that runs build, test, lint, or migration commands inside the target project.
- **Session memory** retaining the latest conversation turns for better follow-up interactions.

## Getting Started

```bash
pnpm install
pnpm run build
pnpm exec asiat --project /path/to/your/project
pnpm exec termimind --project /path/to/your/project
```

During development you can run the CLI directly with TypeScript support:

```bash
pnpm run dev -- --project /path/to/your/project
```

Set the following environment variables as needed:

- `OPENAI_API_KEY` – required for OpenAI provider.
- `TERMIMIND_LLM_PROVIDER` – `openai` (default) or `llama`.
- `TERMIMIND_LLM_MODEL` – override default model name.
- `TERMIMIND_LLM_BASE_URL` – custom endpoint for non-OpenAI providers.

## Architecture Overview

1. **CLI bootstrap** loads configuration and initializes shared services.
2. **Ink TUI** renders chat history, status bar, and command input.
3. **Intent parser** classifies user requests to drive downstream actions.
4. **Code indexer** walks the repository, extracts symbols, and stores embeddings.
5. **Git engine** exposes porcelain status, branching, commits, and push helpers.
6. **LLM gateway** normalizes access to remote or local language models.
7. **Patch system** applies unified diffs and manages file reads/writes.

## Development Notes

- The SQLite database is stored in `data/index.db` by default.
- Embeddings are deterministic and CPU friendly so TermiMind works offline.
- Extend intent handling in `src/tui/app.tsx` to add new behaviors.
- The patch engine expects standard unified diff format when applying patches.

## License

MIT
