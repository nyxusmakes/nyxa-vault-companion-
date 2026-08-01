import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView } from 'obsidian';
import { NyxaSettings, DEFAULT_SETTINGS, NyxaSettingTab } from './settings';
import { AskModal } from './ui/AskModal';
import { ChatSidebar, VIEW_TYPE_NYXA } from './ui/ChatSidebar';
import { Indexer } from './indexer';
import { VectorStore } from './vectorStore';
import { EmbeddingsProvider } from './embeddingsProvider';

export default class NyxaPlugin extends Plugin {
  settings: NyxaSettings;
  indexer: Indexer;
  vectorStore: VectorStore;
  embeddings: EmbeddingsProvider;
  chatLeaf: WorkspaceLeaf | null = null;

  async onload() {
    console.log('Loading Nyxa Vault Companion');
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addSettingTab(new NyxaSettingTab(this.app, this));

    this.vectorStore = new VectorStore(this);
    await this.vectorStore.init();

    this.embeddings = new EmbeddingsProvider(this.settings);

    this.indexer = new Indexer(this.app, this.vectorStore, this.settings);
    await this.indexer.init();

    this.addCommand({
      id: 'nyxa-ask-ai',
      name: 'Nyxa: Ask AI',
      callback: () => {
        new AskModal(this.app, this).open();
      }
    });

    this.addCommand({
      id: 'nyxa-open-chat',
      name: 'Nyxa: Open Chat',
      callback: async () => {
        // open the Nyxa view
        const leaf = this.app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW_TYPE_NYXA, active: true });
        this.app.workspace.revealLeaf(leaf);
      }
    });

    this.addCommand({
      id: 'nyxa-reindex',
      name: 'Nyxa: Reindex Vault',
      callback: async () => {
        await this.indexer.indexAll();
        new Notice('Nyxa: Reindex complete');
      }
    });

    this.registerView(VIEW_TYPE_NYXA, (leaf) => new ChatSidebar(leaf, this));

    console.log('Nyxa loaded');
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_NYXA);
    console.log('Nyxa unloaded');
  }
}
