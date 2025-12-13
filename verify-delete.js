const https = require('https');

async function testDelete() {
  // Primero crear una nota para eliminar
  const createData = JSON.stringify({
    title: 'Nota de prueba DELETE',
    content: 'Esta nota será eliminada'
  });

  console.log('1. Creando nota de prueba...\n');

  const createResult = await new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: '/api/notes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(createData)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status POST: ${res.statusCode}`);
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: 'Parse error' });
        }
      });
    });

    req.on('error', (e) => resolve({ error: e.message }));
    req.write(createData);
    req.end();
  });

  if (!createResult.ok) {
    console.log('❌ Error creando nota:', createResult);
    return;
  }

  const noteId = createResult.data.id;
  console.log(`✅ Nota creada con ID: ${noteId}\n`);

  // Ahora intentar eliminarla
  console.log(`2. Intentando DELETE /api/notes/${noteId}...\n`);

  const deleteResult = await new Promise((resolve) => {
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: `/api/notes/${noteId}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status DELETE: ${res.statusCode}`);
      console.log('Headers:');
      console.log('- Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
      console.log('- Content-Type:', res.headers['content-type']);
      
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('\nResponse body:', body);
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: body, error: 'Parse error' });
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Request error:', e.message);
      resolve({ error: e.message });
    });

    req.end();
  });

  if (deleteResult.status === 200) {
    console.log('\n✅ DELETE funcionó correctamente');
  } else if (deleteResult.status === 404) {
    console.log('\n❌ ERROR 404 - El endpoint NO existe o la ruta dinámica no funciona');
  } else {
    console.log('\n⚠️ Respuesta inesperada:', deleteResult);
  }
}

testDelete();
