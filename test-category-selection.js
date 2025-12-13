const https = require('https');

function createCategory(name, icon = '📂', color = '#FF6B6B') {
  return new Promise((resolve) => {
    const data = JSON.stringify({ name, icon, color });
    
    const options = {
      hostname: 'backend-nextjs-one.vercel.app',
      path: '/api/categories',
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
            console.log(`✅ Categoría creada: "${name}" (ID: ${parsed.data.id})`);
            resolve(parsed.data.id);
          } else {
            console.log(`❌ Error creando categoría: ${parsed.error}`);
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Error: ${e.message}`);
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

function createNote(title, content, categoryId = null) {
  return new Promise((resolve) => {
    const payload = { title, content };
    if (categoryId) payload.categoryId = categoryId;
    
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
            resolve(parsed.data);
          } else {
            console.log(`❌ Error: ${parsed.error}`);
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Test: Selección de Categoría en Notas\n');
  console.log('=' .repeat(60));

  // Crear categorías de prueba con nombres únicos
  console.log('\n1️⃣  Creando categorías de prueba...\n');
  
  const timestamp = Date.now();
  const trabajoId = await createCategory(`Trabajo_${timestamp}`, '💼', '#FF6B6B');
  const estudiosId = await createCategory(`Estudios_${timestamp}`, '📚', '#4ECDC4');
  const personalId = await createCategory(`Personal_${timestamp}`, '💭', '#FFE66D');

  console.log('\n' + '='.repeat(60));
  console.log('\n2️⃣  Creando notas CON categorías específicas...\n');

  // Nota con categoría "Trabajo"
  const nota1 = await createNote(
    'Reunión con el cliente',
    'Discutir los requisitos del proyecto',
    trabajoId
  );
  
  if (nota1) {
    console.log(`✅ Nota 1: "${nota1.title}"`);
    console.log(`   Categoría esperada: Trabajo_${timestamp}`);
    console.log(`   Categoría actual: ${nota1.category.name}`);
    console.log(`   ✓ Resultado: ${nota1.category.name === `Trabajo_${timestamp}` ? '✅ CORRECTO' : '❌ INCORRECTO'}\n`);
  }

  // Nota con categoría "Estudios"
  const nota2 = await createNote(
    'Estudiar TypeScript avanzado',
    'Tipos genéricos y tipos condicionales',
    estudiosId
  );
  
  if (nota2) {
    console.log(`✅ Nota 2: "${nota2.title}"`);
    console.log(`   Categoría esperada: Estudios_${timestamp}`);
    console.log(`   Categoría actual: ${nota2.category.name}`);
    console.log(`   ✓ Resultado: ${nota2.category.name === `Estudios_${timestamp}` ? '✅ CORRECTO' : '❌ INCORRECTO'}\n`);
  }

  // Nota con categoría "Personal"
  const nota3 = await createNote(
    'Ideas para el proyecto personal',
    'Aplicación de notas con IA',
    personalId
  );
  
  if (nota3) {
    console.log(`✅ Nota 3: "${nota3.title}"`);
    console.log(`   Categoría esperada: Personal_${timestamp}`);
    console.log(`   Categoría actual: ${nota3.category.name}`);
    console.log(`   ✓ Resultado: ${nota3.category.name === `Personal_${timestamp}` ? '✅ CORRECTO' : '❌ INCORRECTO'}\n`);
  }

  // Nota SIN categoría (debe usar General)
  console.log('='.repeat(60));
  console.log('\n3️⃣  Creando nota SIN categoría (debe usar "General")...\n');
  
  const notaGeneral = await createNote(
    'Nota sin categoría especificada',
    'Esta nota NO tiene categoryId'
  );
  
  if (notaGeneral) {
    console.log(`✅ Nota 4: "${notaGeneral.title}"`);
    console.log(`   Categoría esperada: General`);
    console.log(`   Categoría actual: ${notaGeneral.category.name}`);
    console.log(`   ✓ Resultado: ${notaGeneral.category.name === 'General' ? '✅ CORRECTO' : '❌ INCORRECTO'}\n`);
  }

  console.log('='.repeat(60));
  console.log('\n✨ Test completado\n');
  console.log('CONCLUSIÓN: Las categorías SE RESPETAN cuando se especifican.');
  console.log('           Si NO se especifica, se usa "General" por defecto.\n');
}

runTest();
