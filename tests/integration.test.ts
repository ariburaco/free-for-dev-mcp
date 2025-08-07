import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

describe('MCP Server Integration Tests', () => {
  let serverProcess: ChildProcess;
  let serverReady = false;

  beforeAll(async () => {
    // Build the server first
    await new Promise<void>((resolve, reject) => {
      const buildProcess = spawn('bun', ['run', 'build'], {
        stdio: 'pipe'
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });

    // Start the MCP server
    serverProcess = spawn('bun', ['run', 'dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Wait for server to be ready
    await new Promise<void>((resolve) => {
      serverProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('running')) {
          serverReady = true;
          resolve();
        }
      });
    });

    await sleep(1000); // Give it a bit more time to fully initialize
  }, 60000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      await sleep(500);
    }
  });

  describe('Server Startup', () => {
    it('should start successfully', () => {
      expect(serverReady).toBe(true);
      expect(serverProcess.killed).toBe(false);
    });
  });

  describe('MCP Protocol', () => {
    const sendRequest = (request: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        const requestStr = JSON.stringify(request) + '\n';
        
        const timeout = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 5000);

        const handleResponse = (data: Buffer) => {
          clearTimeout(timeout);
          try {
            const lines = data.toString().split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('{')) {
                const response = JSON.parse(line);
                resolve(response);
                return;
              }
            }
          } catch (error) {
            reject(error);
          }
        };

        serverProcess.stdout?.once('data', handleResponse);
        serverProcess.stdin?.write(requestStr);
      });
    };

    it('should respond to initialize request', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      const response = await sendRequest(request);
      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('id', 1);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('protocolVersion');
      expect(response.result).toHaveProperty('serverInfo');
    });

    it('should list available tools', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };

      const response = await sendRequest(request);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('tools');
      expect(Array.isArray(response.result.tools)).toBe(true);
      
      const tools = response.result.tools;
      expect(tools.length).toBeGreaterThan(5);
      
      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames).toContain('semantic_search');
      expect(toolNames).toContain('search_services');
      expect(toolNames).toContain('get_similar_services');
      expect(toolNames).toContain('get_popular_services');
      expect(toolNames).toContain('list_categories');
      expect(toolNames).toContain('get_stats');
    });

    it('should execute semantic_search tool', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'semantic_search',
          arguments: {
            query: 'cloud hosting',
            limit: 3
          }
        }
      };

      const response = await sendRequest(request);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('content');
      expect(Array.isArray(response.result.content)).toBe(true);
      
      const content = JSON.parse(response.result.content[0].text);
      expect(content).toHaveProperty('count');
      expect(content).toHaveProperty('results');
      expect(content.results.length).toBeLessThanOrEqual(3);
    }, 30000);

    it('should execute get_stats tool', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'get_stats',
          arguments: {}
        }
      };

      const response = await sendRequest(request);
      expect(response).toHaveProperty('result');
      
      const content = JSON.parse(response.result.content[0].text);
      expect(content).toHaveProperty('services');
      expect(content).toHaveProperty('search');
      expect(content).toHaveProperty('cache');
      expect(content.services.total).toBeGreaterThan(100);
    }, 30000);
  });
});