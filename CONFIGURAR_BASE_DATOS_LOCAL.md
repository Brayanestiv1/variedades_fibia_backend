# Configurar Base de Datos Local (MySQL o PostgreSQL)

Este proyecto soporta tres tipos de bases de datos:
- **SQLite** (por defecto, para desarrollo rápido)
- **MySQL** (para producción o desarrollo local)
- **PostgreSQL** (para producción o desarrollo local)

## 📋 Pasos para Configurar tu Base de Datos Local

### 1. Instalar las Dependencias

Primero, instala las dependencias del proyecto (incluye los drivers de MySQL y PostgreSQL):

```bash
npm install
```

### 2. Crear la Base de Datos

#### Para MySQL:
```sql
CREATE DATABASE variedades_fibia;
```

#### Para PostgreSQL:
```sql
CREATE DATABASE variedades_fibia;
```

### 3. Configurar las Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (o copia `env.example.txt`):

#### Para MySQL:
```env
# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=variedades_fibia
```

#### Para PostgreSQL:
```env
# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres
DB_NAME=variedades_fibia
```

#### Para SQLite (por defecto):
```env
# Database Configuration
DB_TYPE=sqlite
DATABASE_PATH=./database.sqlite
```

### 4. Iniciar el Servidor

El servidor creará automáticamente las tablas necesarias al iniciar:

```bash
npm run dev
```

Deberías ver mensajes como:
```
🔌 Initializing MYSQL database...
✅ Connected to MySQL database
✅ MySQL tables created/verified
✅ Default admin user created (username: fibiadmin, password: fibi2026)
📊 Database initialized
🚀 Server running on http://localhost:3001
```

## 🔍 Verificar la Conexión

### 1. Usar el Endpoint de Estado

```bash
curl http://localhost:3001/api/db/status
```

O abre en tu navegador: `http://localhost:3001/api/db/status`

**Respuesta esperada:**
```json
{
  "connected": true,
  "databaseFile": null,
  "fileExists": false,
  "stats": {
    "users": 1,
    "products": 0
  },
  "error": null
}
```

### 2. Probar el Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"fibiadmin","password":"fibi2026"}'
```

## 📊 Estructura de Tablas Creadas

El sistema crea automáticamente estas tablas:

### `users`
- `id` (VARCHAR/UUID)
- `username` (VARCHAR, UNIQUE)
- `password` (VARCHAR, hasheado)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `products`
- `id` (VARCHAR/UUID)
- `user_id` (VARCHAR, FK a users)
- `name` (VARCHAR)
- `description` (TEXT)
- `category` (VARCHAR)
- `quantity` (INTEGER)
- `min_threshold` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `inventory_exits`
- `id` (VARCHAR/UUID)
- `product_id` (VARCHAR, FK a products)
- `user_id` (VARCHAR, FK a users)
- `quantity` (INTEGER)
- `previous_quantity` (INTEGER)
- `new_quantity` (INTEGER)
- `created_at` (TIMESTAMP)

## 🔧 Solución de Problemas

### Error: "Access denied for user"
**Solución:** Verifica que las credenciales en `.env` sean correctas.

### Error: "Unknown database"
**Solución:** Crea la base de datos primero:
```sql
CREATE DATABASE variedades_fibia;
```

### Error: "Can't connect to MySQL server"
**Solución:** 
1. Verifica que MySQL/PostgreSQL esté corriendo
2. Verifica el host y puerto en `.env`
3. Verifica que el firewall permita la conexión

### Error: "Table already exists"
**Solución:** Esto es normal, las tablas se crean con `CREATE TABLE IF NOT EXISTS`.

## 🔄 Cambiar entre Bases de Datos

Puedes cambiar fácilmente entre bases de datos cambiando `DB_TYPE` en el archivo `.env`:

- `DB_TYPE=sqlite` → SQLite (archivo local)
- `DB_TYPE=mysql` → MySQL
- `DB_TYPE=postgresql` → PostgreSQL

**Nota:** No necesitas cambiar código, solo las variables de entorno.

## 📝 Credenciales por Defecto

Al inicializar, se crea automáticamente un usuario administrador:

- **Usuario:** `fibiadmin`
- **Contraseña:** `fibi2026`

⚠️ **Importante:** Cambia estas credenciales en producción.

## ✅ Checklist

- [ ] Base de datos creada (MySQL o PostgreSQL)
- [ ] Variables de entorno configuradas en `.env`
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor inicia sin errores
- [ ] Endpoint `/api/db/status` retorna `"connected": true`
- [ ] Puedes hacer login con las credenciales por defecto
- [ ] Puedes crear y listar productos

## 🚀 Próximos Pasos

Una vez configurada la base de datos:

1. **Prueba las rutas:**
   - `POST /api/auth/login` - Login
   - `GET /api/products` - Listar productos
   - `POST /api/products` - Crear producto
   - `PUT /api/products/:id` - Actualizar producto
   - `DELETE /api/products/:id` - Eliminar producto
   - `POST /api/products/:id/exit` - Registrar salida

2. **Conecta tu frontend** apuntando a `http://localhost:3001`

3. **Cuando esté listo para producción**, solo cambia las variables de entorno en el servidor.

