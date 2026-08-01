import type { NyxaSettings } from './settings';

export class EmbeddingsProvider {
  settings: NyxaSettings;

  constructor(settings: NyxaSettings) {
    this.settings = settings;
  }

  async embed(text: string): Promise<number[]> {
    switch (this.settings.apiProvider) {
      case 'openai':
        return this.openaiEmbed(text);
      case 'ollama':
        return this.ollamaEmbed(text);
      case 'claude':
        return this.claudeEmbed(text);
      case 'openrouter':
        return this.openrouterEmbed(text);
      case 'google':
        return this.googleEmbed(text);
      default:
        throw new Error(`Embeddings: provider ${this.settings.apiProvider} not implemented`);
    }
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

  async ollamaEmbed(text: string): Promise<number[]> {
    const url = this.settings.ollamaUrl;
    if (!url) throw new Error('Ollama URL not set in settings');
    const res = await fetch(url.replace(/\/$/, '') + '/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.settings.embeddingModel, input: text })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama embed failed: ${txt}`);
    }
    const data = await res.json();
    const emb = data?.embeddings?.[0]?.embedding || data?.data?.[0]?.embedding;
    if (!emb) throw new Error('Ollama embed: unexpected response shape');
    return emb as number[];
  }

  async claudeEmbed(text: string): Promise<number[]> {
    const url = this.settings.claudeApiUrl;
    const key = this.settings.claudeApiKey;
    if (!url) throw new Error('Claude API URL not set in settings');
    if (!key) throw new Error('Claude API key not set in settings');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: this.settings.embeddingModel, input: text })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Claude embed failed: ${txt}`);
    }
    const data = await res.json();
    const emb = data?.data?.[0]?.embedding || data?.embedding;
    if (!emb) throw new Error('Claude embed: unexpected response shape');
    return emb as number[];
  }

  async openrouterEmbed(text: string): Promise<number[]> {
    const key = this.settings.openrouterApiKey;
    const base = this.settings.openrouterApiUrl || 'https://api.openrouter.ai';
    if (!key) throw new Error('OpenRouter API key not set in settings');
    const res = await fetch(base.replace(/\/$/, '') + '/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: this.settings.embeddingModel, input: text })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenRouter embed failed: ${txt}`);
    }
    const data = await res.json();
    return data?.data?.[0]?.embedding || data?.embedding;
  }

  async googleEmbed(text: string): Promise<number[]> {
    const url = this.settings.googleApiUrl;
    const key = this.settings.googleApiKey;
    if (!url) throw new Error('Google API URL not set in settings');
    if (!key) throw new Error('Google API key not set in settings');
    const res = await fetch(`${url.replace(/\/$/, '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ instances: [{ content: text }] })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Google embed failed: ${txt}`);
    }
    const data = await res.json();
    // Expecting a response shape containing embeddings; adapt as needed for your endpoint
    const emb = data?.predictions?.[0]?.embedding || data?.data?.[0]?.embedding;
    if (!emb) throw new Error('Google embed: unexpected response shape');
    return emb as number[];
  }

  async chatCompletion(systemPrompt: string, messages: { role: string; content: string }[], model?: string) {
    switch (this.settings.apiProvider) {
      case 'openai':
        return this.openaiChat(systemPrompt, messages, model || this.settings.llmModel);
      case 'ollama':
        return this.ollamaChat(systemPrompt, messages, model || this.settings.llmModel);
      case 'claude':
        return this.claudeChat(systemPrompt, messages, model || this.settings.llmModel);
      case 'openrouter':
        return this.openrouterChat(systemPrompt, messages, model || this.settings.llmModel);
      case 'google':
        return this.googleChat(systemPrompt, messages, model || this.settings.llmModel);
      default:
        throw new Error('chat provider not implemented');
    }
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

  async ollamaChat(systemPrompt: string, messages: { role: string; content: string }[], model: string) {
    const url = this.settings.ollamaUrl;
    if (!url) throw new Error('Ollama URL not set in settings');
    const payload = { model, messages: [{ role: 'system', content: systemPrompt }, ...messages] };
    const res = await fetch(url.replace(/\/$/, '') + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama chat failed: ${txt}`);
    }
    const data = await res.json();
    return data?.response || data?.output || data?.choices?.[0]?.message?.content || JSON.stringify(data);
  }

  async claudeChat(systemPrompt: string, messages: { role: string; content: string }[], model: string) {
    const url = this.settings.claudeApiUrl;
    const key = this.settings.claudeApiKey;
    if (!url) throw new Error('Claude API URL not set in settings');
    if (!key) throw new Error('Claude API key not set in settings');
    const payload = { model, messages: [{ role: 'system', content: systemPrompt }, ...messages] };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Claude chat failed: ${txt}`);
    }
    const data = await res.json();
    return data?.output || data?.choices?.[0]?.message?.content || JSON.stringify(data);
  }

  async openrouterChat(systemPrompt: string, messages: { role: string; content: string }[], model: string) {
    const key = this.settings.openrouterApiKey;
    const base = this.settings.openrouterApiUrl || 'https://api.openrouter.ai';
    if (!key) throw new Error('OpenRouter API key not set in settings');
    const payload = { model, messages: [{ role: 'system', content: systemPrompt }, ...messages] };
    const res = await fetch(base.replace(/\/$/, '') + '/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenRouter chat failed: ${txt}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || JSON.stringify(data);
  }

  async googleChat(systemPrompt: string, messages: { role: string; content: string }[], model: string) {
    const url = this.settings.googleApiUrl;
    const key = this.settings.googleApiKey;
    if (!url) throw new Error('Google API URL not set in settings');
    if (!key) throw new Error('Google API key not set in settings');
    const payload = { instances: [{ context: systemPrompt + '\n' + messages.map(m => m.role + ': ' + m.content).join('\n') }] };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Google chat failed: ${txt}`);
    }
    const data = await res.json();
    return data?.predictions?.[0]?.content || JSON.stringify(data);
  }
}
