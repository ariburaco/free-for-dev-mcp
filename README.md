# @ariburaco/free-for-dev-mcp

[![npm version](https://badge.fury.io/js/@ariburaco%2Ffree-for-dev-mcp.svg)](https://www.npmjs.com/package/@ariburaco/free-for-dev-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful Model Context Protocol (MCP) server that provides semantic search and intelligent access to the [free-for-dev](https://github.com/ripienaar/free-for-dev) repository - a comprehensive list of free services and tools for developers.

## Features

- 🔍 **Semantic Search**: Natural language search using Fuse.js for fuzzy matching
- ⚡ **Smart Caching**: LRU cache for fast responses and persistent disk cache
- 🎯 **Advanced Filtering**: Filter by categories, tags, and custom queries
- 🤖 **AI-Optimized**: Designed specifically for LLM context consumption
- 📊 **Rich Analytics**: Service popularity ranking and similarity matching
- 🚀 **High Performance**: Built with Bun for blazing-fast execution

## Installation

### As an NPM Package

```bash
npm install -g @ariburaco/free-for-dev-mcp
```

### From Source

```bash
# Clone the repository
git clone https://github.com/ariburaco/free-for-dev-mcp.git
cd free-for-dev-mcp

# Install dependencies
bun install

# Build the server
bun run build

# Run the server
bun start
```

## MCP Client Configuration

### Claude Code

**Quick setup with Claude Code:**
```bash
claude mcp add free-for-dev -- npx @ariburaco/free-for-dev-mcp
```

### Cursor IDE

Add to your Cursor MCP configuration in the Cursor Settings

```json
{
  "mcpServers": {
    "free-for-dev": {
      "command": "npx",
      "args": ["@ariburaco/free-for-dev-mcp"]
    }
  }
}
```

### VS Code with Continue

Add to your Continue configuration:

```json
{
  "models": [...],
  "mcpServers": {
    "free-for-dev": {
      "command": "npx",
      "args": ["@ariburaco/free-for-dev-mcp"]
    }
  }
}
```

### Custom MCP Client

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['@ariburaco/free-for-dev-mcp']
});

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
});

await client.connect(transport);

// Use the tools
const result = await client.callTool({
  name: 'semantic_search',
  arguments: {
    query: 'free cloud database with good limits',
    limit: 5
  }
});
```

## Available Tools

### 🔍 `semantic_search`
Advanced natural language search with fuzzy matching and relevance scoring.

```typescript
{
  query: string;      // Natural language search query
  category?: string;  // Filter by category
  tags?: string[];    // Filter by tags
  limit?: number;     // Max results (default: 10, max: 50)
}
```

### 🔎 `search_services`
Traditional keyword-based search.

```typescript
{
  query?: string;     // Search query
  category?: string;  // Filter by category
  tags?: string[];    // Filter by tags
  limit?: number;     // Max results (default: 10)
}
```

### 🔗 `get_similar_services`
Find services similar to a given service based on tags and category.

```typescript
{
  serviceName: string;  // Name of the service
  limit?: number;       // Max results (default: 5)
}
```

### ⭐ `get_popular_services`
Get the most comprehensive and popular free services.

```typescript
{
  limit?: number;  // Number of services (default: 10)
}
```

### 📁 `list_categories`
List all available service categories.

```typescript
{
  withCount?: boolean;  // Include service count per category
}
```

### ℹ️ `get_service`
Get detailed information about a specific service.

```typescript
{
  name?: string;  // Service name
  url?: string;   // Service URL
}
```

### 🏷️ `list_tags`
List all available tags across all services.

### 📊 `get_stats`
Get statistics about the service database and cache.

### 🔄 `refresh_data`
Refresh the data from the GitHub repository.

## Examples

### Finding Cloud Databases

```javascript
// Using semantic search for natural language queries
{
  "tool": "semantic_search",
  "arguments": {
    "query": "cloud database with generous free tier",
    "tags": ["database"],
    "limit": 5
  }
}
```

### Finding Similar Services

```javascript
// Find services similar to Supabase
{
  "tool": "get_similar_services",
  "arguments": {
    "serviceName": "Supabase",
    "limit": 5
  }
}
```

### Getting Popular Services by Category

```javascript
// Get popular API services
{
  "tool": "semantic_search",
  "arguments": {
    "query": "api",
    "category": "APIs, Data, and ML",
    "limit": 10
  }
}
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Run tests with UI
bun run test:ui

# Check types
bun run typecheck

# Build for production
bun run build
```

## Architecture

- **Parser**: Fetches and parses the free-for-dev README from GitHub
- **Search Engine**: Fuse.js-based semantic search with caching
- **Cache Manager**: Two-tier caching (memory + disk) for optimal performance
- **MCP Server**: Implements the Model Context Protocol with 9 specialized tools

## Performance

- ⚡ **Sub-second responses** for cached queries
- 📦 **1,500+ services** indexed and searchable
- 🔄 **24-hour cache** with automatic refresh
- 💾 **Persistent cache** survives server restarts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT - See [LICENSE](LICENSE) file for details.

## Credits

- Data source: [free-for-dev](https://github.com/ripienaar/free-for-dev) by ripienaar
- Built with [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- Powered by [Bun](https://bun.sh/) runtime

## Support

For issues and feature requests, please visit our [GitHub repository](https://github.com/ariburaco/free-for-dev-mcp).

## NPM Package

[![NPM](https://nodei.co/npm/@ariburaco/free-for-dev-mcp.png)](https://www.npmjs.com/package/@ariburaco/free-for-dev-mcp)
