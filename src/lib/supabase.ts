import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return error?.message || 'An unexpected error occurred';
};

export const queryWrapper = async <T>(
  query: () => Promise<any>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const result = await query();
    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Helper to execute RPC functions with error handling
export const rpcWrapper = async <T = any>(
  functionName: string,
  args?: Record<string, any>
): Promise<{ data: T | null; error: string | null }> => {
  return queryWrapper(async () => {
    const result = await supabase.rpc(functionName, args);
    return result;
  });
};

// Service response type
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  metadata?: {
    total?: number | null;
    page?: number;
    limit?: number;
  };
}

// Helper to check if error is a specific PostgreSQL error
export const isPostgresError = (error: any, code: string): boolean => {
  return error?.code === code;
};

// Helper to check if error is a network error
export const isNetworkError = (error: any): boolean => {
  return error?.message?.includes('Failed to fetch') || 
         error?.message?.includes('NetworkError') ||
         error?.message?.includes('CORS');
};

// Helper to check if error is an auth error
export const isAuthError = (error: any): boolean => {
  return error?.message?.includes('Invalid login') ||
         error?.message?.includes('not authenticated') ||
         error?.message?.includes('refresh_token') ||
         error?.status === 401;
};