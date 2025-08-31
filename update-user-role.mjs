// update-user-role.mjs - Script para actualizar el rol del usuario
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

async function updateUserRole() {
  console.log('🔄 Updating user role...\n');

  const targetEmail = 'guillermos22@gmail.com';
  const targetId = 'f5fdc65b-5bc6-45bc-a8ce-77879dd01bf6';
  const newRole = 'editor'; // Cambiar de 'user' a 'editor'

  try {
    // 1. Mostrar estado actual
    console.log('1️⃣ === ESTADO ACTUAL ===');
    const { data: currentData, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError.message);
      return;
    }

    console.log('👤 Usuario actual:');
    console.log(`   📧 Email: ${currentData.email}`);
    console.log(`   🎭 Rol actual: ${currentData.role}`);
    console.log(`   🆔 ID: ${currentData.id}`);

    // 2. Actualizar rol
    console.log('\n2️⃣ === ACTUALIZANDO ROL ===');
    console.log(`🔄 Cambiando rol de '${currentData.role}' a '${newRole}'...`);

    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating role:', updateError.message);
      console.log('Code:', updateError.code);
      console.log('Details:', updateError.details);
      
      // Si hay error 406, podríamos intentar con un approach diferente
      if (updateError.code === 'PGRST116') {
        console.log('\n🔄 Intentando método alternativo...');
        
        // Método alternativo: actualizar sin select
        const { error: altError } = await supabase
          .from('profiles')
          .update({ 
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetId);
          
        if (altError) {
          console.error('❌ Alternative method also failed:', altError.message);
          return;
        } else {
          console.log('✅ Rol actualizado (método alternativo)');
        }
      } else {
        return;
      }
    } else {
      console.log('✅ Rol actualizado exitosamente!');
      console.log('📋 Datos actualizados:', updateData);
    }

    // 3. Verificar cambio
    console.log('\n3️⃣ === VERIFICANDO CAMBIO ===');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return;
    }

    console.log('👤 Usuario actualizado:');
    console.log(`   📧 Email: ${verifyData.email}`);
    console.log(`   🎭 Rol nuevo: ${verifyData.role}`);
    console.log(`   📅 Actualizado: ${verifyData.updated_at}`);

    if (verifyData.role === newRole) {
      console.log('\n🎉 ¡ÉXITO! El usuario ahora puede acceder a las funciones de editor/blog.');
      console.log('📝 Permisos de editor: read, write, publish_content');
    } else {
      console.log('\n⚠️ El cambio no se reflejó correctamente.');
    }

  } catch (error) {
    console.error('💥 Error crítico:', error);
  }
}

// Ejecutar actualización
updateUserRole();