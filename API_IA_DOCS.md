# API de IA - MindNote

## Configuración

Asegúrate de agregar tu API Key de OpenAI en el archivo `.env`:
```
OPENAI_API_KEY="sk-..."
```

## Endpoints Disponibles

### 1. Análisis de Texto - `/api/ai/analyze`

Analiza texto con diferentes propósitos.

**Método:** POST

**Body:**
```json
{
  "text": "Tu texto aquí",
  "type": "summary" | "sentiment" | "category" | "keywords" | "improve"
}
```

**Ejemplos:**

```bash
# Resumir texto
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Esta es una reunión importante donde discutimos los objetivos del próximo trimestre...",
    "type": "summary"
  }'

# Analizar sentimiento
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hoy fue un día increíble, logré completar todas mis tareas",
    "type": "sentiment"
  }'

# Sugerir categoría
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Llamar al dentista mañana a las 10am",
    "type": "category"
  }'

# Extraer palabras clave
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Necesito investigar sobre inteligencia artificial y machine learning",
    "type": "keywords"
  }'

# Mejorar texto
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "hay q hacer esto rapido",
    "type": "improve"
  }'
```

### 2. Chat con IA - `/api/ai/chat`

Conversa con el asistente de IA sobre tus notas.

**Método:** POST

**Body:**
```json
{
  "message": "Tu pregunta o mensaje",
  "context": "Contexto opcional de tus notas",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Mensaje anterior"
    },
    {
      "role": "assistant",
      "content": "Respuesta anterior"
    }
  ]
}
```

**Ejemplo:**

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cómo puedo organizar mejor mis notas de trabajo?",
    "context": "Tengo muchas notas sobre proyectos y reuniones"
  }'
```

### 3. Generar Contenido - `/api/ai/generate`

Genera contenido nuevo basado en un prompt.

**Método:** POST

**Body:**
```json
{
  "prompt": "Tema o instrucción",
  "type": "note" | "idea" | "task" | "outline" | "expand",
  "category": "Ideas" | "Tareas" | "Reuniones" | "Personal" | "Trabajo"
}
```

**Ejemplos:**

```bash
# Generar una nota completa
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Plan de marketing para redes sociales",
    "type": "note",
    "category": "Trabajo"
  }'

# Generar ideas
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Mejorar la productividad personal",
    "type": "idea"
  }'

# Generar lista de tareas
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Organizar un evento corporativo",
    "type": "task"
  }'

# Generar esquema
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Presentación sobre IA",
    "type": "outline"
  }'

# Expandir texto
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "La IA está transformando el mundo",
    "type": "expand"
  }'
```

### 4. Búsqueda Inteligente - `/api/ai/search`

Busca en tus notas usando lenguaje natural con IA.

**Método:** POST

**Body:**
```json
{
  "query": "¿Qué quieres buscar?",
  "userId": "id-del-usuario",
  "limit": 5
}
```

**Ejemplo:**

```bash
curl -X POST http://localhost:3000/api/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "notas sobre reuniones del mes pasado",
    "userId": "user123",
    "limit": 5
  }'
```

## Respuestas

Todas las APIs devuelven respuestas en formato JSON:

**Éxito:**
```json
{
  "success": true,
  "result": "...",  // o "response", "content", "results" según el endpoint
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Mensaje de error",
  "details": []  // Opcional, para errores de validación
}
```

## Uso desde el Frontend

```typescript
// Ejemplo: Analizar texto
async function analyzeText(text: string, type: string) {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, type }),
  });
  
  const data = await response.json();
  return data;
}

// Ejemplo: Chat
async function chatWithAI(message: string, context?: string) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, context }),
  });
  
  const data = await response.json();
  return data.response;
}

// Ejemplo: Generar contenido
async function generateContent(prompt: string, type: string, category?: string) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, type, category }),
  });
  
  const data = await response.json();
  return data.content;
}

// Ejemplo: Búsqueda inteligente
async function searchNotes(query: string, userId: string) {
  const response = await fetch('/api/ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, userId }),
  });
  
  const data = await response.json();
  return data.results;
}
```

## Modelos Utilizados

- **GPT-4o-mini**: Usado en todos los endpoints por su equilibrio entre costo y rendimiento
- **Temperature**: Configurada según el caso de uso (0.3 para búsquedas, 0.7 para análisis, 0.9 para generación)

## Costos Estimados

Con GPT-4o-mini los costos son muy bajos:
- Análisis de texto: ~$0.001 por solicitud
- Chat: ~$0.002 por mensaje
- Generación: ~$0.002 por generación
- Búsqueda: ~$0.003 por búsqueda

## Próximas Funcionalidades

- [ ] Transcripción de voz a texto
- [ ] Generación de imágenes para notas
- [ ] Resumen automático de múltiples notas
- [ ] Sugerencias proactivas basadas en patrones
- [ ] Integración con vectores para búsqueda semántica avanzada
