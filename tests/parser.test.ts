import { describe, it, expect, beforeAll } from 'vitest';
import { FreeForDevParser } from '../src/parser';
import type { Service } from '../src/types';

describe('FreeForDevParser', () => {
  let parser: FreeForDevParser;
  let services: Service[];

  beforeAll(async () => {
    parser = new FreeForDevParser();
    await parser.fetchContent();
    const data = parser.parseMarkdown();
    services = data.services;
  }, 30000);

  describe('fetchContent', () => {
    it('should fetch content from GitHub', async () => {
      const newParser = new FreeForDevParser();
      const content = await newParser.fetchContent();
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(1000);
      expect(content).toContain('# free-for.dev');
    });
  });

  describe('parseMarkdown', () => {
    it('should parse services from markdown', () => {
      expect(services).toBeDefined();
      expect(services.length).toBeGreaterThan(100);
    });

    it('should extract service properties correctly', () => {
      const service = services[0];
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('url');
      expect(service).toHaveProperty('description');
      expect(service).toHaveProperty('freeTier');
      expect(service).toHaveProperty('category');
    });

    it('should extract tags for services', () => {
      const servicesWithTags = services.filter(s => s.tags && s.tags.length > 0);
      expect(servicesWithTags.length).toBeGreaterThan(0);
    });

    it('should extract limitations for some services', () => {
      const servicesWithLimitations = services.filter(s => s.limitations);
      expect(servicesWithLimitations.length).toBeGreaterThan(0);
    });
  });

  describe('searchServices', () => {
    it('should search by query', () => {
      const results = parser.searchServices({ query: 'database', limit: 5 });
      expect(results.length).toBeLessThanOrEqual(5);
      expect(results.some(s => 
        s.name.toLowerCase().includes('database') || 
        s.description.toLowerCase().includes('database') ||
        s.category.toLowerCase().includes('database')
      )).toBe(true);
    });

    it('should filter by category', () => {
      const categories = parser.getCategories();
      if (categories.length > 0) {
        const results = parser.searchServices({ 
          category: categories[0], 
          limit: 10 
        });
        expect(results.every(s => s.category === categories[0])).toBe(true);
      }
    });

    it('should filter by tags', () => {
      const servicesWithApiTag = services.filter(s => 
        s.tags && s.tags.includes('api')
      );
      
      if (servicesWithApiTag.length > 0) {
        const results = parser.searchServices({ 
          tags: ['api'], 
          limit: 10 
        });
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('should respect limit parameter', () => {
      const results = parser.searchServices({ limit: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', () => {
      const categories = parser.getCategories();
      expect(categories.length).toBeGreaterThan(10);
      expect(categories.every(c => typeof c === 'string')).toBe(true);
    });
  });

  describe('getCategoryWithCount', () => {
    it('should return categories with service counts', () => {
      const categoriesWithCount = parser.getCategoryWithCount();
      expect(categoriesWithCount.length).toBeGreaterThan(10);
      expect(categoriesWithCount.every(c => 
        c.hasOwnProperty('name') && c.hasOwnProperty('count')
      )).toBe(true);
      expect(categoriesWithCount.every(c => c.count > 0)).toBe(true);
    });
  });

  describe('getService', () => {
    it('should find service by name', () => {
      const testService = services[0];
      const found = parser.getService({ name: testService?.name });
      expect(found).toBeDefined();
      expect(found?.name).toBe(testService?.name);
    });

    it('should find service by url', () => {
      const testService = services[0];
      const found = parser.getService({ url: testService?.url });
      expect(found).toBeDefined();
      expect(found?.url).toBe(testService?.url);
    });

    it('should return undefined for non-existent service', () => {
      const found = parser.getService({ name: 'NonExistentService123456' });
      expect(found).toBeUndefined();
    });
  });

  describe('getAllTags', () => {
    it('should return sorted unique tags', () => {
      const tags = parser.getAllTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags).toEqual([...new Set(tags)]);
      expect(tags).toEqual([...tags].sort());
    });
  });
});