# Free-for-Dev MCP Server Setup Guide

This guide will help you register and test the free-for-dev MCP server locally with Claude Desktop and other AI agents.

## Prerequisites

- **Bun**: Make sure you have Bun installed. If not, install it from [bun.sh](https://bun.sh)
- **Claude Desktop**: Download and install from [claude.ai](https://claude.ai)

## Quick Start

### 1. Install Dependencies and Build

```bash
cd /Users/aliburakozden/Documents/Github/free-for-dev-mcp
bun install
bun run build
```

### 2. Test the Server (Optional but Recommended)

Before registering with Claude Desktop, test that the server works:

```bash
# Run the built-in test
bun run test-server.ts

# Or test manually in development mode
bun run dev
```

## Setting Up with Claude Desktop

### Method 1: Using the Configuration File

1. **Copy the configuration**: Use the provided `claude_desktop_config.json` file as a reference.

2. **Locate Claude Desktop's config directory**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

3. **Edit Claude Desktop's configuration**:
   ```bash
   # On macOS
   code "~/Library/Application Support/Claude/claude_desktop_config.json"
   
   # Or create it if it doesn't exist
   mkdir -p "~/Library/Application Support/Claude"
   ```

4. **Add the MCP server configuration**:
   ```json
   {
     "mcpServers": {
       "free-for-dev": {
         "command": "bun",
         "args": ["run", "/Users/aliburakozden/Documents/Github/free-for-dev-mcp/dist/index.js"],
         "env": {}
       }
     }
   }
   ```

   **Important**: Replace `/Users/aliburakozden/Documents/Github/free-for-dev-mcp` with the actual absolute path to your project.

### Method 2: Using the Global Package (Alternative)

If you want to install globally:

```bash
# In the project directory
bun link

# Then in Claude Desktop config, use:
{
  "mcpServers": {
    "free-for-dev": {
      "command": "free-for-dev-mcp"
    }
  }
}
```

### 3. Restart Claude Desktop

After updating the configuration, completely quit and restart Claude Desktop for the changes to take effect.

### 4. Verify the Setup

1. **Open Claude Desktop**
2. **Look for the MCP indicator**: You should see a small icon or indicator that MCP servers are connected
3. **Test with a query**: Try asking Claude something like:
   - "Search for free database services"
   - "What free hosting services are available?"
   - "Find free API services for developers"

## Available MCP Tools

Once connected, you'll have access to these tools:

### Core Search Tools
- **`semantic_search`**: Advanced semantic search using natural language
- **`search_services`**: Traditional search with filters
- **`get_similar_services`**: Find services similar to a given service
- **`get_popular_services`**: Get the most popular/comprehensive services

### Browse and Discover
- **`list_categories`**: List all service categories with optional counts
- **`list_tags`**: List all available tags
- **`get_service`**: Get detailed information about a specific service

### Data Management
- **`get_stats`**: Get statistics about the service database
- **`refresh_data`**: Refresh data from the GitHub repository

## Testing Commands

You can test the MCP server manually using these example queries in Claude Desktop:

1. **Search for services**: "Find me free database hosting services"
2. **Browse categories**: "What categories of free developer services are available?"
3. **Get specific service info**: "Tell me about Heroku's free tier"
4. **Find alternatives**: "What are some alternatives to Firebase?"

## Using with Other AI Agents

### Cline/Claude Dev Extensions

For VS Code extensions like Cline, add the server to their MCP configuration:

```json
{
  "mcpServers": {
    "free-for-dev": {
      "command": "bun",
      "args": ["run", "/Users/aliburakozden/Documents/Github/free-for-dev-mcp/dist/index.js"]
    }
  }
}
```

### Continue.dev

In Continue.dev configuration (`.continue/config.json`):

```json
{
  "mcpServers": [
    {
      "name": "free-for-dev",
      "command": "bun",
      "args": ["run", "/Users/aliburakozden/Documents/Github/free-for-dev-mcp/dist/index.js"]
    }
  ]
}
```

### Generic MCP Clients

For any MCP-compatible client, use:
- **Command**: `bun`
- **Arguments**: `["run", "/path/to/your/free-for-dev-mcp/dist/index.js"]`
- **Working Directory**: Project root directory

## Troubleshooting

### Common Issues

1. **"Command not found: bun"**
   - Install Bun from [bun.sh](https://bun.sh)
   - Or use Node.js instead: `"command": "node"`

2. **"Cannot find module" errors**
   - Make sure you ran `bun install` and `bun run build`
   - Check that the path in the config is absolute and correct

3. **Server not connecting**
   - Restart Claude Desktop completely
   - Check the Claude Desktop logs (usually in the same config directory)
   - Test the server manually first with `bun run test-server.ts`

4. **Permission errors**
   - Make sure the `dist/index.js` file is executable
   - Check file permissions: `chmod +x dist/index.js`

### Debug Mode

To run the server in debug mode:

```bash
# Development mode with auto-reload
bun run dev

# Or run with debug output
DEBUG=* bun run dist/index.js
```

### Logs

Check Claude Desktop's logs for connection issues:
- **macOS**: `~/Library/Logs/Claude/`
- **Windows**: `%APPDATA%\Claude\logs\`
- **Linux**: `~/.local/share/Claude/logs/`

## Development Workflow

For development and testing:

```bash
# Watch mode for development
bun run dev

# Run tests
bun test

# Build for production
bun run build

# Test the built server
bun run test-server.ts
```

## Security Notes

- The server only makes outbound HTTPS requests to GitHub's API
- No sensitive data is stored or transmitted
- All data is cached locally for performance
- The server runs in read-only mode with no file system modifications

## Getting Help

If you encounter issues:

1. Check this setup guide thoroughly
2. Test the server independently first
3. Verify your Claude Desktop configuration
4. Check the project's README and documentation
5. Look at the example queries and tool definitions

The MCP server provides access to a comprehensive database of free developer tools and services, making it easy to discover and compare options through natural language queries.