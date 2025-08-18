import { supabase } from './lib/supabase';

export async function testLogin() {
  console.log('🔐 Test de Login Iniciado');
  console.log('=====================================');
  
  // Credentials provided by user
  const email = 'anthochavez.ra@gmail.com';
  const password = 'Admin2025!';
  
  console.log('📋 Configuración:');
  console.log(`URL: ${import.meta.env.VITE_SUPABASE_URL}`);
  console.log(`Anon Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20)}...`);
  console.log(`Email: ${email}`);
  console.log('Password: [HIDDEN]');
  
  // Step 1: Test connection to Supabase
  console.log('\n🔗 Testing connection...');
  try {
    const { error: pingError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    if (pingError) {
      console.error('❌ Connection failed:', pingError);
      return { success: false, error: 'Connection failed', details: pingError };
    }
    console.log('✅ Connection successful');
  } catch (err) {
    console.error('❌ Connection error:', err);
    return { success: false, error: 'Connection error', details: err };
  }
  
  // Step 2: Check if user exists
  console.log('\n👤 Checking if user exists...');
  try {
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('email', email)
      .limit(1);
    
    if (userError) {
      console.log('⚠️ Could not check user in profiles table:', userError.message);
    } else if (users && users.length > 0) {
      console.log('✅ User found in profiles table:', users[0]);
    } else {
      console.log('⚠️ User not found in profiles table');
    }
  } catch (err) {
    console.log('⚠️ Error checking profiles table:', err);
  }
  
  // Step 3: Attempt direct login
  console.log('\n🔐 Attempting login...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ Login failed:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: error.code || 'N/A'
      });
      
      // Additional error analysis
      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 Suggestion: Email/password combination not found or incorrect');
        console.log('💡 Check: User exists and password is correct in Supabase Auth');
      }
      
      return { success: false, error: error.message, details: error };
    }
    
    console.log('✅ Login successful!');
    console.log('📦 User data:', {
      id: data.user?.id,
      email: data.user?.email,
      email_confirmed_at: data.user?.email_confirmed_at,
      created_at: data.user?.created_at,
      last_sign_in_at: data.user?.last_sign_in_at
    });
    console.log('🎫 Session:', {
      access_token: data.session?.access_token?.substring(0, 20) + '...',
      refresh_token: data.session?.refresh_token?.substring(0, 20) + '...',
      expires_at: data.session?.expires_at
    });
    
    return { 
      success: true, 
      user: data.user,
      session: data.session 
    };
    
  } catch (err: any) {
    console.error('❌ Unexpected error during login:', err);
    return { success: false, error: err.message || 'Unexpected error', details: err };
  }
}

// Step 4: Test direct fetch to Supabase auth endpoint
export async function testDirectFetch() {
  console.log('\n🌐 Testing direct fetch to Supabase auth endpoint...');
  
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        email: 'anthochavez.ra@gmail.com',
        password: 'Admin2025!'
      })
    });
    
    const text = await response.text();
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response body:', text);
    
    if (response.ok) {
      console.log('✅ Direct fetch successful');
      return { success: true, data: JSON.parse(text) };
    } else {
      console.error('❌ Direct fetch failed');
      return { success: false, error: text, status: response.status };
    }
    
  } catch (err: any) {
    console.error('❌ Direct fetch error:', err);
    return { success: false, error: err.message, details: err };
  }
}

// Comprehensive debug function
export async function debugLogin() {
  console.log('🚀 Starting comprehensive login debug...');
  
  const loginResult = await testLogin();
  const fetchResult = await testDirectFetch();
  
  console.log('\n📊 Summary:');
  console.log('=====================================');
  console.log('SDK Login:', loginResult.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Direct Fetch:', fetchResult.success ? '✅ SUCCESS' : '❌ FAILED');
  
  if (!loginResult.success) {
    console.log('❌ SDK Error:', loginResult.error);
  }
  
  if (!fetchResult.success) {
    console.log('❌ Fetch Error:', fetchResult.error);
  }
  
  return {
    sdk: loginResult,
    fetch: fetchResult
  };
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testLogin = testLogin;
  (window as any).testDirectFetch = testDirectFetch;
  (window as any).debugLogin = debugLogin;
}