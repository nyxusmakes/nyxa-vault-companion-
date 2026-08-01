import { Modal, App, ButtonComponent } from 'obsidian';

export class EmbeddingModal extends Modal {
  processedEl: HTMLElement;
  remainingEl: HTMLElement;

  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: 'Nyxa: Embedding progress' });
    const progress = contentEl.createEl('div');
    this.processedEl = progress.createEl('div', { text: 'Processed: 0' });
    this.remainingEl = progress.createEl('div', { text: 'Remaining: 0' });

    const cancel = new ButtonComponent(contentEl);
    cancel.setButtonText('Close');
    cancel.onClick(() => this.close());
  }

  setProgress(processed: number, remaining: number) {
    if (this.processedEl) this.processedEl.setText(`Processed: ${processed}`);
    if (this.remainingEl) this.remainingEl.setText(`Remaining: ${remaining}`);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
