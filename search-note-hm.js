const https = require('https');

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

async function searchNote() {
  console.log('🔍 Buscando nota sobre "El hombre sin pasado: H.M."\n');
  
  const notas = await getNotes();
  console.log(`Total notas en BD: ${notas.length}\n`);

  // Buscar la nota específica
  const notaHM = notas.find(n => 
    n.title?.includes('H.M.') || 
    n.title?.includes('Paciente') ||
    n.content?.includes('Henry Molaison')
  );

  if (notaHM) {
    console.log('✅ ¡NOTA ENCONTRADA EN LA BASE DE DATOS!\n');
    console.log(`Título: ${notaHM.title}`);
    console.log(`ID: ${notaHM.id}`);
    console.log(`Categoría: ${notaHM.category?.name || 'Sin categoría'}`);
    console.log(`UserId: ${notaHM.userId || '(anónimo)'}`);
    console.log(`Creada: ${new Date(notaHM.createdAt).toLocaleString()}`);
    console.log(`\nContenido (primeros 100 caracteres):`);
    console.log(`"${notaHM.content?.substring(0, 100)}..."`);
  } else {
    console.log('❌ Nota NO encontrada en la base de datos\n');
    console.log('Esto significa que el frontend NO está enviando datos al backend.\n');
    console.log('Últimas 5 notas guardadas:\n');
    notas.slice(0, 5).forEach((nota, i) => {
      console.log(`${i + 1}. ${nota.title}`);
      console.log(`   Creada: ${new Date(nota.createdAt).toLocaleString()}\n`);
    });
  }
}

searchNote();
