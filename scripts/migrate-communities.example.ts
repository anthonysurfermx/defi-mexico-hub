import { createClient } from '@supabase/supabase-js'

// ⚠️ IMPORTANTE: Reemplaza estas variables con tus propias keys
// NUNCA subas las keys reales a GitHub
const OLD_SUPABASE_URL = 'https://tu-proyecto-anterior.supabase.co'
const OLD_SUPABASE_ANON_KEY = 'tu-anon-key-anterior'

const NEW_SUPABASE_URL = 'https://tu-proyecto-nuevo.supabase.co'
const NEW_SUPABASE_ANON_KEY = 'tu-anon-key-nueva'

// Crear clientes de Supabase
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY)
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY)

async function migrateCommunities() {
  console.log('🚀 DeFi México Hub - Migración de Communities')
  console.log('===========================================\n')
  
  try {
    // Obtener datos del proyecto anterior
    const { data: oldCommunities, error: fetchError } = await oldSupabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Error obteniendo communities:', fetchError)
      return
    }
    
    console.log(`✅ Encontradas ${oldCommunities?.length || 0} communities`)
    
    // Migrar al nuevo proyecto
    if (oldCommunities && oldCommunities.length > 0) {
      const communitiesToMigrate = oldCommunities.map(({ id, ...rest }) => rest)
      
      const { data: newData, error: insertError } = await newSupabase
        .from('communities')
        .insert(communitiesToMigrate)
        .select()
      
      if (insertError) {
        console.error('❌ Error:', insertError)
      } else {
        console.log(`✅ ${newData?.length || 0} communities migradas exitosamente`)
      }
    }
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
  }
}

migrateCommunities()