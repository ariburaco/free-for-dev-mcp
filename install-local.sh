#!/bin/bash

# Free-for-Dev MCP Server Local Installation Script
echo "🚀 Setting up Free-for-Dev MCP Server locally..."
echo ""

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project directory: $SCRIPT_DIR"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun is installed"

# Install dependencies
echo "📦 Installing dependencies..."
bun install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the project
echo "🔨 Building the project..."
bun run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Make scripts executable
chmod +x dist/index.js
chmod +x test-server.ts
chmod +x test-mcp-connection.ts

# Test the server
echo "🧪 Testing the server..."
bun run test-server
if [ $? -ne 0 ]; then
    echo "❌ Server test failed"
    exit 1
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""

# Detect the OS for Claude Desktop config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    CLAUDE_CONFIG_DIR="$APPDATA/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
else
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
fi

echo "📝 Next steps to register with Claude Desktop:"
echo ""
echo "1. Create or edit Claude Desktop configuration:"
echo "   mkdir -p \"$CLAUDE_CONFIG_DIR\""
echo "   nano \"$CLAUDE_CONFIG_FILE\""
echo ""
echo "2. Add this configuration:"
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"free-for-dev\": {"
echo "         \"command\": \"bun\","
echo "         \"args\": [\"run\", \"$SCRIPT_DIR/dist/index.js\"],"
echo "         \"env\": {}"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "3. Restart Claude Desktop completely"
echo ""
echo "4. Test with queries like:"
echo "   - 'Find free database services'"
echo "   - 'What hosting services are available?'"
echo "   - 'Show me free API services'"
echo ""
echo "📖 For more details, see:"
echo "   - SETUP_GUIDE.md (detailed setup instructions)"
echo "   - example-queries.md (example queries to try)"
echo ""
echo "🔧 Test commands:"
echo "   - bun run test-server    (test basic functionality)"
echo "   - bun run test-mcp       (test MCP protocol)"
echo "   - bun run dev            (development mode)"
echo ""
echo "✨ The MCP server is ready to use!"