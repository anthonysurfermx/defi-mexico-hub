// db-queries.js - Script to query Supabase database
import { supabase } from './src/lib/supabase.js';

async function runDatabaseQueries() {
  console.log('🔍 Connecting to Supabase and running queries...\n');

  try {
    // 1. List all public tables
    console.log('1️⃣ === LISTING ALL PUBLIC TABLES ===');
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('get_public_tables'); // We'll need to create this function or use direct SQL

    // Alternative approach - get schema info directly
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (schemaError) {
      console.log('⚠️ Direct schema query failed, trying alternative approach...');
      // Try to query known tables to see what exists
      const knownTables = ['blog_posts', 'communities', 'startups', 'events', 'users'];
      console.log('📋 Checking for known tables:');
      
      for (const tableName of knownTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`✅ Table '${tableName}' exists`);
          }
        } catch (e) {
          console.log(`❌ Table '${tableName}' does not exist or is not accessible`);
        }
      }
    } else {
      console.log('📋 Public tables found:');
      schemaData?.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

    console.log('\n2️⃣ === COMMUNITIES TABLE STRUCTURE ===');
    
    // Try to get table structure for communities
    try {
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .limit(1);

      if (communityError) {
        console.log('❌ Communities table does not exist or is not accessible');
        console.log('Error:', communityError.message);
      } else {
        if (communityData && communityData.length > 0) {
          console.log('✅ Communities table exists! Sample record structure:');
          const sampleRecord = communityData[0];
          Object.keys(sampleRecord).forEach(key => {
            const value = sampleRecord[key];
            const type = typeof value;
            const example = type === 'string' && value ? `(example: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}")` : '';
            console.log(`  - ${key}: ${type} ${example}`);
          });
        } else {
          console.log('✅ Communities table exists but is empty');
        }
      }
    } catch (e) {
      console.log('❌ Error accessing communities table:', e.message);
    }

    console.log('\n3️⃣ === COMMUNITIES TABLE COUNT ===');
    
    try {
      const { data, error, count } = await supabase
        .from('communities')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log('❌ Could not count communities records');
        console.log('Error:', error.message);
      } else {
        console.log(`📊 Total communities records: ${count || 0}`);
      }
    } catch (e) {
      console.log('❌ Error counting communities:', e.message);
    }

    // Bonus: Check other important tables
    console.log('\n🎯 === CHECKING OTHER IMPORTANT TABLES ===');
    const tablesToCheck = [
      'blog_posts',
      'startups', 
      'events',
      'users',
      'profiles'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ ${tableName}: ${count || 0} records`);
        } else {
          console.log(`❌ ${tableName}: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: Error - ${e.message}`);
      }
    }

    console.log('\n✨ Database queries completed!');

  } catch (error) {
    console.error('💥 Error connecting to database:', error);
  }
}

// Run the queries
runDatabaseQueries();