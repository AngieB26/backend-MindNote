import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://frontend-lovable.vercel.app',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: 'chat', method: 'GET' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const chatSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío'),
  context: z.string().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, conversationHistory = [] } = chatSchema.parse(body);

    const systemPrompt = `Eres un asistente inteligente de IA para MindNote, una aplicación de toma de notas.
Ayudas a los usuarios a:
- Organizar y estructurar sus notas
- Generar ideas y contenido
- Responder preguntas sobre sus notas
- Proporcionar sugerencias útiles

Responde en español de manera clara y concisa.${context ? `\n\nContexto de las notas del usuario:\n${context}` : ''}`;

    const history = conversationHistory.map(msg => 
      `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n\n');

    const fullPrompt = `${systemPrompt}

${history ? `Historial de conversación:
${history}

` : ''}Usuario: ${message}

Asistente:`;

    const completion = await getGemini().generateContent(fullPrompt);
    const response = completion.response.text();

    return new Response(JSON.stringify({ success: true, response }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en chat de IA:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Datos de entrada inválidos', details: error.issues }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Error al procesar el chat' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
