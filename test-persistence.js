const https = require('https');

function createNote(title, content) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ title, content });
    
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: '/api/notes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve(parsed.ok ? parsed.data : null);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

function getNotes() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: '/api/notes',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve(parsed.ok ? parsed.data : []);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.end();
  });
}

async function testPersistence() {
  console.log('🔍 PRUEBA DE PERSISTENCIA DE NOTAS\n');
  console.log('='.repeat(70));

  // Paso 1: Contar notas actuales
  console.log('\n1️⃣  Obteniendo notas actuales...');
  const notasBefore = await getNotes();
  console.log(`   📊 Total notas ANTES: ${notasBefore.length}`);

  // Paso 2: Crear una nota nueva
  console.log('\n2️⃣  Creando nueva nota...');
  const timestamp = Date.now();
  const nuevaNota = await createNote(
    `Prueba Persistencia ${timestamp}`,
    `Esta es una nota de prueba creada a las ${new Date().toLocaleString()}`
  );

  if (!nuevaNota) {
    console.log('   ❌ ERROR: No se pudo crear la nota');
    return;
  }

  console.log(`   ✅ Nota creada exitosamente`);
  console.log(`   📝 ID: ${nuevaNota.id}`);
  console.log(`   📝 Título: ${nuevaNota.title}`);

  // Paso 3: Esperar un momento
  console.log('\n3️⃣  Esperando 2 segundos para asegurar persistencia...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('   ✅ Esperado');

  // Paso 4: Obtener notas nuevamente
  console.log('\n4️⃣  Obteniendo notas nuevamente...');
  const notasAfter = await getNotes();
  console.log(`   📊 Total notas DESPUÉS: ${notasAfter.length}`);

  // Paso 5: Buscar la nota creada
  console.log('\n5️⃣  Verificando si la nota está en la base de datos...');
  const notaEncontrada = notasAfter.find(n => n.id === nuevaNota.id);

  if (notaEncontrada) {
    console.log('   ✅ ¡NOTA ENCONTRADA! La persistencia funciona correctamente');
    console.log(`   📝 Título: ${notaEncontrada.title}`);
    console.log(`   📝 Contenido: ${notaEncontrada.content}`);
    console.log(`   📝 Categoría: ${notaEncontrada.category.name}`);
    console.log(`   📝 UserId: ${notaEncontrada.userId || '(null)'}`);
    console.log(`   📝 Creada: ${new Date(notaEncontrada.createdAt).toLocaleString()}`);
  } else {
    console.log('   ❌ ¡NOTA NO ENCONTRADA! Problema de persistencia');
  }

  // Paso 6: Comparar cantidades
  console.log('\n6️⃣  Análisis de cambios:');
  const diferencia = notasAfter.length - notasBefore.length;
  console.log(`   📊 Diferencia: +${diferencia} nota(s)`);
  
  if (diferencia >= 1 && notaEncontrada) {
    console.log('   ✅ RESULTADO: Las notas SE ESTÁN GUARDANDO correctamente');
  } else if (diferencia >= 1 && !notaEncontrada) {
    console.log('   ⚠️  RESULTADO: Se incrementó el contador pero no se encontró la nota específica');
  } else {
    console.log('   ❌ RESULTADO: Las notas NO se están guardando');
  }

  // Paso 7: Mostrar últimas 3 notas
  console.log('\n7️⃣  Últimas 3 notas en la base de datos:');
  notasAfter.slice(0, 3).forEach((nota, i) => {
    console.log(`\n   ${i + 1}. ${nota.title}`);
    console.log(`      ID: ${nota.id}`);
    console.log(`      Categoría: ${nota.category.name}`);
    console.log(`      Creada: ${new Date(nota.createdAt).toLocaleString()}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Prueba completada\n');
}

testPersistence();
