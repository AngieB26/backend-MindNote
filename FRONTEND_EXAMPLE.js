// ============================================
// EJEMPLO DE USO - FRONTEND (JavaScript/TypeScript)
// ============================================

// ============================================
// 1. REGISTRO DE USUARIO
// ============================================
async function registerUser(email, name, password) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      credentials: 'include', // Importante: permite cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar CSRF token para futuras peticiones
      localStorage.setItem('csrfToken', data.csrfToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Usuario registrado:', data.user);
      return { success: true, user: data.user };
    } else {
      console.error('Error en registro:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error de red:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// Ejemplo de uso:
// registerUser('test@example.com', 'Test User', 'SecurePass123');

// ============================================
// 2. LOGIN DE USUARIO
// ============================================
async function loginUser(email, password) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      credentials: 'include', // Importante: permite cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar CSRF token y usuario
      localStorage.setItem('csrfToken', data.csrfToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Login exitoso:', data.user);
      return { success: true, user: data.user };
    } else {
      console.error('Error en login:', data.error);
      
      // Manejar rate limiting
      if (response.status === 429) {
        const retryAfter = new Date(data.retryAfter);
        console.log(`Demasiados intentos. Reintenta después de: ${retryAfter}`);
      }
      
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error de red:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// Ejemplo de uso:
// loginUser('test@example.com', 'SecurePass123');

// ============================================
// 3. LOGOUT DE USUARIO
// ============================================
async function logoutUser() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      // Limpiar datos locales
      localStorage.removeItem('csrfToken');
      localStorage.removeItem('user');
      
      console.log('Logout exitoso');
      return { success: true };
    }
  } catch (error) {
    console.error('Error en logout:', error);
    return { success: false };
  }
}

// ============================================
// 4. USAR ENDPOINTS DE IA (CON PROTECCIÓN)
// ============================================
async function analyzeText(text, type = 'summary') {
  try {
    const csrfToken = localStorage.getItem('csrfToken');
    
    const response = await fetch('http://localhost:3000/api/ai/analyze', {
      method: 'POST',
      credentials: 'include', // Importante: envía cookies
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || '', // Enviar CSRF token
      },
      body: JSON.stringify({
        text,
        type, // 'summary', 'sentiment', 'category', 'keywords', 'improve'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Verificar headers de rate limit
      const limit = response.headers.get('X-RateLimit-Limit');
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      
      console.log(`Rate limit: ${remaining}/${limit} (reset: ${reset})`);
      console.log('Resultado:', data.result);
      
      return { success: true, data };
    } else {
      console.error('Error:', data.error);
      
      // Manejar rate limiting
      if (response.status === 429) {
        const retryAfter = new Date(data.retryAfter);
        console.log(`Rate limit excedido. Reintenta después de: ${retryAfter}`);
      }
      
      // Manejar CSRF inválido
      if (response.status === 403) {
        console.log('Token CSRF inválido. Haz login de nuevo.');
      }
      
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error de red:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// Ejemplo de uso:
// analyzeText('Este es un texto de ejemplo', 'summary');

// ============================================
// 5. VALIDACIÓN DE CONTRASEÑA EN CLIENTE
// ============================================
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Ejemplo de uso:
// const validation = validatePassword('MyPass123');
// if (!validation.valid) {
//   console.error('Errores:', validation.errors);
// }

// ============================================
// 6. COMPONENTE REACT DE EJEMPLO
// ============================================
/*
import React, { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await loginUser(email, password);
    
    if (result.success) {
      // Redirigir al dashboard
      window.location.href = '/dashboard';
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;
*/

// ============================================
// 7. MANEJAR SESIÓN PERSISTENTE
// ============================================
function checkUserSession() {
  const user = localStorage.getItem('user');
  const csrfToken = localStorage.getItem('csrfToken');
  
  if (user && csrfToken) {
    try {
      const userData = JSON.parse(user);
      console.log('Usuario en sesión:', userData);
      return { loggedIn: true, user: userData };
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('csrfToken');
      return { loggedIn: false };
    }
  }
  
  return { loggedIn: false };
}

// Ejemplo de uso al cargar la app:
// const session = checkUserSession();
// if (!session.loggedIn) {
//   // Redirigir a login
// }

// ============================================
// 8. INTERCEPTOR PARA AXIOS (OPCIONAL)
// ============================================
/*
import axios from 'axios';

// Configurar axios para incluir credentials y CSRF token
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

// Interceptor para agregar CSRF token automáticamente
api.interceptors.request.use((config) => {
  const csrfToken = localStorage.getItem('csrfToken');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, redirigir a login
      localStorage.removeItem('csrfToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 429) {
      // Rate limit excedido
      const retryAfter = error.response.data.retryAfter;
      alert(`Demasiadas peticiones. Reintenta después de ${new Date(retryAfter).toLocaleTimeString()}`);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Uso:
// import api from './api';
// const response = await api.post('/auth/login', { email, password });
*/

// ============================================
// 9. PROBAR RATE LIMITING (TESTING)
// ============================================
async function testRateLimit() {
  console.log('Iniciando test de rate limiting...');
  
  for (let i = 1; i <= 25; i++) {
    const start = Date.now();
    const response = await fetch('http://localhost:3000/api/ai/analyze', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
      },
      body: JSON.stringify({
        text: 'Test de rate limiting',
        type: 'summary',
      }),
    });
    
    const data = await response.json();
    const elapsed = Date.now() - start;
    
    const remaining = response.headers.get('X-RateLimit-Remaining');
    
    console.log(`Request ${i}: Status ${response.status}, Remaining: ${remaining}, Time: ${elapsed}ms`);
    
    if (response.status === 429) {
      console.log('🛑 Rate limit alcanzado!');
      console.log('Retry after:', data.retryAfter);
      break;
    }
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Descomentar para probar:
// testRateLimit();

// ============================================
// 10. UTILIDADES
// ============================================

// Función helper para mostrar mensajes de error
function displayError(error) {
  if (typeof error === 'string') {
    console.error('Error:', error);
    // Mostrar en UI
    return error;
  }
  
  if (error.details) {
    // Error de validación Zod
    const messages = error.details.map(d => d.message).join(', ');
    console.error('Errores de validación:', messages);
    return messages;
  }
  
  return 'Error desconocido';
}

// Función para refrescar CSRF token periódicamente
async function refreshCSRFToken() {
  // El CSRF token se renueva automáticamente en cada login
  // Opcionalmente puedes crear un endpoint /api/auth/refresh-csrf
  console.log('CSRF token debe renovarse al hacer login nuevamente');
}

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    analyzeText,
    validatePassword,
    checkUserSession,
    testRateLimit,
    displayError,
  };
}
