import { FreeForDevParser } from '../src/parser.ts';

async function testServer() {
  console.log('Testing Free-for-Dev MCP Server Parser...\n');
  
  const parser = new FreeForDevParser();
  
  try {
    console.log('1. Fetching content from GitHub...');
    await parser.fetchContent();
    console.log('✓ Content fetched successfully\n');
    
    console.log('2. Parsing markdown content...');
    const data = parser.parseMarkdown();
    console.log(`✓ Parsed ${data.services.length} services in ${data.categories.length} categories\n`);
    
    console.log('3. Testing search functionality...');
    const searchResults = parser.searchServices({
      query: 'database',
      limit: 5
    });
    console.log(`✓ Found ${searchResults.length} database-related services`);
    searchResults.slice(0, 2).forEach(s => {
      console.log(`  - ${s.name}: ${s.description.substring(0, 50)}...`);
    });
    console.log();
    
    console.log('4. Testing category listing...');
    const categories = parser.getCategories();
    console.log(`✓ Available categories: ${categories.slice(0, 5).join(', ')}...`);
    console.log();
    
    console.log('5. Testing category with count...');
    const categoriesWithCount = parser.getCategoryWithCount();
    console.log('✓ Top categories by service count:');
    categoriesWithCount.slice(0, 3).forEach(c => {
      console.log(`  - ${c.name}: ${c.count} services`);
    });
    console.log();
    
    console.log('6. Testing tag extraction...');
    const tags = parser.getAllTags();
    console.log(`✓ Found ${tags.length} unique tags: ${tags.slice(0, 8).join(', ')}...`);
    console.log();
    
    console.log('7. Testing service lookup...');
    const exampleService = searchResults[0];
    if (exampleService) {
      const service = parser.getService({ name: exampleService.name });
      if (service) {
        console.log(`✓ Service details for "${service.name}":`);
        console.log(`  URL: ${service.url}`);
        console.log(`  Category: ${service.category}`);
        console.log(`  Free Tier: ${service.freeTier.substring(0, 100)}...`);
        if (service.limitations) {
          console.log(`  Limitations: ${service.limitations}`);
        }
        if (service.tags && service.tags.length > 0) {
          console.log(`  Tags: ${service.tags.join(', ')}`);
        }
      }
    }
    console.log();
    
    console.log('✅ All tests passed successfully!');
    console.log('\nThe MCP server is ready to use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testServer();