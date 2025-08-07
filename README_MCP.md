# Free-for-Dev MCP Server

A Model Context Protocol (MCP) server that provides access to the [free-for-dev](https://github.com/ripienaar/free-for-dev) repository - a comprehensive list of free services and tools for developers.

## Features

- **Search Services**: Search through hundreds of free developer services by query, category, or tags
- **Browse Categories**: List all available service categories with service counts
- **Get Service Details**: Retrieve detailed information about specific services
- **Tag Filtering**: Filter services by tags like `api`, `cloud`, `database`, `hosting`, etc.
- **Auto-refresh**: Refresh data from the source repository on demand

## Installation

```bash
# Install dependencies
bun install

# Build the server
bun run build

# Run in development mode
bun run dev
```

## Available Tools

### `search_services`
Search for free developer services and tools.

Parameters:
- `query` (optional): Search query to filter services
- `category` (optional): Filter by category name
- `tags` (optional): Array of tags to filter by
- `limit` (optional): Maximum number of results (default: 10)

### `list_categories`
List all available service categories.

Parameters:
- `withCount` (optional): Include service count for each category

### `get_service`
Get detailed information about a specific service.

Parameters:
- `name` (optional): Service name to look up
- `url` (optional): Service URL to look up

### `list_tags`
List all available tags across all services.

### `refresh_data`
Refresh the free-for-dev data from the source repository.

## MCP Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "free-for-dev": {
      "command": "bun",
      "args": ["run", "/path/to/free-for-dev-mcp/dist/index.js"]
    }
  }
}
```

## Development

```bash
# Type checking
bun run typecheck

# Build
bun run build

# Development mode with auto-reload
bun run dev
```

## License

MIT