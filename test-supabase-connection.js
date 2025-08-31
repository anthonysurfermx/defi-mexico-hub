// Script para probar la conexión a Supabase
// Ejecutar con: node test-supabase-connection.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔗 Probando conexión a Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? `${supabaseKey.slice(0, 20)}...` : 'No encontrada')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas')
  console.log('Verifica que .env tenga:')
  console.log('VITE_SUPABASE_URL=tu_url')
  console.log('VITE_SUPABASE_ANON_KEY=tu_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n📊 Probando consulta básica...')
    
    // Probar si la tabla existe
    const { data, error, count } = await supabase
      .from('courses')
      .select('id, title, instructor', { count: 'exact' })
      .limit(5)

    if (error) {
      console.error('❌ Error en la consulta:', error.message)
      return false
    }

    console.log(`✅ Conexión exitosa! Encontrados ${count} cursos`)
    console.log('📝 Primeros cursos:')
    data.forEach(curso => {
      console.log(`  - ${curso.title} (por ${curso.instructor})`)
    })

    return true
  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
    return false
  }
}

async function testCreateCourse() {
  try {
    console.log('\n➕ Probando crear curso de prueba...')
    
    const testCourse = {
      title: 'Test Course - ' + Date.now(),
      description: 'Curso de prueba para verificar conexión',
      duration: '1h',
      level: 'Principiante',
      category: 'defi',
      instructor: 'Test Instructor',
      students: 0,
      rating: 4.0,
      topics: ['Test'],
      circle_url: 'https://circle.so/test',
      status: 'draft',
      featured: false
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([testCourse])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creando curso:', error.message)
      return false
    }

    console.log('✅ Curso de prueba creado:', data.title)
    
    // Eliminar el curso de prueba
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', data.id)

    if (!deleteError) {
      console.log('🧹 Curso de prueba eliminado')
    }

    return true
  } catch (error) {
    console.error('❌ Error en test de creación:', error.message)
    return false
  }
}

// Ejecutar tests
async function runTests() {
  const connectionOk = await testConnection()
  
  if (connectionOk) {
    await testCreateCourse()
  }
  
  console.log('\n🏁 Tests completados')
}

runTests()