#!/usr/bin/env node

// Direct test of Supabase authentication without any middleware
// Using native fetch (Node.js 18+)

const SUPABASE_URL = 'https://rewyaxuqgkcqzqtsvwuu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJld3lheHVxZ2tjcXpxdHN2d3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTMzMzUsImV4cCI6MjA3MDI4OTMzNX0.4pRt1iPtWsrzlI1mIAKYCAFj5xJzYcQ0uO2xC_Anvqw';
const EMAIL = 'anthochavez.ra@gmail.com';
const PASSWORD = 'Admin2025!';

async function testDirectAuth() {
  console.log('🔐 Testing Supabase Auth Direct API');
  console.log('==================================');
  
  try {
    // Test 1: Sign in with password
    console.log('\n1. Testing signInWithPassword...');
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ SUCCESS! Login worked');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Access Token (first 20 chars):', data.access_token?.substring(0, 20) + '...');
      return { success: true, data };
    } else {
      console.log('❌ FAILED! Status:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error Message:', errorData.msg || errorData.error_description || errorData.message);
        console.log('Error Details:', errorData);
      } catch (e) {
        console.log('Error (raw):', responseText);
      }
      return { success: false, error: responseText };
    }
    
  } catch (error) {
    console.error('❌ EXCEPTION:', error.message);
    return { success: false, error: error.message };
  }
}

async function testUserExists() {
  console.log('\n2. Testing if user exists in auth.users...');
  
  try {
    // This endpoint requires service role key, but let's try with anon key first
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_by_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        user_email: EMAIL
      })
    });
    
    console.log('RPC Status:', response.status);
    const rpcText = await response.text();
    console.log('RPC Response:', rpcText);
    
  } catch (error) {
    console.log('RPC Error (expected with anon key):', error.message);
  }
}

async function testConnectionOnly() {
  console.log('\n3. Testing basic connection...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log('Connection Status:', response.status);
    console.log('Connection OK:', response.ok);
    
    if (response.ok) {
      console.log('✅ Connection to Supabase is working');
    } else {
      console.log('❌ Connection failed');
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Supabase Direct Tests');
  console.log('==================================');
  console.log('URL:', SUPABASE_URL);
  console.log('Email:', EMAIL);
  console.log('Anon Key (first 20):', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  await testConnectionOnly();
  await testUserExists();
  const authResult = await testDirectAuth();
  
  console.log('\n📊 FINAL SUMMARY');
  console.log('================');
  console.log('Auth Result:', authResult.success ? '✅ SUCCESS' : '❌ FAILED');
  if (!authResult.success) {
    console.log('Error:', authResult.error);
  }
  
  return authResult;
}

// Run the tests
runAllTests().catch(console.error);