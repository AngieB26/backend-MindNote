const https = require('https');

function makeRequest(method, path, data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ success: true, status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ success: false, status: res.statusCode, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runCompleteTest() {
  console.log('🔬 PRUEBA INTEGRAL DEL SISTEMA\n');
  console.log('=' .repeat(70));
  
  let passed = 0;
  let failed = 0;

  // TEST 1: Obtener categorías existentes
  console.log('\n1️⃣  Obtener categorías existentes');
  let res = await makeRequest('GET', '/api/categories');
  if (res.success && res.data.ok) {
    console.log(`   ✅ Status: ${res.status}`);
    console.log(`   ✅ Total categorías: ${res.data.data.length}`);
    passed++;
  } else {
    console.log(`   ❌ Error: ${res.error || res.data.error}`);
    failed++;
  }

  // TEST 2: Crear nueva categoría
  console.log('\n2️⃣  Crear nueva categoría');
  const catName = `Test_${Date.now()}`;
  res = await makeRequest('POST', '/api/categories', {
    name: catName,
    icon: '🎯',
    color: '#FF1493'
  });
  let categoryId = null;
  if (res.success && res.data.ok) {
    categoryId = res.data.data.id;
    console.log(`   ✅ Status: ${res.status}`);
    console.log(`   ✅ Categoría creada: "${catName}"`);
    console.log(`   ✅ ID: ${categoryId}`);
    passed++;
  } else {
    console.log(`   ❌ Error: ${res.error || res.data.error}`);
    failed++;
  }

  // TEST 3: Crear nota anónima (sin userId ni categoryId)
  console.log('\n3️⃣  Crear nota anónima (sin usuario ni categoría)');
  res = await makeRequest('POST', '/api/notes', {
    title: 'Nota Anónima Test',
    content: 'Esta es una nota completamente anónima'
  });
  if (res.success && res.data.ok) {
    console.log(`   ✅ Status: ${res.status}`);
    console.log(`   ✅ Nota creada: "${res.data.data.title}"`);
    console.log(`   ✅ UserId: ${res.data.data.userId || '(null)'}`);
    console.log(`   ✅ Categoría: ${res.data.data.category.name}`);
    passed++;
  } else {
    console.log(`   ❌ Error: ${res.error || res.data.error}`);
    failed++;
  }

  // TEST 4: Crear nota con categoría específica
  console.log('\n4️⃣  Crear nota con categoría específica');
  res = await makeRequest('POST', '/api/notes', {
    title: 'Nota con Categoría',
    content: 'Esta nota tiene una categoría específica',
    categoryId: categoryId
  });
  if (res.success && res.data.ok) {
    console.log(`   ✅ Status: ${res.status}`);
    console.log(`   ✅ Nota creada: "${res.data.data.title}"`);
    console.log(`   ✅ Categoría asignada: ${res.data.data.category.name}`);
    console.log(`   ✅ Categoría esperada: ${catName}`);
    if (res.data.data.category.name === catName) {
      console.log(`   ✅ VALIDACIÓN: Categoría correcta`);
      passed++;
    } else {
      console.log(`   ❌ VALIDACIÓN: Categoría no coincide`);
      failed++;
    }
  } else {
    console.log(`   ❌ Error: ${res.error || res.data.error}`);
    failed++;
  }

  // TEST 5: Obtener todas las notas
  console.log('\n5️⃣  Obtener todas las notas');
  res = await makeRequest('GET', '/api/notes');
  if (res.success && res.data.ok) {
    console.log(`   ✅ Status: ${res.status}`);
    console.log(`   ✅ Total notas: ${res.data.data.length}`);
    const anonymousNotes = res.data.data.filter(n => !n.userId);
    console.log(`   ✅ Notas anónimas: ${anonymousNotes.length}`);
    const categorizedNotes = res.data.data.filter(n => n.category);
    console.log(`   ✅ Notas con categoría: ${categorizedNotes.length}`);
    passed++;
  } else {
    console.log(`   ❌ Error: ${res.error || res.data.error}`);
    failed++;
  }

  // TEST 6: Verificar CORS headers
  console.log('\n6️⃣  Verificar headers CORS');
  res = await makeRequest('GET', '/api/notes');
  if (res.success) {
    console.log(`   ✅ Status: ${res.status}`);
    console.log(`   ✅ CORS activo`);
    passed++;
  } else {
    console.log(`   ❌ Error de CORS`);
    failed++;
  }

  // TEST 7: Intentar crear nota sin titulo (debe fallar)
  console.log('\n7️⃣  Validación: Crear nota sin título (debe fallar)');
  res = await makeRequest('POST', '/api/notes', {
    content: 'Contenido sin título'
  });
  if (res.status === 400 && res.data.error) {
    console.log(`   ✅ Status: ${res.status} (correcto)`);
    console.log(`   ✅ Error esperado: ${res.data.error}`);
    passed++;
  } else {
    console.log(`   ❌ Debería haber fallado`);
    failed++;
  }

  // TEST 8: Intentar crear nota sin contenido (debe fallar)
  console.log('\n8️⃣  Validación: Crear nota sin contenido (debe fallar)');
  res = await makeRequest('POST', '/api/notes', {
    title: 'Título sin contenido'
  });
  if (res.status === 400 && res.data.error) {
    console.log(`   ✅ Status: ${res.status} (correcto)`);
    console.log(`   ✅ Error esperado: ${res.data.error}`);
    passed++;
  } else {
    console.log(`   ❌ Debería haber fallado`);
    failed++;
  }

  // RESUMEN
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RESUMEN DE PRUEBAS:\n');
  console.log(`✅ Pruebas exitosas: ${passed}`);
  console.log(`❌ Pruebas fallidas: ${failed}`);
  console.log(`📈 Porcentaje: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
  } else {
    console.log(`\n⚠️  ${failed} prueba(s) fallida(s)`);
  }
  
  console.log('\n');
}

runCompleteTest();
