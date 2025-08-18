import { supabase } from './lib/supabase';

export async function testAuth() {
  console.log('🔍 Test de Autenticación Iniciado');
  console.log('=====================================');
  
  // 1. Verificar variables de entorno
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('📋 Variables de Entorno:');
  
  if (!url || !key) {
    console.error('❌ FALTA CONFIGURACIÓN: Verifica tu archivo .env.local');
    return { success: false, error: 'Missing environment variables' };
  }
  
  // 2. Test de conexión
  try {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return { success: false, error: 'Connection failed' };
  }
  
  // 3. Test de registro
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('\n📧 Intentando registrar:', testEmail);
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { 
        name: 'Test User Frontend',
        role: 'user'
      }
    }
  });
  
  if (error) {
    console.error('❌ Error de registro:', {
      message: error.message,
      status: error.status,
      name: error.name
    });
    return { success: false, error: error.message };
  }
  
  console.log('📦 Datos del usuario:', data);
  
  // 4. Verificar profile
  await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', testEmail)
    .single();
    
  if (profile) {
  } else {
    console.log('⚠️ Profile no encontrado (verificar trigger)');
  }
  
  console.log('=====================================');
  
  return { 
    success: true, 
    email: testEmail,
    userId: data.user?.id 
  };
}

// Hacer la función disponible globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).testAuth = testAuth;
}