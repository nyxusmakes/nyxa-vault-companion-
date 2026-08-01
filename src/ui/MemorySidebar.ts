import { ItemView, WorkspaceLeaf, ButtonComponent } from 'obsidian';
import NyxaPlugin from '../main';
import { Memory } from '../memory';

export const VIEW_TYPE_NYXA_MEMORIES = 'nyxa-memories-view';

export class MemorySidebar extends ItemView {
  plugin: NyxaPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: NyxaPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_NYXA_MEMORIES;
  }

  getDisplayText() {
    return 'Nyxa Memories';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h3', { text: 'Nyxa — Memories' });

    const list = container.createEl('div');
    const memories = await (this.plugin.vectorStore.getAllMemories ? this.plugin.vectorStore.getAllMemories() : []);
    for (const m of memories) {
      const card = list.createEl('div');
      card.addClass('nyxa-memory-card');
      card.createEl('h4', { text: m.title });
      card.createEl('div', { text: m.excerpt });
      const meta = card.createEl('div');
      meta.createEl('small', { text: `Tags: ${m.tags?.join(', ') || ''} • Importance: ${m.importance || 0}` });

      const openBtn = new ButtonComponent(card);
      openBtn.setButtonText('Open source');
      openBtn.onClick(async () => {
        if (m.sourcePath) {
          // try opening the source note
          this.app.workspace.openLinkText(m.sourcePath, '', false);
        }
      });

      const forgetBtn = new ButtonComponent(card);
      forgetBtn.setButtonText('Forget');
      forgetBtn.onClick(async () => {
        if (m.id) {
          await this.plugin.vectorStore.deleteMemory(m.id);
          this.onOpen();
        }
      });
    }

    const controls = container.createDiv();
    const refresh = new ButtonComponent(controls);
    refresh.setButtonText('Refresh');
    refresh.onClick(() => this.onOpen());
  }

  async onClose() {}
}
