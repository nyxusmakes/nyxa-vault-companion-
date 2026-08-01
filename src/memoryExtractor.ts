import type { Memory, makeExtractionPrompt } from './memory';
import type { EmbeddingsProvider } from './embeddingsProvider';

export class MemoryExtractor {
  provider: EmbeddingsProvider;

  constructor(provider: EmbeddingsProvider) {
    this.provider = provider;
  }

  // Extract memories from a chunk. Returns an array of Memory-like objects (without ids/timestamps).
  async extractFromChunk(chunkText: string, meta: { path?: string; start?: number; end?: number }) {
    const prompt = `You are Nyxa, a calm, mysterious assistant inspired by AURA/VOID.\n\nExtract up to three concise memories from the following text. Output valid JSON only (an array) with objects: {\n  \"title\": string,\n  \"excerpt\": string,\n  \"tags\": string[],\n  \"importance\": number // 0.0-1.0\n}\n\nText:\n"""\n${chunkText}\n"""`;
    // Use chatCompletion to get structured extraction
    try {
      const raw = await this.provider.chatCompletion(prompt, [{ role: 'user', content: prompt }]);
      // Attempt to parse JSON from response
      const jsonStart = raw.indexOf('[');
      const jsonEnd = raw.lastIndexOf(']');
      const jsonText = jsonStart >= 0 && jsonEnd >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;
      const parsed = JSON.parse(jsonText);
      const now = Date.now();
      const memories = (parsed as any[]).map((m) => ({
        title: m.title || (m.excerpt ? (m.excerpt.split('. ')[0] || '').slice(0, 80) : 'Untitled'),
        excerpt: m.excerpt || m.title || '',
        tags: m.tags || [],
        importance: typeof m.importance === 'number' ? m.importance : 0.5,
        sourcePath: meta.path,
        sourceStart: meta.start,
        sourceEnd: meta.end,
        createdAt: now,
        updatedAt: now
      })) as Memory[];
      return memories;
    } catch (e) {
      console.error('Memory extraction failed or returned invalid JSON', e);
      return [];
    }
  }
}
