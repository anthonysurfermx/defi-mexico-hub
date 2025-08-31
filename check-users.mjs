// check-users.mjs - Script para verificar usuarios en profiles vs auth.users
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  console.log('🔍 Checking users in profiles table...\n');

  try {
    // 1. Check all profiles
    console.log('1️⃣ === PROFILES TABLE ===');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    console.log(`✅ Found ${profiles.length} profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. 👤 ${profile.full_name || 'No name'}`);
      console.log(`   📧 Email: ${profile.email || 'No email'}`);
      console.log(`   🎭 Role: ${profile.role || 'No role'}`);
      console.log(`   🆔 ID: ${profile.id}`);
      console.log(`   📅 Created: ${profile.created_at}`);
    });

    // 2. Try to see if we can access auth.users (probably won't work with anon key)
    console.log('\n2️⃣ === TRYING TO ACCESS AUTH.USERS (May not work) ===');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('❌ Cannot access auth.users with anon key (expected)');
        console.log('Error:', authError.message);
      } else {
        console.log(`✅ Found ${authUsers.users.length} auth users`);
        authUsers.users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
        });
      }
    } catch (e) {
      console.log('❌ Cannot access auth.users:', e.message);
    }

    // 3. Search for specific user
    console.log('\n3️⃣ === SEARCHING FOR SPECIFIC USER ===');
    const targetEmail = 'guillermos22@gmail.com';
    const targetId = 'f5fdc65b-5bc6-45bc-a8ce-77879dd01bf6'; // From the error log
    
    const foundByEmail = profiles.find(p => p.email === targetEmail);
    const foundById = profiles.find(p => p.id === targetId);
    
    if (foundByEmail) {
      console.log(`✅ Found user by email: ${foundByEmail.email}`);
    } else {
      console.log(`❌ User ${targetEmail} NOT found in profiles table`);
    }
    
    if (foundById) {
      console.log(`✅ Found user by ID: ${foundById.email || foundById.id}`);
    } else {
      console.log(`❌ User ${targetId} NOT found in profiles table`);
    }

    // 4. Try to create the missing profile
    if (!foundById && !foundByEmail) {
      console.log('\n4️⃣ === TRYING TO CREATE MISSING PROFILE ===');
      
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: targetId,
          email: targetEmail,
          full_name: 'Prueba',
          role: 'viewer', // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.log('❌ Could not create profile:', insertError.message);
        console.log('Code:', insertError.code);
      } else {
        console.log('✅ Successfully created profile!');
        console.log('New profile:', insertData);
      }
    }

  } catch (error) {
    console.error('💥 Critical error:', error);
  }
}

// Run the check
checkUsers();