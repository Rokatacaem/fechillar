// test-torneos.ts
// Script para probar las funciones sin necesidad del frontend

import { generarCuadroFaseAjuste, cerrarTorneoYPublicarRankings } from './actions'

async function testGenerarCuadro() {
  console.log('\n🧪 === TEST: Generar Cuadro ===\n')
  
  const torneoId = 'test-torneo-1'
  
  console.log(`📝 Generando cuadro para torneo: ${torneoId}`)
  
  const resultado = await generarCuadroFaseAjuste(torneoId)
  
  if (resultado.success) {
    console.log('✅ ÉXITO:', {
      partidosCreados: resultado.partidosCreados,
      mensaje: 'Cuadro generado correctamente'
    })
  } else {
    console.log('❌ ERROR:', resultado.error)
  }
  
  return resultado
}

async function testCerrarTorneo() {
  console.log('\n🧪 === TEST: Cerrar Torneo ===\n')
  
  const torneoId = 'test-torneo-1'
  
  console.log(`📝 Cerrando torneo: ${torneoId}`)
  
  const resultado = await cerrarTorneoYPublicarRankings(torneoId)
  
  if (resultado.success) {
    console.log('✅ ÉXITO: Torneo cerrado y rankings publicados')
  } else {
    console.log('❌ ERROR:', resultado.error)
  }
  
  return resultado
}

async function runAllTests() {
  console.log('\n🚀 === INICIANDO TESTS ===\n')
  
  try {
    // Test 1: Generar Cuadro
    const test1 = await testGenerarCuadro()
    
    // Test 2: Cerrar Torneo (comentado porque requiere partidos completos)
    // const test2 = await testCerrarTorneo()
    
    console.log('\n✅ === TESTS COMPLETADOS ===\n')
    
  } catch (error) {
    console.error('\n❌ === ERROR EN TESTS ===')
    console.error(error)
  }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runAllTests()
}

export { testGenerarCuadro, testCerrarTorneo }
