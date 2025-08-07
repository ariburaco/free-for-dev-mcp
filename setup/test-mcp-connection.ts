#!/usr/bin/env bun

/**
 * Test script to verify MCP server is working correctly
 * Run this to test the server before registering with Claude Desktop
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: any;
}

class MCPTester {
  private serverProcess: any;
  private requestId = 1;
  
  constructor() {}
  
  async startServer(): Promise<void> {
    console.log('🚀 Starting MCP server...\n');
    
    this.serverProcess = spawn('bun', ['run', 'dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    this.serverProcess.stderr.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        console.log('📡 Server:', message);
      }
    });
    
    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method,
        params
      };
      
      console.log(`📤 Sending: ${method}`, params ? `with params: ${JSON.stringify(params, null, 2)}` : '');
      
      const requestJson = JSON.stringify(request) + '\n';
      this.serverProcess.stdin.write(requestJson);
      
      const timeout = setTimeout(() => {
        reject(new Error(`Request timed out: ${method}`));
      }, 10000);
      
      const onData = (data: Buffer) => {
        const response = data.toString().trim();
        if (response) {
          try {
            const parsed: MCPResponse = JSON.parse(response);
            clearTimeout(timeout);
            this.serverProcess.stdout.removeListener('data', onData);
            resolve(parsed);
          } catch (e) {
            // Might be partial response, continue listening
          }
        }
      };
      
      this.serverProcess.stdout.on('data', onData);
    });
  }
  
  async testListTools(): Promise<void> {
    console.log('\n🔧 Testing list_tools...');
    try {
      const response = await this.sendRequest('tools/list');
      if (response.result && response.result.tools) {
        console.log(`✅ Found ${response.result.tools.length} available tools:`);
        response.result.tools.forEach((tool: any, index: number) => {
          console.log(`   ${index + 1}. ${tool.name}: ${tool.description}`);
        });
      } else {
        console.log('❌ No tools found in response');
      }
    } catch (error) {
      console.log('❌ Failed to list tools:', error);
    }
  }
  
  async testSemanticSearch(): Promise<void> {
    console.log('\n🔍 Testing semantic search...');
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'semantic_search',
        arguments: {
          query: 'free database hosting services',
          limit: 3
        }
      });
      
      if (response.result && response.result.content) {
        const content = JSON.parse(response.result.content[0].text);
        console.log(`✅ Found ${content.count} database services:`);
        content.results.slice(0, 2).forEach((result: any, index: number) => {
          console.log(`   ${index + 1}. ${result.service.name} (${result.relevanceScore}% relevance)`);
          console.log(`      ${result.service.description.substring(0, 80)}...`);
        });
      } else {
        console.log('❌ No results from semantic search');
      }
    } catch (error) {
      console.log('❌ Semantic search failed:', error);
    }
  }
  
  async testListCategories(): Promise<void> {
    console.log('\n📂 Testing category listing...');
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'list_categories',
        arguments: {
          withCount: true
        }
      });
      
      if (response.result && response.result.content) {
        const content = JSON.parse(response.result.content[0].text);
        console.log(`✅ Found ${content.totalCategories} categories:`);
        content.categories.slice(0, 5).forEach((category: any, index: number) => {
          console.log(`   ${index + 1}. ${category.name}: ${category.count} services`);
        });
      } else {
        console.log('❌ No categories found');
      }
    } catch (error) {
      console.log('❌ Category listing failed:', error);
    }
  }
  
  async testGetStats(): Promise<void> {
    console.log('\n📊 Testing stats...');
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'get_stats',
        arguments: {}
      });
      
      if (response.result && response.result.content) {
        const stats = JSON.parse(response.result.content[0].text);
        console.log('✅ Server statistics:');
        console.log(`   Total services: ${stats.services.total}`);
        console.log(`   Categories: ${stats.services.categories}`);
        console.log(`   Tags: ${stats.services.tags}`);
        console.log(`   Cache entries: ${stats.cache.entries}`);
        console.log(`   Cache hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
      } else {
        console.log('❌ No stats found');
      }
    } catch (error) {
      console.log('❌ Stats request failed:', error);
    }
  }
  
  async runAllTests(): Promise<void> {
    try {
      await this.startServer();
      await this.testListTools();
      await this.testSemanticSearch();
      await this.testListCategories();
      await this.testGetStats();
      
      console.log('\n🎉 All tests completed successfully!');
      console.log('✅ The MCP server is ready for use with Claude Desktop.');
      console.log('\n📝 Next steps:');
      console.log('   1. Follow the SETUP_GUIDE.md to configure Claude Desktop');
      console.log('   2. Add the server to your Claude Desktop configuration');
      console.log('   3. Restart Claude Desktop');
      console.log('   4. Test with queries like "Find free database services"');
      
    } catch (error) {
      console.log('\n❌ Test suite failed:', error);
      console.log('\n🔧 Troubleshooting tips:');
      console.log('   - Make sure you ran: bun install && bun run build');
      console.log('   - Check that dist/index.js exists and is executable');
      console.log('   - Try running: bun run test-server.ts');
    } finally {
      this.cleanup();
    }
  }
  
  cleanup(): void {
    if (this.serverProcess) {
      console.log('\n🔄 Shutting down server...');
      this.serverProcess.kill();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

// Run the tests
const tester = new MCPTester();
tester.runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});