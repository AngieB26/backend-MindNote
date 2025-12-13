# 🔧 Solución: Notas no se guardan en el backend

## Problema Identificado

Tu frontend tiene un hook `useNotes` que **solo guarda en localStorage**, no envía las notas al backend. Por eso:

1. Creas una nota → Solo se guarda en localStorage del navegador
2. Editas la nota → Todavía en localStorage
3. Al recargar la página → Las notas desaparecen porque no están en el backend

## ✅ Solución

Necesitas modificar tu hook `useNotes` para que haga POST al backend cuando creas una nota.

### Paso 1: Verificar que el backend funciona

Abre la consola del navegador (F12) y ejecuta:

```javascript
// TEST 1: Crear nota
const response = await fetch('https://backend-nextjs-one.vercel.app/api/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test desde consola',
    content: 'Esta es una prueba',
    categoryId: 'cmj3lq03z00005cc6qi9kal00' // ID de la categoría "General"
  })
});
const data = await response.json();
console.log('Resultado:', data);
```

Si ves `{ok: true, data: {...}}` → El backend funciona ✅

### Paso 2: Modificar el hook useNotes

Encuentra el archivo `useNotes.ts` o `useNotes.js` en tu frontend y modifica la función `createNote`:

```typescript
// ❌ MAL - Solo guarda en localStorage
function createNote(title, content, categoryId) {
  const newNote = {
    id: generateId(),
    title,
    content,
    categoryId: categoryId || 'default',
    createdAt: new Date().toISOString()
  };
  
  const updated = [...notes, newNote];
  setNotes(updated);
  localStorage.setItem('notes', JSON.stringify(updated)); // ❌ Solo local
}

// ✅ BIEN - Envía al backend
async function createNote(title, content, categoryId) {
  try {
    const response = await fetch('https://backend-nextjs-one.vercel.app/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        categoryId: categoryId || undefined, // Backend usa "General" si no hay
        isPinned: false
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      // Agregar la nota al estado
      setNotes(prev => [result.data, ...prev]);
      
      // Guardar en localStorage como caché
      localStorage.setItem('notes-cache', JSON.stringify([result.data, ...notes]));
      
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Error creando nota:', error);
    throw error;
  }
}
```

### Paso 3: Modificar updateNote también

```typescript
async function updateNote(id, updates) {
  try {
    const response = await fetch(`https://backend-nextjs-one.vercel.app/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates) // { title?, content?, categoryId?, isPinned? }
    });

    const result = await response.json();
    
    if (result.ok) {
      // Actualizar en el estado
      setNotes(prev => prev.map(note => 
        note.id === id ? result.data : note
      ));
      
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Error actualizando nota:', error);
    throw error;
  }
}
```

### Paso 4: Cargar notas del backend al iniciar

```typescript
useEffect(() => {
  loadNotesFromBackend();
}, []);

async function loadNotesFromBackend() {
  try {
    const response = await fetch('https://backend-nextjs-one.vercel.app/api/notes');
    const result = await response.json();
    
    if (result.ok) {
      setNotes(result.data);
      localStorage.setItem('notes-cache', JSON.stringify(result.data));
    }
  } catch (error) {
    console.error('Error cargando notas:', error);
    // Fallback: cargar desde localStorage
    const cached = localStorage.getItem('notes-cache');
    if (cached) {
      setNotes(JSON.parse(cached));
    }
  }
}
```

## 🧪 Cómo verificar que funciona

1. Abre la consola del navegador (F12) → pestaña Network
2. Filtra por "Fetch/XHR"
3. Crea una nota en tu app
4. Deberías ver un request `POST https://backend-nextjs-one.vercel.app/api/notes`
5. Si ves Status 201 → ✅ Funciona
6. Si NO ves el request → ❌ El frontend no está llamando al backend

## 📝 Resumen

El problema NO es el backend (funciona perfectamente), es que el frontend no lo está usando.

Necesitas:
1. ✅ Modificar `createNote` para hacer POST al backend
2. ✅ Modificar `updateNote` para hacer PATCH al backend
3. ✅ Cargar notas del backend al iniciar la app
4. ✅ Usar localStorage solo como caché, no como base de datos principal
