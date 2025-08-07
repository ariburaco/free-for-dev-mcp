#!/bin/bash

# Setup script for Claude Desktop MCP configuration

echo "🚀 Setting up free-for-dev MCP server for Claude Desktop..."

# Get the current directory
CURRENT_DIR=$(pwd)

# Build the project first
echo "📦 Building the project..."
bun run build

# Create Claude config directory if it doesn't exist
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
mkdir -p "$CLAUDE_CONFIG_DIR"

# Check if config file exists
CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

if [ -f "$CONFIG_FILE" ]; then
    echo "⚠️  Claude config already exists. Creating backup..."
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Read existing config
    EXISTING_CONFIG=$(cat "$CONFIG_FILE")
    echo "Current config backed up to: $CONFIG_FILE.backup.*"
else
    EXISTING_CONFIG='{}'
fi

# Create new config with our MCP server
cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "free-for-dev": {
      "command": "bun",
      "args": ["run", "$CURRENT_DIR/dist/index.js"]
    }
  }
}
EOF

echo "✅ Claude Desktop configuration created at: $CONFIG_FILE"
echo ""
echo "📝 Configuration contents:"
cat "$CONFIG_FILE"
echo ""
echo "🎯 Next steps:"
echo "1. Restart Claude Desktop application"
echo "2. In Claude, you should now be able to use commands like:"
echo "   - 'Search for free database services'"
echo "   - 'Find alternatives to Heroku'"
echo "   - 'Show me popular API services'"
echo ""
echo "✨ The MCP server will provide access to 1500+ free developer services!"