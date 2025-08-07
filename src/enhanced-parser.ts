import type { Service, ParsedContent } from './types.ts';
import { FreeForDevParser } from './parser.ts';
import { SearchEngine } from './search-engine.ts';
import { CacheManager } from './cache-manager.ts';

export class EnhancedFreeForDevParser extends FreeForDevParser {
  private searchEngine: SearchEngine;
  private cacheManager: CacheManager;
  private initialized: boolean = false;

  constructor() {
    super();
    this.searchEngine = new SearchEngine();
    this.cacheManager = new CacheManager();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.cacheManager.initialize();
    
    // Try to load from cache first
    const cachedData = await this.cacheManager.loadData();
    
    if (cachedData) {
      console.error('Loading data from cache');
      this.setParsedData(cachedData);
      this.searchEngine.initialize(cachedData.services);
      this.initialized = true;
      return;
    }

    // Fetch fresh data
    console.error('Fetching fresh data from GitHub');
    await this.fetchContent();
    const data = this.parseMarkdown();
    
    // Save to cache
    await this.cacheManager.saveData(data);
    
    // Initialize search engine
    this.searchEngine.initialize(data.services);
    this.initialized = true;
  }

  async refresh(): Promise<void> {
    console.error('Refreshing data from GitHub');
    await this.fetchContent();
    const data = this.parseMarkdown();
    
    // Clear caches
    await this.cacheManager.clearCache();
    this.searchEngine.clearCache();
    
    // Save new data
    await this.cacheManager.saveData(data);
    
    // Reinitialize search engine
    this.searchEngine.initialize(data.services);
  }

  semanticSearch(params: {
    query?: string;
    category?: string;
    tags?: string[];
    limit?: number;
  }): Array<{
    service: Service;
    score: number;
    highlights?: readonly any[];
  }> {
    if (!this.initialized) {
      throw new Error('Parser not initialized. Call initialize() first.');
    }

    const results = this.searchEngine.search({
      ...params,
      limit: params.limit || 10
    });
    
    return results.map(result => ({
      service: result.item,
      score: result.score,
      highlights: result.matches
    }));
  }

  getSimilarServices(service: Service, limit: number = 5): Service[] {
    if (!this.initialized) {
      throw new Error('Parser not initialized. Call initialize() first.');
    }
    
    return this.searchEngine.getSimilarServices(service, limit);
  }

  getServicesByPopularity(limit: number = 10): Service[] {
    const data = this.getParsedData();
    if (!data) return [];

    // Score services based on various factors
    const scored = data.services.map(service => {
      let score = 0;
      
      // Services with more detailed descriptions score higher
      score += Math.min(service.description.length / 10, 20);
      
      // Services with limitations clearly defined score higher
      if (service.limitations) score += 10;
      
      // Services with tags score higher
      if (service.tags && service.tags.length > 0) {
        score += service.tags.length * 5;
      }
      
      // Certain categories are more popular
      const popularCategories = ['APIs, Data, and ML', 'Cloud Providers', 'Hosting', 'Database'];
      if (popularCategories.some(cat => service.category.includes(cat))) {
        score += 15;
      }
      
      return { service, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.service);
  }

  getStats() {
    const data = this.getParsedData();
    const searchStats = this.searchEngine.getStats();
    const cacheStats = this.cacheManager.getStats();
    
    return {
      services: {
        total: data?.services.length || 0,
        categories: data?.categories.length || 0,
        withTags: data?.services.filter(s => s.tags && s.tags.length > 0).length || 0,
        withLimitations: data?.services.filter(s => s.limitations).length || 0,
      },
      search: searchStats,
      cache: cacheStats,
      initialized: this.initialized,
      lastUpdated: data?.lastUpdated || null
    };
  }

  // Protected method to set parsed data (for cache loading)
  protected setParsedData(data: ParsedContent): void {
    // This would be implemented in the base parser class
    // For now, we'll store it locally
    (this as any).parsedData = data;
  }

  protected getParsedData(): ParsedContent | null {
    return (this as any).parsedData || null;
  }
}