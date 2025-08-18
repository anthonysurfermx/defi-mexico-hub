import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { testLogin, testDirectFetch, debugLogin } from '../test-login';

export const LoginDebugger: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console logs
  const originalLog = console.log;
  const originalError = console.error;

  const captureConsole = () => {
    const newLogs: string[] = [];
    
    console.log = (...args) => {
      newLogs.push(`[LOG] ${args.join(' ')}`);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      newLogs.push(`[ERROR] ${args.join(' ')}`);
      originalError(...args);
    };
    
    return () => {
      console.log = originalLog;
      console.error = originalError;
      setLogs(newLogs);
    };
  };

  const runTest = async (testType: 'login' | 'fetch' | 'full') => {
    setLoading(true);
    setResults(null);
    setLogs([]);
    
    const restoreConsole = captureConsole();
    
    try {
      let result;
      
      switch (testType) {
        case 'login':
          result = await testLogin();
          break;
        case 'fetch':
          result = await testDirectFetch();
          break;
        case 'full':
          result = await debugLogin();
          break;
      }
      
      setResults(result);
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      restoreConsole();
      setLoading(false);
    }
  };

  const testManualLogin = async () => {
    setLoading(true);
    setResults(null);
    const newLogs: string[] = [];
    
    try {
      newLogs.push('[MANUAL] Starting manual login test...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'anthochavez.ra@gmail.com',
        password: 'Admin2025!'
      });
      
      if (error) {
        newLogs.push(`[MANUAL ERROR] ${error.message}`);
        newLogs.push(`[MANUAL ERROR] Status: ${error.status}`);
        newLogs.push(`[MANUAL ERROR] Code: ${error.code || 'N/A'}`);
        setResults({ success: false, error: error.message });
      } else {
        newLogs.push('[MANUAL SUCCESS] Login successful!');
        newLogs.push(`[MANUAL] User ID: ${data.user?.id}`);
        newLogs.push(`[MANUAL] Email: ${data.user?.email}`);
        setResults({ success: true, user: data.user });
      }
    } catch (err: any) {
      newLogs.push(`[MANUAL EXCEPTION] ${err.message}`);
      setResults({ success: false, error: err.message });
    } finally {
      setLogs(newLogs);
      setLoading(false);
    }
  };

  const checkSupabaseConfig = () => {
    const config = {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
    };
    
    setResults(config);
    setLogs([
      `[CONFIG] URL: ${config.url}`,
      `[CONFIG] URL Length: ${config.urlLength}`,
      `[CONFIG] Has Anon Key: ${config.hasKey}`,
      `[CONFIG] Key Length: ${config.keyLength}`,
      `[CONFIG] Anon Key Preview: ${config.anonKey?.substring(0, 50)}...`
    ]);
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1>🔐 Supabase Login Debugger</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={checkSupabaseConfig}
            disabled={loading}
            style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Check Config
          </button>
          <button 
            onClick={testManualLogin}
            disabled={loading}
            style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Manual Login Test
          </button>
          <button 
            onClick={() => runTest('login')}
            disabled={loading}
            style={{ padding: '10px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            SDK Login Test
          </button>
          <button 
            onClick={() => runTest('fetch')}
            disabled={loading}
            style={{ padding: '10px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px' }}
          >
            Direct Fetch Test
          </button>
          <button 
            onClick={() => runTest('full')}
            disabled={loading}
            style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Full Debug
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          🔄 Running test...
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Console Logs</h3>
          <div style={{ 
            background: '#000', 
            color: '#00ff00', 
            padding: '15px', 
            borderRadius: '5px',
            maxHeight: '300px',
            overflowY: 'auto',
            fontSize: '12px'
          }}>
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Results</h3>
          <div style={{ 
            background: '#fff', 
            padding: '15px', 
            borderRadius: '5px',
            border: '1px solid #ddd'
          }}>
            <pre style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap',
              fontSize: '12px'
            }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
        <h3>Instructions</h3>
        <ol>
          <li><strong>Check Config</strong> - Verify environment variables are loaded correctly</li>
          <li><strong>Manual Login Test</strong> - Test login directly with hardcoded credentials</li>
          <li><strong>SDK Login Test</strong> - Run the comprehensive SDK test</li>
          <li><strong>Direct Fetch Test</strong> - Bypass SDK and test raw HTTP request</li>
          <li><strong>Full Debug</strong> - Run all tests in sequence</li>
        </ol>
        <p>Open browser DevTools Console to see additional debug information.</p>
      </div>
    </div>
  );
};