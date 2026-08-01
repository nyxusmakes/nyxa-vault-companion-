import { VectorStore } from './vectorStore';
import { EmbeddingsProvider } from './embeddingsProvider';

export class EmbeddingsWorker {
  store: VectorStore;
  provider: EmbeddingsProvider;
  batchSize: number;
  running: boolean = false;

  constructor(store: VectorStore, provider: EmbeddingsProvider, batchSize = 8) {
    this.store = store;
    this.provider = provider;
    this.batchSize = batchSize;
  }

  async runUntilEmpty(onProgress?: (processed: number, remaining: number) => void) {
    if (this.running) return;
    this.running = true;
    try {
      while (true) {
        const all = await this.store.getAllChunks();
        const pending = all.filter((c) => !c.embedding);
        if (pending.length === 0) break;
        const batch = pending.slice(0, this.batchSize);
        await Promise.all(batch.map(async (chunk) => {
          try {
            const emb = await this.provider.embed(chunk.text);
            const b64 = float32ToBase64(new Float32Array(emb));
            if (chunk.id) await this.store.updateChunkEmbedding(chunk.id, b64);
          } catch (e) {
            console.error('Embedding worker failed for chunk', chunk.id, e);
          }
        }));
        if (onProgress) onProgress(batch.length, pending.length - batch.length);
        // allow a short pause to avoid rate-limits
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
