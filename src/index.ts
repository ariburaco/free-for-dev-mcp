#!/usr/bin/env bun

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { FreeForDevParser } from './parser.ts';
import {
  SearchParamsSchema,
  ListCategoriesParamsSchema,
  GetServiceParamsSchema
} from './types.ts';

const parser = new FreeForDevParser();
let isInitialized = false;

async function initializeParser() {
  if (!isInitialized) {
    try {
      await parser.fetchContent();
      parser.parseMarkdown();
      isInitialized = true;
      console.error('Free-for-dev data loaded successfully');
    } catch (error) {
      console.error('Failed to initialize parser:', error);
      throw error;
    }
  }
}

const server = new Server(
  {
    name: 'free-for-dev-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS: Tool[] = [
  {
    name: 'search_services',
    description: 'Search for free developer services and tools',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to filter services'
        },
        category: {
          type: 'string',
          description: 'Filter by category name'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)'
        }
      }
    }
  },
  {
    name: 'list_categories',
    description: 'List all available service categories',
    inputSchema: {
      type: 'object',
      properties: {
        withCount: {
          type: 'boolean',
          description: 'Include service count for each category'
        }
      }
    }
  },
  {
    name: 'get_service',
    description: 'Get detailed information about a specific service',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Service name to look up'
        },
        url: {
          type: 'string',
          description: 'Service URL to look up'
        }
      }
    }
  },
  {
    name: 'list_tags',
    description: 'List all available tags across all services',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'refresh_data',
    description: 'Refresh the free-for-dev data from the source repository',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await initializeParser();

  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_services': {
        const params = SearchParamsSchema.parse(args);
        const results = parser.searchServices(params);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: results.length,
                services: results.map(service => ({
                  name: service.name,
                  url: service.url,
                  description: service.description,
                  freeTier: service.freeTier,
                  category: service.category,
                  limitations: service.limitations,
                  tags: service.tags
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'list_categories': {
        const params = ListCategoriesParamsSchema.parse(args);
        
        if (params.withCount) {
          const categoriesWithCount = parser.getCategoryWithCount();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalCategories: categoriesWithCount.length,
                  categories: categoriesWithCount
                }, null, 2)
              }
            ]
          };
        } else {
          const categories = parser.getCategories();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalCategories: categories.length,
                  categories
                }, null, 2)
              }
            ]
          };
        }
      }

      case 'get_service': {
        const params = GetServiceParamsSchema.parse(args);
        
        if (!params.name && !params.url) {
          throw new Error('Either name or url parameter is required');
        }
        
        const service = parser.getService(params);
        
        if (!service) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'Service not found',
                  params
                }, null, 2)
              }
            ]
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(service, null, 2)
            }
          ]
        };
      }

      case 'list_tags': {
        const tags = parser.getAllTags();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalTags: tags.length,
                tags
              }, null, 2)
            }
          ]
        };
      }

      case 'refresh_data': {
        try {
          await parser.fetchContent();
          parser.parseMarkdown();
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Data refreshed successfully',
                  timestamp: new Date().toISOString()
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: new Date().toISOString()
                }, null, 2)
              }
            ]
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Invalid parameters',
              details: error.issues
            }, null, 2)
          }
        ],
        isError: true
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Free-for-dev MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});