import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

export interface NyxaSettings {
  apiProvider: string;
  openaiApiKey: string;
  embeddingModel: string;
  llmModel: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

export const DEFAULT_SETTINGS: NyxaSettings = {
  apiProvider: 'openai',
  openaiApiKey: '',
  embeddingModel: 'text-embedding-3-small',
  llmModel: 'gpt-4o-mini',
  chunkSize: 500,
  chunkOverlap: 50,
  topK: 6
};

import NyxaPlugin from './main';

export class NyxaSettingTab extends PluginSettingTab {
  plugin: NyxaPlugin;

  constructor(app: App, plugin: NyxaPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Nyxa Vault Companion settings' });

    new Setting(containerEl)
      .setName('API Provider')
      .setDesc('Choose the provider to use for embeddings and LLM calls')
      .addText(text => text
        .setPlaceholder('openai')
        .setValue(this.plugin.settings.apiProvider)
        .onChange(async (value) => {
          this.plugin.settings.apiProvider = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('OpenAI API Key (kept in plugin settings)')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.openaiApiKey)
        .onChange(async (value) => {
          this.plugin.settings.openaiApiKey = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('Chunk size')
      .setDesc('Length of text chunks to index')
      .addText(text => text
        .setPlaceholder('500')
        .setValue(String(this.plugin.settings.chunkSize))
        .onChange(async (value) => {
          this.plugin.settings.chunkSize = Number(value) || 500;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('Top K')
      .setDesc('Number of chunks to retrieve for context')
      .addText(text => text
        .setPlaceholder('6')
        .setValue(String(this.plugin.settings.topK))
        .onChange(async (value) => {
          this.plugin.settings.topK = Number(value) || 6;
          await this.plugin.saveData(this.plugin.settings);
        }));
  }
}
