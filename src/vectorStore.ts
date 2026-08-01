import Dexie from 'dexie';
import type { NyxaSettings } from './settings';
import type { Memory } from './memory';

export interface ChunkRow {
  id?: number;
  path: string;
  start: number;
  end: number;
  text: string;
  embedding?: string; // base64 encoded float32
  updatedAt: number;
}

export interface MemoryRow extends Memory {}

export class VectorStore {
  db: Dexie & { chunks: Dexie.Table<ChunkRow, number>; memories: Dexie.Table<MemoryRow, number> };
  plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.db = new Dexie('nyxa-vector-store') as any;
    // add memories table in version 3
    this.db.version(3).stores({ chunks: '++id, path, updatedAt', memories: '++id, sourcePath, updatedAt' });
    this.db.open().catch((e) => console.error('Failed to open Dexie db', e));
  }

  async init() {
    // noop for now
  }

  async upsertChunks(path: string, chunks: { text: string; meta: any }[]) {
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

  async updateChunkEmbedding(id: number, embeddingBase64: string) {
    await this.db.chunks.update(id, { embedding: embeddingBase64, updatedAt: Date.now() });
  }

  async getTopKByEmbedding(targetEmbedding: number[], k = 6): Promise<ChunkRow[]> {
    const rows = await this.db.chunks.toArray();
    const scored: { row: ChunkRow; score: number }[] = [];
    for (const row of rows) {
      if (!row.embedding) continue;
      const emb = base64ToFloat32(row.embedding);
      if (emb.length !== targetEmbedding.length) continue;
      const score = cosineSimilarity(emb, targetEmbedding);
      scored.push({ row, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((s) => s.row);
  }

  // Memories API
  async addMemory(m: Memory): Promise<number | undefined> {
    try {
      const id = await this.db.memories.add(m as MemoryRow);
      return id as number;
    } catch (e) {
      console.error('addMemory failed', e);
      return undefined;
    }
  }

  async updateMemoryEmbedding(id: number, embeddingBase64: string) {
    await this.db.memories.update(id, { embedding: embeddingBase64, updatedAt: Date.now() } as any);
  }

  async getAllMemories(): Promise<MemoryRow[]> {
    return await this.db.memories.orderBy('updatedAt').reverse().toArray();
  }

  async getMemoriesBySource(path: string, start?: number, end?: number) {
    const all = await this.db.memories.where('sourcePath').equals(path).toArray();
    if (typeof start === 'number' && typeof end === 'number') {
      return all.filter((m) => m.sourceStart === start && m.sourceEnd === end);
    }
    return all;
  }

  async deleteMemory(id: number) {
    await this.db.memories.delete(id);
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
  return Array.from(new Float32Array(buffer)) as number[];
}
