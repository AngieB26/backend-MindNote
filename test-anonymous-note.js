const https = require('https');

function testAnonymousNote() {
  const data = JSON.stringify({
    title: 'Mi nota anónima',
    content: 'Esta nota se crea sin usuario ni categoría. El backend usa valores por defecto.'
  });

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
    console.log(`Status: ${res.statusCode}`);
    console.log('CORS Headers:');
    console.log('- Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('- Access-Control-Allow-Credentials:', res.headers['access-control-allow-credentials']);
    
    let responseBody = '';
    res.on('data', (chunk) => {
      responseBody += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(responseBody);
        console.log('\n✅ Response:');
        console.log(JSON.stringify(parsed, null, 2));
        
        if (parsed.ok && parsed.data) {
          console.log('\n📝 Note Details:');
          console.log('- ID:', parsed.data.id);
          console.log('- Title:', parsed.data.title);
          console.log('- UserId:', parsed.data.userId || '(null)');
          console.log('- CategoryId:', parsed.data.categoryId);
          console.log('- Category Name:', parsed.data.category?.name);
        }
      } catch (e) {
        console.log('❌ Parse Error:', e.message);
        console.log('Raw response:', responseBody);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });

  req.write(data);
  req.end();
}

console.log('Testing anonymous note creation...\n');
testAnonymousNote();
