// db-queries.mjs - Script to query Supabase database using TypeScript modules
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Make sure .env. file contains:');
  console.log('VITE_SUPABASE_URL=your_url');
  console.log('VITE_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDatabaseQueries() {
  console.log('🔍 Connecting to Supabase and running queries...\n');
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using anon key: ${supabaseAnonKey?.substring(0, 20)}...`);
  console.log('');

  try {
    // Test connection first
    console.log('🔍 === TESTING CONNECTION ===');
    const { data: testData, error: testError } = await supabase
      .from('blog_posts')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.log('❌ Connection test failed:', testError.message);
      console.log('Code:', testError.code);
      return;
    } else {
      console.log('✅ Successfully connected to Supabase!');
    }

    // 1. Check what tables we can access by trying known tables
    console.log('\n1️⃣ === DISCOVERING ACCESSIBLE TABLES ===');
    const knownTables = [
      'blog_posts', 
      'communities', 
      'startups', 
      'events', 
      'users',
      'profiles',
      'user_profiles'
    ];
    
    const accessibleTables = [];
    
    for (const tableName of knownTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ ${tableName}: ${count || 0} records`);
          accessibleTables.push({ name: tableName, count: count || 0 });
        } else {
          console.log(`❌ ${tableName}: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: ${e.message}`);
      }
    }

    console.log(`\n📊 Found ${accessibleTables.length} accessible tables\n`);

    // 2. Communities table structure and count
    console.log('2️⃣ === COMMUNITIES TABLE ANALYSIS ===');
    
    try {
      // Get sample record to understand structure
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .limit(1);

      if (communityError) {
        console.log('❌ Communities table is not accessible');
        console.log('Error:', communityError.message);
      } else {
        if (communityData && communityData.length > 0) {
          console.log('✅ Communities table exists! Structure:');
          const sampleRecord = communityData[0];
          Object.keys(sampleRecord).forEach(key => {
            const value = sampleRecord[key];
            const type = typeof value;
            const valuePreview = type === 'string' && value ? 
              ` (example: "${value.substring(0, 30)}${value.length > 30 ? '...' : ''}")` : 
              type === 'object' && value ? ` (${Array.isArray(value) ? 'array' : 'object'})` : '';
            console.log(`  📋 ${key}: ${type}${valuePreview}`);
          });
        } else {
          console.log('✅ Communities table exists but is empty');
        }

        // Get total count
        const { count } = await supabase
          .from('communities')
          .select('*', { count: 'exact', head: true });
        
        console.log(`\n📊 Total communities: ${count || 0}`);
      }
    } catch (e) {
      console.log('❌ Error analyzing communities table:', e.message);
    }

    // 3. Blog posts analysis (since we know this works)
    console.log('\n3️⃣ === BLOG POSTS TABLE ANALYSIS ===');
    
    try {
      const { data: blogData, error: blogError } = await supabase
        .from('blog_posts')
        .select('*')
        .limit(1);

      if (!blogError && blogData && blogData.length > 0) {
        console.log('✅ Blog posts table structure:');
        const sampleRecord = blogData[0];
        Object.keys(sampleRecord).forEach(key => {
          const value = sampleRecord[key];
          const type = typeof value;
          const valuePreview = type === 'string' && value ? 
            ` (example: "${value.substring(0, 30)}${value.length > 30 ? '...' : ''}")` : 
            type === 'object' && value ? ` (${Array.isArray(value) ? 'array' : 'object'})` : '';
          console.log(`  📋 ${key}: ${type}${valuePreview}`);
        });

        const { count } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true });
        
        console.log(`\n📊 Total blog posts: ${count || 0}`);
      }
    } catch (e) {
      console.log('❌ Error analyzing blog posts:', e.message);
    }

    // 4. Summary
    console.log('\n✨ === SUMMARY ===');
    console.log(`🔍 Connection: ✅ Successful`);
    console.log(`📊 Accessible tables: ${accessibleTables.length}`);
    accessibleTables.forEach(table => {
      console.log(`  - ${table.name}: ${table.count} records`);
    });

    console.log('\n🎯 Database exploration completed!');

  } catch (error) {
    console.error('💥 Critical error:', error);
  }
}

// Run the queries
runDatabaseQueries();