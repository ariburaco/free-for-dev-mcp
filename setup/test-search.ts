#!/usr/bin/env bun

import { EnhancedFreeForDevParser } from '../src/enhanced-parser';

async function testSearch() {
  const parser = new EnhancedFreeForDevParser();
  await parser.initialize();
  
  console.log('🧪 Testing improved search...\n');
  
  // Test queries that were failing
  const testQueries = [
    { query: 'database', limit: 5 },
    { query: 'storage 1GB 2GB 5GB 10GB free hosting cloud', limit: 5 },
    { query: 'GB', limit: 5 },
    { query: 'free database services cloud hosting', limit: 5 }
  ];
  
  for (const test of testQueries) {
    console.log(`\n📍 Query: "${test.query}"`);
    console.log('─'.repeat(50));
    
    const results = parser.semanticSearch(test);
    
    console.log(`Found ${results.length} results:\n`);
    
    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.service.name}`);
      console.log(`   ${result.service.description.substring(0, 100)}...`);
      console.log(`   Free tier: ${result.service.freeTier.substring(0, 80)}...`);
      console.log(`   Score: ${Math.round((1 - result.score) * 100)}%`);
    });
  }
  
  // Also test regular search
  console.log('\n\n🔍 Testing regular search for "database":');
  console.log('─'.repeat(50));
  
  const regularResults = parser.searchServices({ query: 'database', limit: 5 });
  console.log(`Found ${regularResults.length} results:\n`);
  
  regularResults.forEach((service, i) => {
    console.log(`${i + 1}. ${service.name} - ${service.description.substring(0, 60)}...`);
  });
}

testSearch().catch(console.error);