import type { Service, ServiceCategory, ParsedContent } from './types.ts';

export class FreeForDevParser {
  private content: string = '';
  private parsedData: ParsedContent | null = null;

  async fetchContent(): Promise<string> {
    const response = await fetch('https://raw.githubusercontent.com/ripienaar/free-for-dev/refs/heads/master/README.md');
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }
    this.content = await response.text();
    return this.content;
  }

  parseMarkdown(): ParsedContent {
    if (!this.content) {
      throw new Error('No content to parse. Call fetchContent() first.');
    }

    const categories: ServiceCategory[] = [];
    const services: Service[] = [];
    
    const lines = this.content.split('\n');
    let currentCategory: string | null = null;
    let currentCategoryServices: Service[] = [];
    let inTableOfContents = false;
    let skipNextSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      if (line.startsWith('## Table of Contents')) {
        inTableOfContents = true;
        continue;
      }
      
      if (inTableOfContents && line.startsWith('## ')) {
        inTableOfContents = false;
      }
      
      if (inTableOfContents) {
        continue;
      }

      if (line === '## Table of Contents' || 
          line === '## Contributing' || 
          line === '## Credits' ||
          line === '## License') {
        skipNextSection = true;
        continue;
      }

      if (line.startsWith('## ')) {
        if (currentCategory && currentCategoryServices.length > 0) {
          categories.push({
            name: currentCategory,
            services: currentCategoryServices
          });
        }
        
        currentCategory = line.replace('## ', '').trim();
        currentCategoryServices = [];
        skipNextSection = false;
      }
      
      if (skipNextSection || !currentCategory) {
        continue;
      }

      if (line.startsWith('* [') || line.startsWith('- [')) {
        const service = this.parseServiceLine(line, currentCategory);
        if (service) {
          services.push(service);
          currentCategoryServices.push(service);
        }
      }
    }

    if (currentCategory && currentCategoryServices.length > 0) {
      categories.push({
        name: currentCategory,
        services: currentCategoryServices
      });
    }

    this.parsedData = {
      categories,
      services,
      lastUpdated: new Date()
    };

    return this.parsedData;
  }

  private parseServiceLine(line: string, category: string): Service | null {
    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (!linkMatch) return null;

    const name = linkMatch[1]?.trim() || '';
    const url = linkMatch[2]?.trim() || '';
    
    const remainingText = line.substring(line.indexOf(')') + 1).trim();
    const parts = remainingText.split(' — ');
    const description = parts[0]?.replace(/^[-–—]\s*/, '').trim() || '';
    const freeTier = parts[1]?.trim() || description;

    const tags = this.extractTags(line);
    const limitations = this.extractLimitations(freeTier);

    return {
      name,
      url,
      description: description || freeTier,
      freeTier: freeTier || description,
      category,
      limitations,
      tags: tags.length > 0 ? tags : undefined
    };
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    
    if (text.toLowerCase().includes('api')) tags.push('api');
    if (text.toLowerCase().includes('free')) tags.push('free');
    if (text.toLowerCase().includes('open source') || text.toLowerCase().includes('open-source')) tags.push('open-source');
    if (text.toLowerCase().includes('cloud')) tags.push('cloud');
    if (text.toLowerCase().includes('database') || text.toLowerCase().includes('db')) tags.push('database');
    if (text.toLowerCase().includes('hosting')) tags.push('hosting');
    if (text.toLowerCase().includes('monitoring')) tags.push('monitoring');
    if (text.toLowerCase().includes('testing')) tags.push('testing');
    if (text.toLowerCase().includes('email')) tags.push('email');
    if (text.toLowerCase().includes('storage')) tags.push('storage');
    if (text.toLowerCase().includes('serverless')) tags.push('serverless');
    if (text.toLowerCase().includes('ci/cd') || text.toLowerCase().includes('cicd')) tags.push('cicd');
    
    return [...new Set(tags)];
  }

  private extractLimitations(text: string): string | undefined {
    const limitPatterns = [
      /(\d+[,\d]*\s*(?:requests?|calls?|invocations?|executions?|operations?)(?:\/(?:month|day|hour|min))?)/i,
      /(\d+[,\d]*\s*(?:MB|GB|TB|KB))/i,
      /(\d+[,\d]*\s*(?:users?|projects?|apps?|sites?))/i,
      /(limited to\s+[^.]+)/i,
      /(up to\s+[^.]+)/i
    ];

    for (const pattern of limitPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  searchServices(params: {
    query?: string;
    category?: string;
    tags?: string[];
    limit?: number;
  }): Service[] {
    if (!this.parsedData) {
      throw new Error('Data not parsed yet. Call parseMarkdown() first.');
    }

    let results = [...this.parsedData.services];

    if (params.category) {
      results = results.filter(s => 
        s.category.toLowerCase().includes(params.category!.toLowerCase())
      );
    }

    if (params.tags && params.tags.length > 0) {
      results = results.filter(s => 
        s.tags && params.tags!.some(tag => s.tags!.includes(tag))
      );
    }

    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.freeTier.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    return results.slice(0, params.limit || 10);
  }

  getCategories(): string[] {
    if (!this.parsedData) {
      throw new Error('Data not parsed yet. Call parseMarkdown() first.');
    }
    return this.parsedData.categories.map(c => c.name);
  }

  getCategoryWithCount(): { name: string; count: number }[] {
    if (!this.parsedData) {
      throw new Error('Data not parsed yet. Call parseMarkdown() first.');
    }
    return this.parsedData.categories.map(c => ({
      name: c.name,
      count: c.services.length
    }));
  }

  getService(params: { name?: string; url?: string }): Service | undefined {
    if (!this.parsedData) {
      throw new Error('Data not parsed yet. Call parseMarkdown() first.');
    }

    if (params.url) {
      return this.parsedData.services.find(s => s.url === params.url);
    }

    if (params.name) {
      return this.parsedData.services.find(s => 
        s.name.toLowerCase() === params.name!.toLowerCase()
      );
    }

    return undefined;
  }

  getAllTags(): string[] {
    if (!this.parsedData) {
      throw new Error('Data not parsed yet. Call parseMarkdown() first.');
    }

    const allTags = new Set<string>();
    this.parsedData.services.forEach(service => {
      service.tags?.forEach(tag => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }
}