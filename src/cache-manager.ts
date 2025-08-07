import { LRUCache } from 'lru-cache';
import type { ParsedContent } from './types.ts';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

export class CacheManager {
  private memoryCache: LRUCache<string, any>;
  private cacheDir: string;
  private dataFile: string;

  constructor() {
    this.memoryCache = new LRUCache<string, any>({
      max: 50,
      ttl: 1000 * 60 * 10, // 10 minutes memory cache
    });

    // Use a proper cache directory
    this.cacheDir = path.join(homedir(), '.cache', 'free-for-dev-mcp');
    this.dataFile = path.join(this.cacheDir, 'data.json');
  }

  async initialize() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  async saveData(data: ParsedContent): Promise<void> {
    try {
      const cacheData = {
        ...data,
        cachedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      await fs.writeFile(
        this.dataFile,
        JSON.stringify(cacheData, null, 2),
        'utf-8'
      );
      
      this.memoryCache.set('parsed-data', data);
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  async loadData(): Promise<ParsedContent | null> {
    // Check memory cache first
    const memCached = this.memoryCache.get('parsed-data') as ParsedContent;
    if (memCached) {
      return memCached;
    }

    // Check disk cache
    try {
      const exists = await fs.access(this.dataFile).then(() => true).catch(() => false);
      if (!exists) {
        return null;
      }

      const stats = await fs.stat(this.dataFile);
      const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
      
      // Cache is valid for 24 hours
      if (ageInHours > 24) {
        console.error('Cache is stale, will refetch');
        return null;
      }

      const content = await fs.readFile(this.dataFile, 'utf-8');
      const cacheData = JSON.parse(content);
      
      const data: ParsedContent = {
        categories: cacheData.categories,
        services: cacheData.services,
        lastUpdated: new Date(cacheData.lastUpdated)
      };
      
      this.memoryCache.set('parsed-data', data);
      return data;
    } catch (error) {
      console.error('Failed to load cache:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    try {
      await fs.unlink(this.dataFile);
    } catch (error) {
      // File might not exist
    }
  }

  get(key: string): any {
    return this.memoryCache.get(key);
  }

  set(key: string, value: any, ttl?: number): void {
    if (ttl) {
      this.memoryCache.set(key, value, { ttl });
    } else {
      this.memoryCache.set(key, value);
    }
  }

  getStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      memoryCacheCapacity: this.memoryCache.max,
      cacheDir: this.cacheDir
    };
  }
}