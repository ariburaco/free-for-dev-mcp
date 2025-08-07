import Fuse from 'fuse.js';
import type { FuseResult, IFuseOptions } from 'fuse.js';
import { LRUCache } from 'lru-cache';
import type { Service, SearchParams } from './types.ts';

export interface SearchResult {
  item: Service;
  score: number;
  matches?: readonly any[];
  refIndex?: number;
}

export class SearchEngine {
  private fuse: Fuse<Service> | null = null;
  private services: Service[] = [];
  private searchCache: LRUCache<string, SearchResult[]>;
  private fuseOptions: IFuseOptions<Service>;
  
  constructor() {
    this.searchCache = new LRUCache<string, SearchResult[]>({
      max: 100,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
    this.fuseOptions = {} as IFuseOptions<Service>; // Will be set in initialize
  }

  initialize(services: Service[]) {
    this.services = services;
    
    this.fuseOptions = {
      keys: [
        { name: 'name', weight: 0.3 },
        { name: 'description', weight: 0.25 },
        { name: 'category', weight: 0.15 },
        { name: 'freeTier', weight: 0.15 },
        { name: 'tags', weight: 0.15 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: true,
      ignoreLocation: true,
      useExtendedSearch: true,
    };

    this.fuse = new Fuse(this.services, this.fuseOptions);
  }

  search(params: SearchParams): SearchResult[] {
    if (!this.fuse) {
      throw new Error('Search engine not initialized');
    }

    const cacheKey = this.generateCacheKey(params);
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return cached.slice(0, params.limit || 10);
    }

    let results: Service[] | FuseResult<Service>[] = this.services;
    
    // Apply category filter first (exact match)
    if (params.category) {
      results = this.services.filter(s => 
        s.category.toLowerCase() === params.category!.toLowerCase() ||
        s.category.toLowerCase().includes(params.category!.toLowerCase())
      );
    }

    // Apply tag filters
    if (params.tags && params.tags.length > 0) {
      results = (results as Service[]).filter(s => {
        if (!s.tags) return false;
        return params.tags!.some(tag => 
          s.tags!.some(serviceTag => 
            serviceTag.toLowerCase() === tag.toLowerCase()
          )
        );
      });
    }

    // Apply fuzzy search with Fuse.js
    if (params.query && params.query.trim()) {
      const searchQuery = this.buildFuseQuery(params.query);
      
      if (results === this.services) {
        results = this.fuse.search(searchQuery);
      } else {
        const filteredFuse = new Fuse(results as Service[], this.fuseOptions);
        results = filteredFuse.search(searchQuery);
      }
      
      const searchResults = (results as FuseResult<Service>[]).map(r => ({
        item: r.item,
        score: r.score || 0,
        matches: r.matches,
        refIndex: r.refIndex
      }));
      
      this.searchCache.set(cacheKey, searchResults);
      return searchResults.slice(0, params.limit || 10);
    }

    // No query, just return filtered results
    const searchResults = (results as Service[]).map((item, index) => ({
      item,
      score: 1,
      refIndex: index
    }));
    
    this.searchCache.set(cacheKey, searchResults);
    return searchResults.slice(0, params.limit || 10);
  }

  private buildFuseQuery(query: string): string {
    // Support advanced search operators
    if (query.includes('|') || query.includes("'") || query.includes('^') || query.includes('!')) {
      return query;
    }
    
    // For simple queries, make them more flexible
    const terms = query.trim().split(/\s+/);
    if (terms.length === 1) {
      // Single word: search for exact or fuzzy match
      return `'${query} | ${query}~2`;
    }
    
    // Multiple words: search for all terms
    return terms.map(term => `'${term}`).join(' ');
  }

  private generateCacheKey(params: SearchParams): string {
    return JSON.stringify({
      q: params.query || '',
      c: params.category || '',
      t: (params.tags || []).sort().join(','),
      l: params.limit || 10
    });
  }

  clearCache() {
    this.searchCache.clear();
  }

  getStats() {
    return {
      totalServices: this.services.length,
      cacheSize: this.searchCache.size,
      cacheCapacity: this.searchCache.max
    };
  }

  // Get similar services based on tags and category
  getSimilarServices(service: Service, limit: number = 5): Service[] {
    if (!service.tags || service.tags.length === 0) {
      // If no tags, return services from same category
      return this.services
        .filter(s => s.category === service.category && s.name !== service.name)
        .slice(0, limit);
    }

    // Score services based on tag overlap and category match
    const scored = this.services
      .filter(s => s.name !== service.name)
      .map(s => {
        let score = 0;
        
        // Category match gives base score
        if (s.category === service.category) {
          score += 2;
        }
        
        // Tag matches
        if (s.tags && service.tags) {
          const commonTags = s.tags.filter(tag => 
            service.tags!.includes(tag)
          );
          score += commonTags.length * 3;
        }
        
        return { service: s, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(item => item.service);
  }
}