import { Modal, App, Notice } from 'obsidian';
import NyxaPlugin from '../main';

export class AskModal extends Modal {
  plugin: NyxaPlugin;

  constructor(app: App, plugin: NyxaPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: 'Ask Nyxa' });
    const ta = contentEl.createEl('textarea');
    ta.style.width = '100%';
    ta.style.height = '120px';

    const submit = contentEl.createEl('button', { text: 'Ask' });
    submit.onclick = async () => {
      const q = ta.value;
      if (!q) return;
      try {
        const emb = await this.plugin.embeddings.embed(q);
        // retrieve top-K
        const rows = await this.plugin.vectorStore.getTopKByEmbedding(emb, this.plugin.settings.topK);
        let context = '';
        for (const r of rows) {
          context += `\nSource: ${r.path}\n${r.text}\n`;
        }
        const system = `You are Nyxa, a calm, mysterious companion inspired by AURA/VOID. Use the provided vault context to answer clearly.`;
        const answer = await this.plugin.embeddings.chatCompletion(system, [{ role: 'user', content: `${q}\n\nContext:\n${context}` }]);
        // insert into editor if active
        const leaf = this.app.workspace.getActiveViewOfType(this.app.workspace.getActiveViewOfType);
        new Notice('Nyxa answered — see console for result');
        console.log('Nyxa answer:', answer);
        this.close();
      } catch (e) {
        console.error(e);
        new Notice('Nyxa: failed to get answer — check console');
      }
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
