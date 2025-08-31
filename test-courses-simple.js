// Test simple de conexión a tabla courses
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://egpixaunlnzauztbrnuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4'
)

async function testCourses() {
  console.log('🔗 Probando acceso a tabla courses...')
  
  try {
    // Probar SELECT
    const { data, error, count } = await supabase
      .from('courses')
      .select('id, title, instructor', { count: 'exact' })
      .limit(3)

    if (error) {
      console.error('❌ Error en SELECT:', error.message)
      console.error('Detalles:', error)
      return false
    }

    console.log(`✅ SELECT exitoso! ${count} cursos encontrados`)
    if (data && data.length > 0) {
      console.log('📚 Cursos:')
      data.forEach(curso => console.log(`  - ${curso.title} por ${curso.instructor}`))
    }
    
    // Probar INSERT
    console.log('\n➕ Probando INSERT...')
    const testCourse = {
      title: `Test Course ${Date.now()}`,
      description: 'Curso de prueba',
      duration: '1h',
      level: 'Principiante',
      category: 'defi',
      instructor: 'Test User',
      students: 0,
      rating: 4.0,
      topics: ['test'],
      circle_url: 'https://circle.so/test',
      status: 'draft',
      featured: false
    }

    const { data: insertData, error: insertError } = await supabase
      .from('courses')
      .insert([testCourse])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error en INSERT:', insertError.message)
      console.error('Detalles:', insertError)
      return false
    }

    console.log('✅ INSERT exitoso! Curso creado:', insertData.title)

    // Limpiar
    await supabase
      .from('courses')
      .delete()
      .eq('id', insertData.id)
    console.log('🧹 Curso de prueba eliminado')

    return true
  } catch (error) {
    console.error('❌ Error general:', error.message)
    return false
  }
}

testCourses().then(() => {
  console.log('\n🏁 Test completado')
  process.exit(0)
})