import { App, PluginSettingTab, Setting } from 'obsidian';

export interface NyxaSettings {
  apiProvider: string;
  openaiApiKey: string;
  ollamaUrl?: string;
  claudeApiUrl?: string;
  claudeApiKey?: string;
  openrouterApiKey?: string;
  openrouterApiUrl?: string;
  googleApiKey?: string;
  googleApiUrl?: string;
  embeddingModel: string;
  llmModel: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  autoEmbedAfterReindex: boolean;
}

export const DEFAULT_SETTINGS: NyxaSettings = {
  apiProvider: 'openai',
  openaiApiKey: '',
  ollamaUrl: '',
  claudeApiUrl: '',
  claudeApiKey: '',
  openrouterApiKey: '',
  openrouterApiUrl: '',
  googleApiKey: '',
  googleApiUrl: '',
  embeddingModel: 'text-embedding-3-small',
  llmModel: 'gpt-4o-mini',
  chunkSize: 500,
  chunkOverlap: 50,
  topK: 6,
  autoEmbedAfterReindex: false
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
      .setDesc('Choose the provider to use for embeddings and LLM calls (openai, ollama, claude, openrouter, google)')
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
      .setName('Ollama URL')
      .setDesc('Local Ollama endpoint base URL (e.g., http://localhost:11434)')
      .addText(text => text
        .setPlaceholder('http://localhost:11434')
        .setValue(this.plugin.settings.ollamaUrl || '')
        .onChange(async (value) => {
          this.plugin.settings.ollamaUrl = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('Claude API URL')
      .setDesc('Claude embedding/chat endpoint URL')
      .addText(text => text
        .setPlaceholder('https://api.anthropic.com/...')
        .setValue(this.plugin.settings.claudeApiUrl || '')
        .onChange(async (value) => {
          this.plugin.settings.claudeApiUrl = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('Claude API Key')
      .setDesc('Claude/Anthropic API key')
      .addText(text => text
        .setPlaceholder('claude-key')
        .setValue(this.plugin.settings.claudeApiKey || '')
        .onChange(async (value) => {
          this.plugin.settings.claudeApiKey = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('OpenRouter API Key')
      .setDesc('OpenRouter API Key (optional)')
      .addText(text => text
        .setPlaceholder('or-...')
        .setValue(this.plugin.settings.openrouterApiKey || '')
        .onChange(async (value) => {
          this.plugin.settings.openrouterApiKey = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('OpenRouter API URL')
      .setDesc('Optional OpenRouter base URL (defaults to https://api.openrouter.ai)')
      .addText(text => text
        .setPlaceholder('https://api.openrouter.ai')
        .setValue(this.plugin.settings.openrouterApiUrl || '')
        .onChange(async (value) => {
          this.plugin.settings.openrouterApiUrl = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('Google API URL')
      .setDesc('Optional Google Vertex AI endpoint URL (for custom setups)')
      .addText(text => text
        .setPlaceholder('https://us-central1-aiplatform.googleapis.com/v1/...')
        .setValue(this.plugin.settings.googleApiUrl || '')
        .onChange(async (value) => {
          this.plugin.settings.googleApiUrl = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('Google API Key')
      .setDesc('Google API key for Vertex AI if needed')
      .addText(text => text
        .setPlaceholder('AIza...')
        .setValue(this.plugin.settings.googleApiKey || '')
        .onChange(async (value) => {
          this.plugin.settings.googleApiKey = value;
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

    new Setting(containerEl)
      .setName('Auto-embed after reindex')
      .setDesc('If enabled, Nyxa will automatically compute embeddings after running Reindex (privacy-sensitive; default: off)')
      .addToggle(tg => tg
        .setValue(this.plugin.settings.autoEmbedAfterReindex)
        .onChange(async (value) => {
          this.plugin.settings.autoEmbedAfterReindex = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
  }
}
