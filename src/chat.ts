export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export class ChatSession {
  key: string;
  messages: ChatMessage[] = [];

  constructor(key: string) {
    this.key = key;
    const raw = localStorage.getItem(`nyxa.chat.${key}`);
    if (raw) {
      this.messages = JSON.parse(raw);
    }
  }

  add(role: ChatMessage['role'], content: string) {
    const msg: ChatMessage = { role, content, timestamp: Date.now() };
    this.messages.push(msg);
    this.save();
  }

  save() {
    localStorage.setItem(`nyxa.chat.${this.key}`, JSON.stringify(this.messages));
  }

  clear() {
    this.messages = [];
    this.save();
  }
}
