# Cómo Verificar la Conexión a la Base de Datos

## ✅ La Base de Datos se Conecta Automáticamente

La base de datos **se inicializa automáticamente** cuando inicias el servidor. No necesitas hacer nada adicional.

## 🔍 Cómo Verificar que Está Conectada

### 1. **Revisa los Logs al Iniciar el Servidor**

Cuando ejecutas `npm run dev`, deberías ver mensajes como:

```
Database loaded from file
📊 Database initialized
🚀 Server running on http://localhost:3001
🔐 Default credentials: fibiadmin / fibi2026
```

O si es la primera vez:

```
New database created
Default admin user created (username: fibiadmin, password: fibi2026)
📊 Database initialized
🚀 Server running on http://localhost:3001
```

### 2. **Verifica el Archivo de Base de Datos**

Busca el archivo `database.sqlite` en la raíz del proyecto:

```bash
# En Windows (Git Bash o PowerShell)
ls database.sqlite

# O verifica si existe
test -f database.sqlite && echo "Base de datos existe" || echo "Base de datos no existe"
```

### 3. **Usa el Endpoint de Estado de la Base de Datos**

Haz una petición GET a:

```
http://localhost:3001/api/db/status
```

**Ejemplo con curl:**
```bash
curl http://localhost:3001/api/db/status
```

**Ejemplo con navegador:**
Abre en tu navegador: `http://localhost:3001/api/db/status`

**Respuesta esperada (si está conectada):**
```json
{
  "connected": true,
  "databaseFile": "./database.sqlite",
  "fileExists": true,
  "fileSize": 8192,
  "stats": {
    "users": 1,
    "products": 0
  },
  "error": null,
  "timestamp": "2024-01-05T19:00:00.000Z"
}
```

**Si NO está conectada:**
```json
{
  "connected": false,
  "databaseFile": "./database.sqlite",
  "fileExists": false,
  "fileSize": 0,
  "stats": {
    "users": 0,
    "products": 0
  },
  "error": "Database not initialized. Call initializeDatabase() first.",
  "timestamp": "2024-01-05T19:00:00.000Z"
}
```

### 4. **Prueba Haciendo Login**

Si la base de datos está conectada, deberías poder hacer login:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"fibiadmin","password":"fibi2026"}'
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "username": "fibiadmin"
  }
}
```

## 🛠️ Qué Hacer si NO Está Conectada

### Opción 1: Reiniciar el Servidor

Simplemente detén el servidor (Ctrl+C) y vuelve a iniciarlo:

```bash
npm run dev
```

### Opción 2: Ejecutar la Migración Manualmente

```bash
npm run migrate
```

Esto inicializará la base de datos y creará todas las tablas.

### Opción 3: Verificar Errores

1. **Revisa la consola** para ver si hay errores al iniciar
2. **Verifica que las dependencias estén instaladas:**
   ```bash
   npm install
   ```
3. **Verifica que el puerto esté libre:**
   - El servidor usa el puerto 3001 por defecto
   - Si está ocupado, cambia el puerto en el archivo `.env`

### Opción 4: Eliminar y Recrear la Base de Datos

Si hay problemas, puedes eliminar el archivo de base de datos y recrearlo:

```bash
# Eliminar la base de datos (si existe)
rm database.sqlite

# Reiniciar el servidor (se creará automáticamente)
npm run dev
```

## 📋 Checklist de Verificación

- [ ] El servidor inicia sin errores
- [ ] Ves el mensaje "📊 Database initialized" en la consola
- [ ] Existe el archivo `database.sqlite` en la raíz del proyecto
- [ ] El endpoint `/api/db/status` retorna `"connected": true`
- [ ] Puedes hacer login con las credenciales por defecto
- [ ] Puedes crear productos (después de hacer login)

## 🐛 Problemas Comunes

### Error: "Database not initialized"
**Solución:** El servidor no se inició correctamente. Reinicia el servidor.

### Error: "Cannot find module 'sql.js'"
**Solución:** Instala las dependencias:
```bash
npm install
```

### Error: "Failed to initialize database"
**Solución:** 
1. Verifica que tengas conexión a internet (la primera vez descarga archivos WASM)
2. Verifica los permisos de escritura en la carpeta del proyecto
3. Revisa los logs completos del error

### El archivo database.sqlite no se crea
**Solución:**
1. Verifica los permisos de la carpeta
2. Verifica que el servidor se haya iniciado correctamente
3. Ejecuta `npm run migrate` manualmente

## 📞 Próximos Pasos

Una vez que verifiques que la base de datos está conectada:

1. **Prueba el login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"fibiadmin","password":"fibi2026"}'
   ```

2. **Guarda el token** que recibes

3. **Prueba crear un producto:**
   ```bash
   curl -X POST http://localhost:3001/api/products \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TU_TOKEN_AQUI" \
     -d '{
       "name": "Perfume Test",
       "description": "Descripción de prueba",
       "category": "Perfumes",
       "quantity": 10,
       "minThreshold": 5
     }'
   ```

4. **Lista los productos:**
   ```bash
   curl http://localhost:3001/api/products \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

