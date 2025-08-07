#!/usr/bin/env bun

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { EnhancedFreeForDevParser } from './enhanced-parser.ts';
import {
  SearchParamsSchema,
  ListCategoriesParamsSchema,
  GetServiceParamsSchema
} from './types.ts';

const parser = new EnhancedFreeForDevParser();

const server = new Server(
  {
    name: '@free-for-dev/mcp-server',
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
    name: 'semantic_search',
    description: 'Semantic/fuzzy search for free developer services using natural language',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query'
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
          description: 'Maximum number of results (default: 10, max: 50)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_services',
    description: 'Traditional search for free developer services',
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
          description: 'Maximum number of results (default: 10)'
        }
      }
    }
  },
  {
    name: 'get_similar_services',
    description: 'Find services similar to a given service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceName: {
          type: 'string',
          description: 'Name of the service to find similar ones for'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of similar services (default: 5)'
        }
      },
      required: ['serviceName']
    }
  },
  {
    name: 'get_popular_services',
    description: 'Get the most popular/comprehensive free services',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of services to return (default: 10)'
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
    name: 'get_stats',
    description: 'Get statistics about the service database and cache',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'refresh_data',
    description: 'Refresh the free-for-dev data from GitHub',
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
  // Initialize parser on first request
  await parser.initialize();

  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'semantic_search': {
        const params = SearchParamsSchema.parse(args);
        const limit = Math.min(params.limit || 10, 50);
        const results = parser.semanticSearch({ ...params, limit });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: results.length,
                results: results.map(result => ({
                  service: {
                    name: result.service.name,
                    url: result.service.url,
                    description: result.service.description,
                    freeTier: result.service.freeTier,
                    category: result.service.category,
                    limitations: result.service.limitations,
                    tags: result.service.tags
                  },
                  relevanceScore: Math.round((1 - result.score) * 100) // Convert to percentage
                }))
              }, null, 2)
            }
          ]
        };
      }

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

      case 'get_similar_services': {
        const { serviceName, limit = 5 } = args as { serviceName: string; limit?: number };
        const service = parser.getService({ name: serviceName });
        
        if (!service) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'Service not found',
                  serviceName
                }, null, 2)
              }
            ]
          };
        }
        
        const similar = parser.getSimilarServices(service, limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                originalService: service.name,
                count: similar.length,
                similarServices: similar.map(s => ({
                  name: s.name,
                  url: s.url,
                  description: s.description,
                  category: s.category,
                  tags: s.tags
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'get_popular_services': {
        const { limit = 10 } = args as { limit?: number };
        const popular = parser.getServicesByPopularity(limit);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: popular.length,
                services: popular.map(service => ({
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

      case 'get_stats': {
        const stats = parser.getStats();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      }

      case 'refresh_data': {
        try {
          await parser.refresh();
          const stats = parser.getStats();
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Data refreshed successfully',
                  stats: {
                    totalServices: stats.services.total,
                    totalCategories: stats.services.categories
                  },
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
  console.error('Free-for-dev MCP server v1.0.0 running');
  console.error('Initializing with cache support and semantic search...');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});