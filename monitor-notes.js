const https = require('https');

async function monitorNotes() {
  console.log('🔍 Monitoreando creación de notas...\n');
  console.log('Obteniendo notas actuales...\n');

  const initialNotes = await new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: '/api/notes',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data.ok ? data.data : []);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.end();
  });

  console.log(`Total de notas en backend: ${initialNotes.length}`);
  console.log('\nÚltimas 3 notas creadas:\n');
  
  initialNotes.slice(0, 3).forEach((note, i) => {
    console.log(`${i + 1}. "${note.title}"`);
    console.log(`   ID: ${note.id}`);
    console.log(`   Categoría: ${note.category?.name || 'Sin categoría'}`);
    console.log(`   Creada: ${new Date(note.createdAt).toLocaleString()}`);
    console.log(`   Actualizada: ${new Date(note.updatedAt).toLocaleString()}`);
    console.log('');
  });

  console.log('='.repeat(70));
  console.log('\n💡 INSTRUCCIONES:');
  console.log('1. Crea una nota en tu frontend');
  console.log('2. Elige una categoría');
  console.log('3. Guarda la nota');
  console.log('4. Espera 3 segundos');
  console.log('5. Presiona Ctrl+C aquí\n');
  console.log('Esperando 20 segundos para que crees la nota...\n');

  await new Promise(resolve => setTimeout(resolve, 20000));

  console.log('\nVerificando si se creó la nota...\n');

  const finalNotes = await new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: '/api/notes',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data.ok ? data.data : []);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.end();
  });

  const newNotes = finalNotes.length - initialNotes.length;
  
  if (newNotes > 0) {
    console.log(`✅ ¡Se crearon ${newNotes} nota(s) nueva(s)!`);
    console.log('\nNuevas notas:\n');
    finalNotes.slice(0, newNotes).forEach((note, i) => {
      console.log(`${i + 1}. "${note.title}"`);
      console.log(`   Categoría: ${note.category?.name}`);
      console.log(`   Creada: ${new Date(note.createdAt).toLocaleString()}\n`);
    });
    console.log('✅ El frontend SÍ está enviando notas al backend correctamente.\n');
  } else {
    console.log('❌ NO se crearon notas nuevas en el backend.');
    console.log('❌ El frontend solo está guardando en localStorage.\n');
    console.log('PROBLEMA: El hook useNotes NO está ejecutando POST al backend.\n');
  }
}

monitorNotes();
