import Dexie from 'dexie';
import type { NyxaSettings } from './settings';

export interface ChunkRow {
  id?: number;
  path: string;
  start: number;
  end: number;
  text: string;
  embedding?: string; // base64 encoded float32
  updatedAt: number;
}

export class VectorStore {
  db: Dexie & { chunks: Dexie.Table<ChunkRow, number> };
  plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.db = new Dexie('nyxa-vector-store') as any;
    this.db.version(1).stores({ chunks: '++id, path, updatedAt' });
    this.db.open().catch((e) => console.error('Failed to open Dexie db', e));
  }

  async init() {
    // noop for now
  }

  async upsertChunks(path: string, chunks: { text: string; meta: any }[]) {
    // remove existing chunks for path then add
    await this.db.chunks.where('path').equals(path).delete();
    const rows: ChunkRow[] = chunks.map((c) => ({ path, start: c.meta.start, end: c.meta.end, text: c.text, updatedAt: Date.now() }));
    await this.db.chunks.bulkAdd(rows);
  }

  async removeByPath(path: string) {
    await this.db.chunks.where('path').equals(path).delete();
  }

  async getAllChunks() {
    return await this.db.chunks.toArray();
  }

  async getTopKByEmbedding(targetEmbedding: number[], k = 6): Promise<ChunkRow[]> {
    // brute-force compute cosine similarity against stored embeddings (if available)
    const rows = await this.db.chunks.toArray();
    // If embeddings are not stored, return empty; embeddings generation happens elsewhere
    const scored: { row: ChunkRow; score: number }[] = [];
    for (const row of rows) {
      if (!row.embedding) continue;
      const emb = base64ToFloat32(row.embedding);
      const score = cosineSimilarity(emb, targetEmbedding);
      scored.push({ row, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((s) => s.row);
  }
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

function base64ToFloat32(b64: string) {
  const binary = atob(b64);
  const len = binary.length;
  const buffer = new ArrayBuffer(len);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) view[i] = binary.charCodeAt(i);
  return new Float32Array(buffer) as any as number[];
}
