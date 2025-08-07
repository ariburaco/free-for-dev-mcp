#!/usr/bin/env bun

import { spawn } from 'child_process';

console.log('🧪 Testing free-for-dev MCP server...\n');

const server = spawn('bun', ['run', 'dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let isReady = false;

// Monitor server startup
server.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('Server:', output.trim());
  if (output.includes('running')) {
    isReady = true;
    runTests();
  }
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

async function sendRequest(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);

    server.stdout.once('data', (data) => {
      clearTimeout(timeout);
      try {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          if (line.startsWith('{')) {
            resolve(JSON.parse(line));
            return;
          }
        }
      } catch (err) {
        reject(err);
      }
    });

    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

async function runTests() {
  try {
    console.log('\n📋 Testing MCP Protocol...\n');

    // 1. Initialize
    console.log('1️⃣ Initializing connection...');
    const initResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });
    console.log('✅ Initialized:', initResponse.result.serverInfo);

    // 2. List tools
    console.log('\n2️⃣ Listing available tools...');
    const toolsResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    const tools = toolsResponse.result.tools.map((t: any) => t.name);
    console.log('✅ Available tools:', tools.join(', '));

    // 3. Test semantic search
    console.log('\n3️⃣ Testing semantic search...');
    const searchResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'semantic_search',
        arguments: { query: 'database', limit: 3 }
      }
    });
    const searchResults = JSON.parse(searchResponse.result.content[0].text);
    console.log(`✅ Found ${searchResults.count} results`);
    searchResults.results.forEach((r: any, i: number) => {
      console.log(`   ${i + 1}. ${r.service.name} (${r.relevanceScore}% match)`);
    });

    // 4. Get stats
    console.log('\n4️⃣ Getting statistics...');
    const statsResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_stats',
        arguments: {}
      }
    });
    const stats = JSON.parse(statsResponse.result.content[0].text);
    console.log('✅ Stats:');
    console.log(`   - Total services: ${stats.services.total}`);
    console.log(`   - Categories: ${stats.services.categories}`);
    console.log(`   - Services with tags: ${stats.services.withTags}`);
    console.log(`   - Cache initialized: ${stats.initialized}`);

    console.log('\n🎉 All tests passed! Your MCP server is working correctly.');
    console.log('\n📝 You can now use it in Claude Desktop after restarting the app.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    server.kill();
    process.exit(0);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});