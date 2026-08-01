import { NyxaSettings } from './settings';
import { EmbeddingsProvider } from './embeddingsProvider';

export class StyleWorker {
  settings: NyxaSettings;
  provider: EmbeddingsProvider;

  constructor(settings: NyxaSettings, provider: EmbeddingsProvider) {
    this.settings = settings;
    this.provider = provider;
  }

  // Compute a style embedding from selected source texts (comma-separated paths in settings.styleSourcePaths)
  async computeStyleEmbeddingFromPaths(pathsCsv: string, fetchText: (path: string) => Promise<string | null>) {
    const paths = (pathsCsv || '').split(',').map(p => p.trim()).filter(Boolean);
    if (paths.length === 0) throw new Error('No paths provided');

    let combined = '';
    for (const p of paths) {
      const t = await fetchText(p);
      if (t) combined += `\n\n${t.slice(0, 2000)}`; // cap
    }
    if (!combined) throw new Error('No text found in provided paths');

    const emb = await this.provider.embed(combined);
    // store base64 float32
    const b64 = float32ToBase64(new Float32Array(emb));
    return b64;
  }
}

function float32ToBase64(f32: Float32Array) {
  const bytes = new Uint8Array(f32.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
