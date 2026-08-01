import type { NyxaSettings } from './settings';

export class EmbeddingsProvider {
  settings: NyxaSettings;

  constructor(settings: NyxaSettings) {
    this.settings = settings;
  }

  async embed(text: string): Promise<number[]> {
    // default to OpenAI embeddings
    if (this.settings.apiProvider === 'openai') {
      return this.openaiEmbed(text);
    }
    throw new Error('Provider not implemented');
  }

  async openaiEmbed(text: string): Promise<number[]> {
    const key = this.settings.openaiApiKey;
    if (!key) throw new Error('OpenAI API key not set');
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: this.settings.embeddingModel, input: text })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAI embed failed: ${txt}`);
    }
    const data = await res.json();
    return data.data[0].embedding as number[];
  }

  async chatCompletion(systemPrompt: string, messages: { role: string; content: string }[], model?: string) {
    if (this.settings.apiProvider === 'openai') {
      return this.openaiChat(systemPrompt, messages, model || this.settings.llmModel);
    }
    throw new Error('chat provider not implemented');
  }

  async openaiChat(systemPrompt: string, messages: { role: string; content: string }[], model: string) {
    const key = this.settings.openaiApiKey;
    if (!key) throw new Error('OpenAI API key not set');
    const payload = { model, messages: [{ role: 'system', content: systemPrompt }, ...messages] };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAI chat failed: ${txt}`);
    }
    const data = await res.json();
    return data.choices[0].message.content as string;
  }
}
