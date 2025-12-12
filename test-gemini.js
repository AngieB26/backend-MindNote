const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = 'AIzaSyCOgDYWpbv9SOerjCf9wN67GlqkJGmOMeI';
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTest = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest'
  ];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`\nProbando ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Di solo "hola"');
      console.log(`✓ ${modelName} FUNCIONA!`);
      console.log('Respuesta:', result.response.text());
      return modelName; // Retornar el primer modelo que funcione
    } catch (error) {
      console.log(`✗ ${modelName} - ${error.status}: ${error.statusText}`);
    }
  }
}

testGemini();
