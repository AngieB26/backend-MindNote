# 🔒 Documentación de Seguridad - MindNote Backend

## Resumen de Implementaciones de Seguridad

### ✅ 1. Cookies httpOnly
**Archivo:** `app/lib/security.ts`

**Implementación:**
- Todas las cookies se crean con la flag `httpOnly: true` para prevenir acceso desde JavaScript del cliente
- Las cookies incluyen `secure: true` en producción (requiere HTTPS)
- `sameSite: 'strict'` para proteger contra CSRF
- Cookies de sesión con tiempo de expiración de 7 días
- Cookies CSRF con tiempo de expiración de 24 horas

**Funciones:**
```typescript
createSecureCookie(name, value, options)  // Crear cookie segura
parseCookies(req)                         // Parsear cookies del request
deleteCookie(name)                        // Eliminar cookie
```

**Uso en rutas:**
```typescript
// En login/register
const sessionCookie = createSecureCookie('session', user.id, {
  maxAge: 60 * 60 * 24 * 7, // 7 días
});
```

---

### ✅ 2. CSRF Protection
**Archivo:** `app/lib/security.ts` + `app/lib/middleware.ts`

**Implementación:**
- Generación de tokens CSRF únicos usando crypto.getRandomValues()
- Verificación de tokens con comparación de tiempo constante para prevenir timing attacks
- Los tokens se almacenan en cookies httpOnly
- Los tokens se envían en headers `X-CSRF-Token`

**Funciones:**
```typescript
generateCSRFToken()                        // Genera token aleatorio
verifyCSRFToken(token, storedToken)       // Verifica token (constant-time)
```

**Uso:**
```typescript
// En el middleware
if (config.requireCSRF && req.method !== 'GET') {
  const csrfToken = req.headers.get('x-csrf-token');
  const cookies = parseCookies(req);
  const storedToken = cookies['csrf-token'];
  
  if (!verifyCSRFToken(csrfToken, storedToken)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
}
```

**Cliente (Frontend):**
```javascript
// Guardar CSRF token del response
localStorage.setItem('csrfToken', response.csrfToken);

// Enviar en cada request
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': localStorage.getItem('csrfToken'),
  },
});
```

---

### ✅ 3. Rate Limiting
**Archivo:** `app/lib/security.ts`

**Implementación:**
- Rate limiting en memoria usando Map
- Configuración personalizable por endpoint
- Limpieza automática de entradas antiguas
- Headers informativos en responses (`X-RateLimit-*`)

**Configuración por endpoint:**
```typescript
// Registro: 5 intentos por 15 minutos
checkRateLimit(identifier, {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

// Login: 10 intentos por 15 minutos
checkRateLimit(identifier, {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
});

// AI endpoints: 20 requests por minuto
checkRateLimit(identifier, {
  windowMs: 60 * 1000,
  maxRequests: 20,
});
```

**Funciones:**
```typescript
getRateLimitIdentifier(req)               // Obtiene IP del cliente
checkRateLimit(identifier, config)        // Verifica y actualiza límite
```

**Response cuando excede límite:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": "2025-12-11T20:30:00.000Z"
}
```

**Headers de respuesta:**
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 2025-12-11T20:15:00.000Z
Retry-After: 45
```

---

### ✅ 4. Sanitización de Input
**Archivo:** `app/lib/security.ts`

**Implementación:**
- Escape de HTML para prevenir XSS
- Eliminación de patrones de SQL injection
- Validación y normalización de emails
- Sanitización recursiva de objetos

**Funciones:**
```typescript
sanitizeInput(input)                      // Sanitiza string
sanitizeEmail(email)                      // Valida y normaliza email
sanitizeObject(obj)                       // Sanitiza objeto recursivamente
```

**Uso:**
```typescript
// Antes de usar input del usuario
const sanitizedText = sanitizeInput(text);
const email = sanitizeEmail(rawEmail);
```

**Protecciones:**
- ✅ XSS (Cross-Site Scripting)
- ✅ SQL Injection
- ✅ HTML Injection
- ✅ Script Injection

---

### ✅ 5. Encriptación con bcrypt
**Archivo:** `app/lib/security.ts`

**Implementación:**
- Hash de contraseñas con bcrypt (12 rounds)
- Verificación segura de contraseñas
- Validación de contraseñas robustas

**Funciones:**
```typescript
hashPassword(password)                    // Hash con bcrypt (12 rounds)
verifyPassword(password, hash)            // Verifica password
isValidPassword(password)                 // Valida requisitos
```

**Requisitos de contraseña:**
- ✅ Mínimo 8 caracteres
- ✅ Al menos 1 mayúscula
- ✅ Al menos 1 minúscula
- ✅ Al menos 1 número

**Uso:**
```typescript
// Al registrar usuario
const hashedPassword = await hashPassword(plainPassword);
await prisma.user.create({
  data: { email, password: hashedPassword }
});

// Al hacer login
const isValid = await verifyPassword(plainPassword, user.password);
```

---

## Endpoints de Autenticación

### POST /api/auth/register
Registra un nuevo usuario con todas las protecciones de seguridad.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-11T..."
  },
  "csrfToken": "a1b2c3..."
}
```

**Cookies establecidas:**
- `session` (httpOnly, secure, 7 días)
- `csrf-token` (httpOnly, secure, 24 horas)

**Rate limit:** 5 registros por 15 minutos

---

### POST /api/auth/login
Inicia sesión de usuario existente.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-11T..."
  },
  "csrfToken": "a1b2c3..."
}
```

**Cookies establecidas:**
- `session` (httpOnly, secure, 7 días)
- `csrf-token` (httpOnly, secure, 24 horas)

**Rate limit:** 10 intentos por 15 minutos

---

### POST /api/auth/logout
Cierra la sesión del usuario.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookies eliminadas:**
- `session`
- `csrf-token`

---

## Endpoints de IA Protegidos

### POST /api/ai/analyze
Análisis de texto con IA (con protecciones de seguridad).

**Protecciones implementadas:**
- ✅ Rate limiting (20 requests/minuto)
- ✅ Input sanitization
- ✅ Validación con Zod
- ✅ Headers de seguridad
- ✅ CORS configurado

**Request:**
```json
{
  "text": "Tu texto aquí",
  "type": "summary"
}
```

**Rate limit:** 20 requests por minuto

---

## Headers de Seguridad

Todos los endpoints incluyen estos headers de seguridad:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Access-Control-Allow-Credentials: true
```

---

## Configuración Recomendada para Frontend

### 1. Almacenar CSRF Token
```javascript
// Después de login/register
const response = await fetch('/api/auth/login', { ... });
const data = await response.json();
localStorage.setItem('csrfToken', data.csrfToken);
```

### 2. Enviar CSRF Token en Requests
```javascript
fetch('/api/endpoint', {
  method: 'POST',
  credentials: 'include', // Importante para cookies
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': localStorage.getItem('csrfToken'),
  },
  body: JSON.stringify(data)
});
```

### 3. Manejar Rate Limits
```javascript
const response = await fetch('/api/endpoint', { ... });

if (response.status === 429) {
  const data = await response.json();
  const retryAfter = new Date(data.retryAfter);
  console.log(`Wait until ${retryAfter}`);
}
```

---

## Mejores Prácticas

### ✅ DO (Hacer):
1. Siempre enviar `credentials: 'include'` en fetch para cookies
2. Guardar y enviar CSRF token en todas las peticiones POST
3. Manejar errores 429 (rate limit)
4. Validar contraseñas fuertes en el cliente antes de enviar
5. Usar HTTPS en producción

### ❌ DON'T (No hacer):
1. No almacenar contraseñas en localStorage
2. No enviar tokens CSRF en URLs
3. No ignorar errores de validación
4. No deshabilitar CORS sin motivo
5. No usar HTTP en producción

---

## Testing de Seguridad

### Probar Rate Limiting
```bash
# Bash
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/ai/analyze \
    -H "Content-Type: application/json" \
    -d '{"text":"test","type":"summary"}'
  echo ""
done
```

### Probar CSRF Protection
```javascript
// Sin CSRF token (debe fallar)
fetch('/api/endpoint', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});
// Expected: 403 Forbidden
```

### Probar Password Validation
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test","password":"weak"}'
# Expected: 400 Bad Request con mensaje de validación
```

---

## Archivos Creados

1. **`app/lib/security.ts`** - Utilidades de seguridad core
2. **`app/lib/middleware.ts`** - Middleware de seguridad
3. **`app/api/auth/register/route.ts`** - Endpoint de registro
4. **`app/api/auth/login/route.ts`** - Endpoint de login
5. **`app/api/auth/logout/route.ts`** - Endpoint de logout
6. **`app/api/ai/analyze/route.ts`** - Actualizado con protecciones

---

## Variables de Entorno

Asegúrate de tener en `.env`:
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NODE_ENV=development  # o 'production'
```

---

## Resumen de Protecciones

| Característica | Estado | Archivo |
|----------------|--------|---------|
| Cookies httpOnly | ✅ | `app/lib/security.ts` |
| CSRF Protection | ✅ | `app/lib/security.ts` |
| Rate Limiting | ✅ | `app/lib/security.ts` |
| Input Sanitization | ✅ | `app/lib/security.ts` |
| bcrypt Encryption | ✅ | `app/lib/security.ts` |
| Security Headers | ✅ | `app/lib/middleware.ts` |
| Password Validation | ✅ | `app/lib/security.ts` |
| Email Validation | ✅ | `app/lib/security.ts` |

---

## 🎉 Fase 7 Completada

Todas las características de seguridad han sido implementadas y están listas para usar.
