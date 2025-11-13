export type MemoryEntry = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

export class SessionMemory {
  private history: MemoryEntry[] = [];

  add(entry: MemoryEntry): void {
    this.history.push({ ...entry, timestamp: entry.timestamp ?? Date.now() });
  }

  list(): MemoryEntry[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}
