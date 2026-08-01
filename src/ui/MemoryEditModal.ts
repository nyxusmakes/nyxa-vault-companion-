import { Modal, App, Setting, TextComponent, ButtonComponent } from 'obsidian';
import NyxaPlugin from '../main';
import type { Memory } from '../memory';

export class MemoryEditModal extends Modal {
  plugin: NyxaPlugin;
  memory: Memory;
  titleInput: TextComponent;
  excerptInput: TextComponent;
  tagsInput: TextComponent;
  importanceInput: TextComponent;

  constructor(app: App, plugin: NyxaPlugin, memory: Memory) {
    super(app);
    this.plugin = plugin;
    this.memory = memory;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: 'Edit Memory' });

    new Setting(contentEl).setName('Title').addText((tc) => {
      tc.setValue(this.memory.title || '');
      this.titleInput = tc;
    });

    new Setting(contentEl).setName('Excerpt').addText((tc) => {
      tc.setValue(this.memory.excerpt || '');
      this.excerptInput = tc;
    });

    new Setting(contentEl).setName('Tags (comma separated)').addText((tc) => {
      tc.setValue((this.memory.tags || []).join(', '));
      this.tagsInput = tc;
    });

    new Setting(contentEl).setName('Importance (0.0-1.0)').addText((tc) => {
      tc.setValue(String(this.memory.importance ?? 0.5));
      this.importanceInput = tc;
    });

    const saveBtn = new ButtonComponent(contentEl);
    saveBtn.setButtonText('Save');
    saveBtn.onClick(async () => {
      const title = this.titleInput.getValue();
      const excerpt = this.excerptInput.getValue();
      const tags = this.tagsInput.getValue().split(',').map((s) => s.trim()).filter(Boolean);
      const importance = Math.max(0, Math.min(1, parseFloat(this.importanceInput.getValue() || '0.5')));
      if (this.memory.id) {
        await this.plugin.vectorStore.updateMemory(this.memory.id, { title, excerpt, tags, importance });
        new Setting(contentEl).setName('Saved').setDesc('Memory updated');
        this.close();
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
