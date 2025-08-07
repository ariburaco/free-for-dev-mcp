# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions workflow for automated npm publishing
- Release scripts for version management
- CI/CD pipeline for testing and building

## [1.0.0] - 2024-01-08

### Added
- Initial release of free-for-dev MCP server
- Semantic search using Fuse.js for 1,500+ free developer services
- 9 MCP tools for searching and browsing services
- Two-tier caching system (memory + disk)
- Fallback search when fuzzy search returns no results
- Support for categories, tags, and similarity matching
- Comprehensive test suite with Vitest
- Full TypeScript support with Zod validation
- Integration with Claude Desktop, Cursor IDE, and Continue.dev

### Features
- `semantic_search` - Natural language search with fuzzy matching
- `search_services` - Traditional keyword search
- `get_similar_services` - Find alternatives based on tags/category
- `get_popular_services` - Most comprehensive services
- `list_categories` - Browse all 61 categories
- `get_service` - Detailed service information
- `list_tags` - Available tags across services
- `get_stats` - Database and cache statistics
- `refresh_data` - Update from GitHub repository

### Performance
- Sub-second response times with caching
- 24-hour persistent disk cache
- LRU memory cache for recent queries
- Automatic data refresh capability

[Unreleased]: https://github.com/ariburaco/free-for-dev-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ariburaco/free-for-dev-mcp/releases/tag/v1.0.0