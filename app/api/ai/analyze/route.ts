import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { sanitizeInput, checkRateLimit, getRateLimitIdentifier } from '../../../lib/security';

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

const analyzeSchema = z.object({
  text: z.string().min(1, 'El texto no puede estar vacío').max(10000, 'El texto es demasiado largo'),
  type: z.enum(['summary', 'sentiment', 'category', 'keywords', 'improve']),
});

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: 'analyze', method: 'GET' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  try {
    // ============== RATE LIMITING ==============
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: new Date(rateLimit.resetTime).toISOString(),
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ============== PARSE AND VALIDATE ==============
    const body = await request.json();
    const { text, type } = analyzeSchema.parse(body);

    // ============== SANITIZE INPUT ==============
    const sanitizedText = sanitizeInput(text);

    let prompt = '';
    const systemPrompt = 'Eres un asistente inteligente para la aplicación MindNote que ayuda a los usuarios a organizar sus notas.';

    switch (type) {
      case 'summary':
        prompt = `Resume el siguiente texto de manera concisa y clara en español:\n\n${sanitizedText}`;
        break;
      case 'sentiment':
        prompt = `Analiza el sentimiento del siguiente texto y clasifícalo como: positivo, negativo, neutral o mixto. Proporciona también una breve explicación:\n\n${sanitizedText}`;
        break;
      case 'category':
        prompt = `Basándote en el siguiente texto, sugiere la mejor categoría entre: Ideas, Tareas, Reuniones, Personal, Trabajo. Responde solo con el nombre de la categoría y una breve justificación:\n\n${sanitizedText}`;
        break;
      case 'keywords':
        prompt = `Extrae las palabras clave más importantes del siguiente texto. Lista máximo 5 palabras clave en español:\n\n${sanitizedText}`;
        break;
      case 'improve':
        prompt = `Mejora el siguiente texto haciéndolo más claro, conciso y profesional. Mantén el significado original:\n\n${sanitizedText}`;
        break;
    }

    const completion = await getGemini().generateContent(`${systemPrompt}\n\n${prompt}`);
    const result = completion.response.text();

    return new Response(
      JSON.stringify({ success: true, result, type }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Error en análisis de IA:', error);

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
      JSON.stringify({ success: false, error: 'Error al procesar la solicitud de IA' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
