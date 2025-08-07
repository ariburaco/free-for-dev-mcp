import { describe, it, expect, beforeAll } from 'vitest';
import { SearchEngine } from '../src/search-engine';
import { FreeForDevParser } from '../src/parser';
import type { Service } from '../src/types';

describe('SearchEngine', () => {
  let searchEngine: SearchEngine;
  let services: Service[];

  beforeAll(async () => {
    const parser = new FreeForDevParser();
    await parser.fetchContent();
    const data = parser.parseMarkdown();
    services = data.services;
    
    searchEngine = new SearchEngine();
    searchEngine.initialize(services);
  }, 30000);

  describe('initialize', () => {
    it('should initialize with services', () => {
      const engine = new SearchEngine();
      engine.initialize(services);
      const stats = engine.getStats();
      expect(stats.totalServices).toBe(services.length);
    });
  });

  describe('semantic search', () => {
    it('should perform fuzzy search', () => {
      const results = searchEngine.search({ 
        query: 'databse', // Intentional typo
        limit: 5 
      });
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should rank results by relevance', () => {
      const results = searchEngine.search({ 
        query: 'api monitoring', 
        limit: 10 
      });
      expect(results.length).toBeGreaterThan(0);
      
      // Check that scores are sorted (lower is better in Fuse.js)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]!.score).toBeGreaterThanOrEqual(results[i-1]!.score);
      }
    });

    it('should support advanced search operators', () => {
      const results = searchEngine.search({ 
        query: "'cloud | 'hosting", 
        limit: 10 
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should combine query with category filter', () => {
      const results = searchEngine.search({ 
        query: 'api',
        category: 'APIs, Data, and ML',
        limit: 10 
      });
      
      if (results.length > 0) {
        expect(results.every(r => 
          r.item.category.toLowerCase().includes('api')
        )).toBe(true);
      }
    });

    it('should combine query with tag filters', () => {
      const results = searchEngine.search({ 
        query: 'service',
        tags: ['cloud'],
        limit: 10 
      });
      
      if (results.length > 0) {
        expect(results.every(r => 
          r.item.tags?.includes('cloud')
        )).toBe(true);
      }
    });
  });

  describe('caching', () => {
    it('should cache search results', () => {
      const params = { query: 'test-cache', limit: 5 };
      
      // First search
      const results1 = searchEngine.search(params);
      const stats1 = searchEngine.getStats();
      const cacheSize1 = stats1.cacheSize;
      
      // Second identical search
      const results2 = searchEngine.search(params);
      const stats2 = searchEngine.getStats();
      const cacheSize2 = stats2.cacheSize;
      
      expect(results1).toEqual(results2);
      expect(cacheSize2).toBe(cacheSize1);
    });

    it('should clear cache', () => {
      searchEngine.search({ query: 'test', limit: 5 });
      let stats = searchEngine.getStats();
      expect(stats.cacheSize).toBeGreaterThan(0);
      
      searchEngine.clearCache();
      stats = searchEngine.getStats();
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('getSimilarServices', () => {
    it('should find similar services based on tags and category', () => {
      const serviceWithTags = services.find(s => s.tags && s.tags.length > 0);
      
      if (serviceWithTags) {
        const similar = searchEngine.getSimilarServices(serviceWithTags, 5);
        expect(similar.length).toBeLessThanOrEqual(5);
        expect(similar.every(s => s.name !== serviceWithTags.name)).toBe(true);
      }
    });

    it('should return services from same category when no tags', () => {
      const serviceWithoutTags = services.find(s => !s.tags || s.tags.length === 0);
      
      if (serviceWithoutTags) {
        const similar = searchEngine.getSimilarServices(serviceWithoutTags, 5);
        
        if (similar.length > 0) {
          expect(similar.some(s => 
            s.category === serviceWithoutTags.category
          )).toBe(true);
        }
      }
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const stats = searchEngine.getStats();
      expect(stats).toHaveProperty('totalServices');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheCapacity');
      expect(stats.totalServices).toBe(services.length);
      expect(stats.cacheCapacity).toBeGreaterThan(0);
    });
  });
});