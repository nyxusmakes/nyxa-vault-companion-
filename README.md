# Nyxa Vault Companion

An AI companion for Obsidian. This plugin provides a chat sidebar, vault indexing into a local vector store (IndexedDB via Dexie), and a provider-abstraction layer to query multiple LLM/embedding providers.

Installation
1. Clone this repo and switch to the `nyxa/obsidian-plugin` branch.
2. npm install
3. npm run build
4. Copy the `dist` and `manifest.json` into your Obsidian plugins folder (or use the developer mode to load the plugin directory).

Configuration
- Open Settings → Community Plugins → Nyxa Vault Companion and enter API keys for providers you want to use.

Privacy
- Note text and derived embeddings are sent to external providers when you enable them. Use local endpoints if you need local-only operation.

Roadmap
- Long-term memory, ambient resurfacing, knowledge graph, ANN indexing.
