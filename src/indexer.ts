import { App, TFile, Notice } from 'obsidian';
import { VectorStore } from './vectorStore';
import { NyxaSettings } from './settings';

export class Indexer {
  app: App;
  store: VectorStore;
  settings: NyxaSettings;

  constructor(app: App, store: VectorStore, settings: NyxaSettings) {
    this.app = app;
    this.store = store;
    this.settings = settings;
  }

  async init() {
    await this.indexAll();

    this.app.vault.on('modify', async (file) => {
      if (file instanceof TFile) {
        await this.indexFile(file);
      }
    });

    this.app.vault.on('create', async (file) => {
      if (file instanceof TFile) {
        await this.indexFile(file);
      }
    });

    this.app.vault.on('delete', async (file) => {
      if (file instanceof TFile) {
        await this.store.removeByPath(file.path);
      }
    });
  }

  async indexAll() {
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      await this.indexFile(file);
    }
    new Notice('Nyxa: Indexing complete');
  }

  async indexFile(file: TFile) {
    try {
      const content = await this.app.vault.read(file);
      const chunkSize = this.settings.chunkSize || 500;
      const overlap = this.settings.chunkOverlap || 50;
      let start = 0;
      const chunks: { text: string; meta: any }[] = [];
      while (start < content.length) {
        const end = Math.min(start + chunkSize, content.length);
        const text = content.slice(start, end);
        chunks.push({ text, meta: { path: file.path, start, end } });
        start = end - overlap;
        if (start < 0) start = 0;
      }
      await this.store.upsertChunks(file.path, chunks);
    } catch (e) {
      console.error('Nyxa: failed to index file', file.path, e);
    }
  }
}
