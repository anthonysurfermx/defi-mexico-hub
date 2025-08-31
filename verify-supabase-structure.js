// verify-supabase-structure.js - Script para verificar estructura de Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Verificando estructura de Supabase para Communities...\n');

async function verifyCommunitiesStructure() {
  try {
    // 1. Verificar que la tabla existe y obtener estructura
    console.log('📊 Consultando tabla communities...');
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .limit(1);

    if (communitiesError) {
      console.error('❌ Error accediendo a tabla communities:', communitiesError.message);
      return;
    }

    if (!communities || communities.length === 0) {
      console.log('⚠️ La tabla communities existe pero está vacía');
      
      // Intentar obtener estructura con una query que devuelva columnas
      const { data: emptyData, error: structureError } = await supabase
        .from('communities')
        .select('*')
        .limit(0);
        
      if (structureError) {
        console.error('❌ No se pudo obtener estructura:', structureError.message);
        return;
      }
      
      console.log('📋 Estructura obtenida (tabla vacía)');
    } else {
      console.log('✅ Tabla communities encontrada con datos');
    }

    // 2. Obtener una muestra de datos para ver la estructura real
    console.log('\n📊 Obteniendo muestra de datos...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('communities')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error obteniendo muestra:', sampleError.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      const community = sampleData[0];
      console.log('📋 Estructura de campos encontrada:');
      console.log('┌─────────────────────────────────────────────────────────────┐');
      
      // Campos esperados vs encontrados
      const expectedFields = [
        'id',
        'name', 
        'slug',
        'description',
        'long_description',
        'rules',
        'image_url',
        'banner_url',
        'category',
        'tags',
        'member_count',
        'active_members_count', 
        'post_count',
        'links',
        'is_official',
        'is_verified',
        'is_featured',
        'created_by',
        'moderators',
        'created_at',
        'updated_at'
      ];

      const actualFields = Object.keys(community);
      
      console.log('│ CAMPO                     │ ENCONTRADO │ TIPO               │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      
      expectedFields.forEach(field => {
        const found = actualFields.includes(field);
        const value = community[field];
        const type = value === null ? 'null' : typeof value;
        const status = found ? '✅' : '❌';
        
        console.log(`│ ${field.padEnd(25)} │ ${status.padEnd(8)} │ ${type.padEnd(18)} │`);
      });
      
      console.log('└─────────────────────────────────────────────────────────────┘');

      // Mostrar campos extra no esperados
      const extraFields = actualFields.filter(field => !expectedFields.includes(field));
      if (extraFields.length > 0) {
        console.log('\n🔍 Campos adicionales encontrados:');
        extraFields.forEach(field => {
          const value = community[field];
          const type = value === null ? 'null' : typeof value;
          console.log(`   • ${field}: ${type}`);
        });
      }

      // 3. Verificar tipos de datos específicos
      console.log('\n🔬 Verificando tipos de datos específicos:');
      
      // Tags debe ser array
      if (community.tags) {
        const isArray = Array.isArray(community.tags);
        console.log(`   • tags es array: ${isArray ? '✅' : '❌'} (${typeof community.tags})`);
        if (isArray) {
          console.log(`     └─ Contiene ${community.tags.length} elementos`);
        }
      }

      // Links debe ser objeto
      if (community.links) {
        const isObject = typeof community.links === 'object' && !Array.isArray(community.links);
        console.log(`   • links es objeto: ${isObject ? '✅' : '❌'} (${typeof community.links})`);
        if (isObject) {
          console.log(`     └─ Claves: ${Object.keys(community.links).join(', ')}`);
        }
      }

      // Moderators debe ser objeto
      if (community.moderators) {
        const isObject = typeof community.moderators === 'object' && !Array.isArray(community.moderators);
        console.log(`   • moderators es objeto: ${isObject ? '✅' : '❌'} (${typeof community.moderators})`);
        if (isObject) {
          console.log(`     └─ Claves: ${Object.keys(community.moderators).join(', ')}`);
        }
      }

      // Member counts deben ser números
      const memberCount = community.member_count;
      const activeMemberCount = community.active_members_count;
      const postCount = community.post_count;
      
      console.log(`   • member_count es número: ${typeof memberCount === 'number' ? '✅' : '❌'} (${typeof memberCount})`);
      console.log(`   • active_members_count es número: ${typeof activeMemberCount === 'number' ? '✅' : '❌'} (${typeof activeMemberCount})`);
      console.log(`   • post_count es número: ${typeof postCount === 'number' ? '✅' : '❌'} (${typeof postCount})`);

    }

    // 4. Verificar total de registros
    console.log('\n📊 Estadísticas de la tabla:');
    const { count, error: countError } = await supabase
      .from('communities')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error obteniendo conteo:', countError.message);
    } else {
      console.log(`   • Total de comunidades: ${count}`);
    }

    // 5. Probar queries que usa el frontend
    console.log('\n🧪 Probando queries del frontend...');

    // Query de estadísticas
    try {
      const [totalResult, verifiedResult, featuredResult] = await Promise.all([
        supabase.from('communities').select('*', { count: 'exact', head: true }),
        supabase.from('communities').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('communities').select('*', { count: 'exact', head: true }).eq('is_featured', true)
      ]);

      console.log(`   • Total: ${totalResult.count} ✅`);
      console.log(`   • Verificadas: ${verifiedResult.count} ✅`);
      console.log(`   • Destacadas: ${featuredResult.count} ✅`);
    } catch (error) {
      console.error('❌ Error en queries de estadísticas:', error.message);
    }

    // Query por slug
    try {
      const { data: bySlugData, error: slugError } = await supabase
        .from('communities')
        .select('id, name, slug')
        .limit(1);

      if (slugError) {
        console.error('❌ Error en query por slug:', slugError.message);
      } else if (bySlugData && bySlugData.length > 0) {
        const firstSlug = bySlugData[0].slug;
        console.log(`   • Query por slug funcional: ${firstSlug ? '✅' : '⚠️ (slug vacío)'}`);
      }
    } catch (error) {
      console.error('❌ Error probando query por slug:', error.message);
    }

    console.log('\n🎉 Verificación completada!');
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

// Ejecutar verificación
verifyCommunitiesStructure();