const https = require('https');

function getNotes() {
  const options = {
    hostname: 'backend-nextjs-one.vercel.app',
    path: '/api/notes',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
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
        console.log('Total notes:', parsed.data.length);
        console.log('\n📋 Últimas 5 notas creadas:\n');
        
        parsed.data.slice(0, 5).forEach((note, index) => {
          console.log(`${index + 1}. ${note.title}`);
          console.log(`   ID: ${note.id}`);
          console.log(`   UserId: ${note.userId || '(null)'}`);
          console.log(`   Category: ${note.category.name}`);
          console.log(`   Created: ${new Date(note.createdAt).toLocaleString()}\n`);
        });

        // Count anonymous notes
        const anonymousNotes = parsed.data.filter(n => !n.userId);
        console.log(`\n📊 Estadísticas:`);
        console.log(`- Total notas: ${parsed.data.length}`);
        console.log(`- Notas anónimas: ${anonymousNotes.length}`);
        console.log(`- Notas con usuario: ${parsed.data.length - anonymousNotes.length}`);
      } catch (e) {
        console.log('Error parsing response:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.end();
}

getNotes();
