export interface Memory {
  id?: number;
  title: string;
  excerpt: string;
  sourcePath?: string;
  sourceStart?: number;
  sourceEnd?: number;
  tags?: string[];
  importance?: number; // 0-1
  createdAt: number;
  updatedAt: number;
  embedding?: string; // base64 float32
  lastAccessed?: number;
}

export function makeExtractionPrompt(chunkText: string) {
  return `You are Nyxa, an assistant that extracts concise, high-signal memories from a longer note chunk.\n\nReturn a JSON array of 1-3 objects with the following fields: title (short, 3-8 words), excerpt (1-3 short sentences capturing the idea), tags (array of short tags), importance (0.0-1.0 numeric), and why (one short sentence explaining why this matters). Do not include extra commentary.\n\nChunk:\n"""\n${chunkText}\n"""`;
}
