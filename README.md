# 🚀 MindNote Backend API

Backend API REST para la aplicación MindNote - Sistema de notas inteligente con IA.

## 📋 Descripción

Este es un **backend API puro** construido con Next.js 16 (App Router). **NO incluye frontend** - solo endpoints de API para ser consumidos por tu aplicación frontend separada.

## 🛠️ Stack Tecnológico

- **Next.js 16.0.10** - Framework para API Routes
- **Prisma 5.22.0** - ORM para PostgreSQL
- **Gemini** - Inteligencia Artificial
- **bcryptjs** - Encriptación de contraseñas
- **Zod** - Validación de esquemas
- **TypeScript** - Tipado estático

## 🔐 Características de Seguridad

- ✅ Cookies httpOnly y secure
- ✅ Protección CSRF con tokens
- ✅ Rate limiting por IP
- ✅ Sanitización de inputs
- ✅ Encriptación bcrypt (12 rounds)
- ✅ Headers de seguridad
- ✅ Validación con Zod

## 🌐 Endpoints Disponibles

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión  
- `POST /api/auth/logout` - Cerrar sesión

### IA (Inteligencia Artificial)
- `POST /api/ai/analyze` - Análisis de texto
- `POST /api/ai/chat` - Chat conversacional
- `POST /api/ai/generate` - Generación de contenido
- `POST /api/ai/search` - Búsqueda semántica

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar .env con DATABASE_URL y OPENAI_API_KEY

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor
npm run dev
```

## 📡 Uso desde Frontend

**Tu frontend debe estar en:** `https://backend-mind-note.vercel.app/`

### Ejemplo de Request

```javascript
// Login
const response = await fetch('https://backend-mind-note.vercel.app/api/auth/login', {
  method: 'POST',
  credentials: 'include', // ⚠️ IMPORTANTE: para cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
localStorage.setItem('csrfToken', data.csrfToken);

// Usar endpoints de IA
await fetch('https://backend-mind-note.vercel.app/api/ai/analyze', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': localStorage.getItem('csrfToken')
  },
  body: JSON.stringify({
    text: 'Tu texto aquí',
    type: 'summary'
  })
});
```

**Ver más ejemplos en:** `FRONTEND_EXAMPLE.js`

## 📚 Documentación

- **API Documentation**: [API_IA_DOCS.md](API_IA_DOCS.md)
- **Security Documentation**: [SECURITY_DOCS.md](SECURITY_DOCS.md)
- **Frontend Examples**: [FRONTEND_EXAMPLE.js](FRONTEND_EXAMPLE.js)

## 🔒 Rate Limits

- Register: 5 intentos / 15 min
- Login: 10 intentos / 15 min
- AI Endpoints: 20 requests / min

## 🛡️ CORS

Configurado para: `https://backend-mind-note.vercel.app/`

## 🌍 URLs

- **Backend API**: https://backend-mind-note.vercel.app/
- **Tu Frontend**: https://backend-mind-note.vercel.app/

## ⚠️ Importante

- Este proyecto **NO tiene frontend** - solo API
- Tu frontend debe incluir `credentials: 'include'` en todas las peticiones
- CSRF tokens se envían en header `X-CSRF-Token`
- Las cookies se manejan automáticamente

## 🔧 Variables de Entorno

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
NODE_ENV="development"
```

## 📦 Scripts

```bash
npm run dev    # Desarrollo
npm run build  # Build producción
npm run start  # Iniciar producción
```
