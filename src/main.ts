import { App, Notice } from 'obsidian';
import { NyxaSettings, DEFAULT_SETTINGS } from './settings';
import { Indexer } from './indexer';
import { VectorStore } from './vectorStore';
import { EmbeddingsProvider } from './embeddingsProvider';
import { EmbeddingsWorker } from './embeddingsWorker';
import { MemoryWorker } from './memoryWorker';
import { MemorySidebar, VIEW_TYPE_NYXA_MEMORIES } from './ui/MemorySidebar';
import { AskModal } from './ui/AskModal';
import { ChatSidebar, VIEW_TYPE_NYXA } from './ui/ChatSidebar';
import { EmbeddingModal } from './ui/EmbeddingModal';
import { NyxaSettingTab } from './settings';
import { Plugin } from 'obsidian';

export default class NyxaPlugin extends Plugin {
  settings: NyxaSettings;
  indexer: Indexer;
  vectorStore: VectorStore;
  embeddings: EmbeddingsProvider;
  embeddingsWorker: EmbeddingsWorker;
  memoryWorker: MemoryWorker | null = null;

  async onload() {
    console.log('Loading Nyxa Vault Companion');
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addSettingTab(new NyxaSettingTab(this.app, this));

    this.vectorStore = new VectorStore(this);
    await this.vectorStore.init();

    this.embeddings = new EmbeddingsProvider(this.settings);

    this.embeddingsWorker = new EmbeddingsWorker(this.vectorStore, this.embeddings, 8);
    this.memoryWorker = new MemoryWorker(this.vectorStore, this.embeddings, 4);

    this.indexer = new Indexer(this.app, this.vectorStore, this.settings);
    await this.indexer.init();

    this.addCommand({
      id: 'nyxa-ask-ai',
      name: 'Nyxa: Ask AI',
      callback: () => {
        new AskModal(this.app, this as any).open();
      }
    });

    this.addCommand({
      id: 'nyxa-open-chat',
      name: 'Nyxa: Open Chat',
      callback: async () => {
        const leaf = this.app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW_TYPE_NYXA, active: true });
        this.app.workspace.revealLeaf(leaf);
      }
    });

    this.addCommand({
      id: 'nyxa-open-memories',
      name: 'Nyxa: Open Memories',
      callback: async () => {
        const leaf = this.app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW_TYPE_NYXA_MEMORIES, active: true });
        this.app.workspace.revealLeaf(leaf);
      }
    });

    this.addCommand({
      id: 'nyxa-reindex',
      name: 'Nyxa: Reindex Vault',
      callback: async () => {
        await this.indexer.indexAll();
        new Notice('Nyxa: Reindex complete');
        if (this.settings.autoEmbedAfterReindex) {
          const modal = new EmbeddingModal(this.app);
          modal.open();
          this.embeddingsWorker.runUntilEmpty((processed, remaining) => {
            modal.setProgress(processed, remaining);
            if (remaining <= 0) {
              modal.close();
              new Notice('Nyxa: embeddings complete');
            }
          });
        }
        if (this.settings.autoExtractMemories && this.memoryWorker) {
          const modal = new EmbeddingModal(this.app);
          modal.open();
          this.memoryWorker.runUntilEmpty((processed, remaining) => {
            modal.setProgress(processed, remaining);
            if (remaining <= 0) {
              modal.close();
              new Notice('Nyxa: memory extraction complete');
            }
          });
        }
      }
    });

    this.addCommand({
      id: 'nyxa-start-embedding-worker',
      name: 'Nyxa: Start embedding worker',
      callback: async () => {
        const modal = new EmbeddingModal(this.app);
        modal.open();
        await this.embeddingsWorker.runUntilEmpty((processed, remaining) => {
          modal.setProgress(processed, remaining);
          if (remaining <= 0) {
            modal.close();
            new Notice('Nyxa: embeddings complete');
          }
        });
      }
    });

    this.addCommand({
      id: 'nyxa-start-memory-extraction',
      name: 'Nyxa: Start memory extraction',
      callback: async () => {
        if (!this.memoryWorker) return;
        const modal = new EmbeddingModal(this.app);
        modal.open();
        await this.memoryWorker.runUntilEmpty((processed, remaining) => {
          modal.setProgress(processed, remaining);
          if (remaining <= 0) {
            modal.close();
            new Notice('Nyxa: memory extraction complete');
          }
        });
      }
    });

    this.registerView(VIEW_TYPE_NYXA, (leaf) => new ChatSidebar(leaf, this as any));
    this.registerView(VIEW_TYPE_NYXA_MEMORIES, (leaf) => new MemorySidebar(leaf, this as any));

    console.log('Nyxa loaded');
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_NYXA);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_NYXA_MEMORIES);
    console.log('Nyxa unloaded');
  }
}
