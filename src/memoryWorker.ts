import { VectorStore, ChunkRow } from './vectorStore';
import { EmbeddingsProvider } from './embeddingsProvider';
import { MemoryExtractor } from './memoryExtractor';

export class MemoryWorker {
  store: VectorStore;
  provider: EmbeddingsProvider;
  extractor: MemoryExtractor;
  running: boolean = false;
  batchSize: number;

  constructor(store: VectorStore, provider: EmbeddingsProvider, batchSize = 4) {
    this.store = store;
    this.provider = provider;
    this.extractor = new MemoryExtractor(this.provider);
    this.batchSize = batchSize;
  }

  async runUntilEmpty(onProgress?: (processed: number, remaining: number) => void) {
    if (this.running) return;
    this.running = true;
    let processed = 0;
    try {
      while (true) {
        const chunks = await this.store.getAllChunks();
        // filter chunks that do not yet have associated memories
        const pending = [] as ChunkRow[];
        for (const c of chunks) {
          const mems = await this.store.getMemoriesBySource(c.path, c.start, c.end);
          if (!mems || mems.length === 0) pending.push(c);
        }
        if (pending.length === 0) break;
        const batch = pending.slice(0, this.batchSize);
        await Promise.all(batch.map(async (chunk) => {
          try {
            const extracted = await this.extractor.extractFromChunk(chunk.text, { path: chunk.path, start: chunk.start, end: chunk.end });
            for (const m of extracted) {
              const id = await this.store.addMemory(m);
              // generate embedding for the memory text (title + excerpt)
              const text = `${m.title}\n\n${m.excerpt}`;
              const emb = await this.provider.embed(text);
              const b64 = float32ToBase64(new Float32Array(emb));
              if (id) await this.store.updateMemoryEmbedding(id, b64);
            }
            processed += 1;
          } catch (e) {
            console.error('MemoryWorker failed on chunk', chunk.path, e);
          }
        }));
        if (onProgress) onProgress(processed, Math.max(0, pending.length - batch.length));
        await new Promise((r) => setTimeout(r, 200));
      }
    } finally {
      this.running = false;
    }
  }
}

function float32ToBase64(f32: Float32Array) {
  const bytes = new Uint8Array(f32.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
