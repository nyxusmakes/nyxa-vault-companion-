import { ItemView, WorkspaceLeaf, ButtonComponent, MarkdownView, Notice } from 'obsidian';
import NyxaPlugin from '../main';
import { Memory } from '../memory';
import { MemoryEditModal } from './MemoryEditModal';

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

      const actions = card.createDiv({ cls: 'nyxa-memory-actions' });

      const openBtn = new ButtonComponent(actions);
      openBtn.setButtonText('Open source');
      openBtn.onClick(async () => {
        if (m.sourcePath) {
          try {
            await this.app.workspace.openLinkText(m.sourcePath, '', false);
          } catch (e) {
            console.error('Failed to open source', e);
            new Notice('Failed to open source');
          }
        }
      });

      const editBtn = new ButtonComponent(actions);
      editBtn.setButtonText('Edit');
      editBtn.onClick(() => {
        new MemoryEditModal(this.app, this.plugin, m).open();
      });

      const upvote = new ButtonComponent(actions);
      upvote.setButtonText('Upvote');
      upvote.onClick(async () => {
        if (m.id) {
          const newImportance = Math.min(1, (m.importance || 0.5) + 0.1);
          await this.plugin.vectorStore.updateMemory(m.id, { importance: newImportance });
          await this.plugin.vectorStore.touchMemory(m.id);
          this.onOpen();
        }
      });

      const downvote = new ButtonComponent(actions);
      downvote.setButtonText('Downvote');
      downvote.onClick(async () => {
        if (m.id) {
          const newImportance = Math.max(0, (m.importance || 0.5) - 0.1);
          await this.plugin.vectorStore.updateMemory(m.id, { importance: newImportance });
          await this.plugin.vectorStore.touchMemory(m.id);
          this.onOpen();
        }
      });

      const pinBtn = new ButtonComponent(actions);
      pinBtn.setButtonText('Pin');
      pinBtn.onClick(async () => {
        if (m.id) {
          await this.plugin.vectorStore.pinMemory(m.id);
          await this.plugin.vectorStore.touchMemory(m.id);
          this.onOpen();
        }
      });

      const insertBtn = new ButtonComponent(actions);
      insertBtn.setButtonText('Insert');
      insertBtn.onClick(() => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const text = `# ${m.title}\n\n${m.excerpt}`;
        if (view) {
          view.editor.replaceSelection(text);
          new Notice('Inserted memory into active editor');
        } else {
          new Notice('No active editor to insert into');
        }
      });

      const createBtn = new ButtonComponent(actions);
      createBtn.setButtonText('Create note');
      createBtn.onClick(async () => {
        try {
          const safeTitle = (m.title || 'nyxa-memory').replace(/[^a-z0-9\- ]/gi, '').slice(0, 60) || 'nyxa-memory';
          const path = `${safeTitle}.md`;
          const content = `# ${m.title}\n\n${m.excerpt}\n\n_Source: ${m.sourcePath || 'Nyxa'}_
`;
          await this.app.vault.create(path, content);
          new Notice(`Created note ${path}`);
        } catch (e) {
          console.error('Failed to create note', e);
          new Notice('Failed to create note');
        }
      });

      const forgetBtn = new ButtonComponent(actions);
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
