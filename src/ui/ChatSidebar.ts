import { ItemView, WorkspaceLeaf, ButtonComponent } from 'obsidian';
import NyxaPlugin from '../main';
import { ChatSession } from '../chat';

export const VIEW_TYPE_NYXA = 'nyxa-companion-view';

export class ChatSidebar extends ItemView {
  plugin: NyxaPlugin;
  session: ChatSession;

  constructor(leaf: WorkspaceLeaf, plugin: NyxaPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.session = new ChatSession('default');
  }

  getViewType() {
    return VIEW_TYPE_NYXA;
  }

  getDisplayText() {
    return 'Nyxa';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h3', { text: 'Nyxa Companion' });
    const chatEl = container.createEl('div');
    for (const m of this.session.messages) {
      const p = chatEl.createEl('p');
      p.createEl('strong', { text: m.role + ': ' });
      p.appendText(m.content);
    }

    const btn = new ButtonComponent(container);
    btn.setButtonText('Clear');
    btn.onClick(() => {
      this.session.clear();
      this.onOpen();
    });
  }

  async onClose() {
    // cleanup if needed
  }
}
