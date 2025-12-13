const https = require('https');

function testNoteCreation(scenario, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);

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
          if (parsed.ok) {
            console.log(`✅ ${scenario}:`);
            console.log(`   - Note ID: ${parsed.data.id}`);
            console.log(`   - UserId: ${parsed.data.userId || '(null)'}`);
            console.log(`   - Category: ${parsed.data.category?.name}\n`);
          } else {
            console.log(`❌ ${scenario}: ${parsed.error}\n`);
          }
        } catch (e) {
          console.log(`❌ ${scenario}: Parse error\n`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${scenario}: ${e.message}\n`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('Testing different note creation scenarios...\n');

  // Scenario 1: Minimal (no userId, no categoryId)
  await testNoteCreation(
    'Scenario 1: Minimal (solo título y contenido)',
    {
      title: 'Nota mínima',
      content: 'Solo con título y contenido'
    }
  );

  // Scenario 2: With categoryId only
  await testNoteCreation(
    'Scenario 2: Con categoryId específica',
    {
      title: 'Nota con categoría',
      content: 'Tiene categoría especificada',
      categoryId: 'cmj3lq03z00005cc6qi9kal00'
    }
  );

  // Scenario 3: With userId only
  await testNoteCreation(
    'Scenario 3: Con userId específico',
    {
      title: 'Nota con usuario',
      content: 'Tiene usuario especificado',
      userId: 'cmj3k8oyp0000jgbubth55gak'
    }
  );

  // Scenario 4: With both (full data)
  await testNoteCreation(
    'Scenario 4: Todos los parámetros',
    {
      title: 'Nota completa',
      content: 'Tiene usuario y categoría',
      userId: 'cmj3k8oyp0000jgbubth55gak',
      categoryId: 'cmj3lq03z00005cc6qi9kal00'
    }
  );

  console.log('✨ All scenarios completed!');
}

runTests();
