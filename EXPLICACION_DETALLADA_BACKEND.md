# 📚 Explicación Detallada del Backend - Variedades Fibia

## 🎯 ¿Qué es este Backend?

Este es un **Backend API REST** completo para un sistema de gestión de inventario de productos de perfumería, cremas y maquillajes. Fue desarrollado siguiendo las especificaciones del frontend (Next.js) y está diseñado para reemplazar el uso de `localStorage` con una base de datos real.

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
variedades_fibia_backend/
├── src/
│   ├── server.ts              # Punto de entrada principal
│   ├── controllers/           # Lógica de negocio (controladores)
│   │   ├── authController.ts  # Maneja login/autenticación
│   │   ├── productController.ts # CRUD de productos
│   │   ├── inventoryController.ts # Registro de salidas
│   │   └── dbController.ts   # Estado de la base de datos
│   ├── routes/                # Definición de rutas HTTP
│   │   ├── authRoutes.ts
│   │   ├── productRoutes.ts
│   │   └── inventoryRoutes.ts
│   ├── middleware/             # Middlewares (interceptores)
│   │   ├── auth.ts           # Verificación de JWT
│   │   └── errorHandler.ts   # Manejo de errores
│   ├── database/              # Configuración de base de datos
│   │   ├── db.ts             # Orquestador principal
│   │   ├── config.ts         # Configuración
│   │   ├── sqlite.ts         # Implementación SQLite
│   │   ├── mysql.ts          # Implementación MySQL
│   │   └── postgresql.ts     # Implementación PostgreSQL
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts
│   └── utils/                # Utilidades
│       ├── validation.ts      # Validaciones con Zod
│       └── dbMapper.ts        # Mapeo de datos
├── package.json
├── tsconfig.json
└── .env                       # Variables de entorno
```

---

## 🛠️ Tecnologías Utilizadas

### Core
- **Node.js**: Entorno de ejecución JavaScript
- **Express.js**: Framework web para crear APIs REST
- **TypeScript**: JavaScript con tipos estáticos (más seguro y mantenible)

### Base de Datos
- **SQLite** (por defecto): Base de datos ligera en archivo
- **MySQL**: Base de datos relacional (opcional)
- **PostgreSQL**: Base de datos relacional avanzada (opcional)

### Seguridad y Autenticación
- **JWT (JSON Web Tokens)**: Para autenticación sin estado
- **bcryptjs**: Para hashear contraseñas de forma segura

### Validación
- **Zod**: Librería para validar datos de entrada

### Utilidades
- **uuid**: Generar IDs únicos
- **cors**: Permitir peticiones desde el frontend
- **dotenv**: Cargar variables de entorno

---

## 🔄 Flujo de Funcionamiento

### 1. Inicio del Servidor (`server.ts`)

```typescript
1. Carga variables de entorno (.env)
2. Crea aplicación Express
3. Configura middleware (CORS, JSON parser)
4. Define rutas
5. Inicializa base de datos
6. Inicia servidor en puerto 3001
```

### 2. Petición HTTP Típica

```
Cliente (Frontend)
    ↓
HTTP Request → Express Server
    ↓
Middleware (CORS, JSON parser)
    ↓
Rutas (routes/)
    ↓
Middleware de Autenticación (si es necesario)
    ↓
Controlador (controllers/)
    ↓
Validación (Zod)
    ↓
Base de Datos (database/)
    ↓
Respuesta JSON
    ↓
Cliente (Frontend)
```

---

## 📡 Endpoints Disponibles

### 🔓 Públicos (Sin autenticación)

#### `POST /api/auth/login`
**Propósito**: Iniciar sesión y obtener token JWT

**Request:**
```json
{
  "username": "fibiadmin",
  "password": "fibi2026"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "username": "fibiadmin"
  }
}
```

**Proceso:**
1. Valida que username y password existan
2. Busca usuario en base de datos
3. Compara contraseña hasheada con bcrypt
4. Genera token JWT válido por 7 días
5. Retorna token y datos del usuario

---

### 🔒 Protegidos (Requieren token JWT)

#### `GET /api/products`
**Propósito**: Listar todos los productos del usuario autenticado

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `search`: Filtrar por nombre (ej: `?search=perfume`)

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Perfume X",
      "description": "Descripción",
      "category": "Perfumes",
      "quantity": 50,
      "minThreshold": 10,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "lowStockCount": 0
}
```

**Proceso:**
1. Extrae userId del token JWT
2. Consulta productos filtrados por user_id
3. Si hay `search`, filtra por nombre
4. Calcula productos con stock bajo
5. Retorna lista ordenada alfabéticamente

---

#### `GET /api/products/:id`
**Propósito**: Obtener un producto específico por ID

**Proceso:**
1. Verifica que el producto exista
2. Verifica que pertenezca al usuario autenticado
3. Retorna producto o error 404

---

#### `POST /api/products`
**Propósito**: Crear un nuevo producto

**Request:**
```json
{
  "name": "Perfume X",
  "description": "Descripción opcional",
  "category": "Perfumes",
  "quantity": 50,
  "minThreshold": 10
}
```

**Validaciones:**
- `name`: Requerido, máximo 255 caracteres
- `description`: Opcional, máximo 1000 caracteres
- `category`: Debe ser "Perfumes", "Cremas", "Maquillajes" o "Otros"
- `quantity`: Número entero >= 0
- `minThreshold`: Número entero >= 0

**Proceso:**
1. Valida datos con Zod
2. Genera UUID único para el producto
3. Asocia producto al usuario autenticado
4. Inserta en base de datos
5. Retorna producto creado con timestamps

---

#### `PUT /api/products/:id` o `PATCH /api/products/:id`
**Propósito**: Actualizar un producto existente

**Proceso:**
1. Verifica que el producto exista y pertenezca al usuario
2. Valida datos de entrada
3. Actualiza campos en base de datos
4. Actualiza timestamp `updated_at`
5. Retorna producto actualizado

---

#### `DELETE /api/products/:id`
**Propósito**: Eliminar un producto

**Proceso:**
1. Verifica que el producto exista y pertenezca al usuario
2. Elimina de base de datos (cascade elimina salidas relacionadas)
3. Retorna 204 No Content

---

#### `POST /api/products/:id/exit`
**Propósito**: Registrar una salida de inventario (descontar stock)

**Request:**
```json
{
  "quantity": 5
}
```

**Response:**
```json
{
  "product": {
    "id": "uuid",
    "name": "Perfume X",
    "quantity": 45,
    "minThreshold": 10
  },
  "exitQuantity": 5,
  "newQuantity": 45,
  "isLowStock": false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Validaciones:**
- `quantity` debe ser > 0
- `quantity` no puede ser mayor que stock disponible

**Proceso:**
1. Obtiene producto actual
2. Valida que hay suficiente stock
3. Calcula nueva cantidad (actual - cantidad a descontar)
4. Actualiza cantidad en base de datos
5. Registra salida en tabla `inventory_exits` (auditoría)
6. Verifica si quedó en stock bajo
7. Retorna producto actualizado y estado

---

#### `GET /api/db/status`
**Propósito**: Verificar estado de conexión a base de datos

**Response:**
```json
{
  "connected": true,
  "databaseType": "sqlite",
  "databaseFile": "./database.sqlite",
  "stats": {
    "users": 1,
    "products": 5
  }
}
```

---

## 🔐 Sistema de Autenticación

### JWT (JSON Web Tokens)

**¿Qué es?**
Un token que contiene información del usuario codificada de forma segura. El servidor lo genera cuando el usuario hace login y el cliente lo envía en cada petición.

**Flujo:**
```
1. Usuario hace login → POST /api/auth/login
2. Backend valida credenciales
3. Backend genera JWT con userId y username
4. Backend retorna token al cliente
5. Cliente guarda token (localStorage)
6. Cliente envía token en header: Authorization: Bearer {token}
7. Middleware verifica token en cada petición protegida
8. Si token es válido, permite acceso
9. Si token es inválido/expirado, retorna 401
```

**Ventajas:**
- Sin estado (stateless): No necesita sesiones en servidor
- Escalable: Funciona con múltiples servidores
- Seguro: Token firmado, no se puede falsificar

### Middleware de Autenticación (`middleware/auth.ts`)

```typescript
1. Extrae token del header Authorization
2. Verifica firma del token con JWT_SECRET
3. Si es válido, extrae userId y username
4. Los agrega a req.userId y req.username
5. Permite continuar (next())
6. Si es inválido, retorna 401 Unauthorized
```

---

## 💾 Sistema de Base de Datos

### Arquitectura Multi-Database

El backend soporta **3 tipos de bases de datos** sin cambiar código:

1. **SQLite** (por defecto): Archivo local, perfecto para desarrollo
2. **MySQL**: Base de datos relacional popular
3. **PostgreSQL**: Base de datos relacional avanzada

### Cómo Funciona

**Configuración (`database/config.ts`):**
- Lee variable `DB_TYPE` del archivo `.env`
- Retorna configuración según el tipo

**Inicialización (`database/db.ts`):**
- Detecta tipo de base de datos
- Carga módulo correspondiente (lazy loading)
- Crea conexión
- Crea tablas si no existen
- Crea usuario admin por defecto

**Wrappers:**
- Cada tipo de BD tiene su implementación
- Todas exponen la misma API (prepare, get, all, run)
- El código de controladores funciona igual con cualquier BD

### Estructura de Tablas

#### `users`
```sql
- id (VARCHAR/UUID) PRIMARY KEY
- username (VARCHAR) UNIQUE
- password (VARCHAR) -- Hasheado con bcrypt
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `products`
```sql
- id (VARCHAR/UUID) PRIMARY KEY
- user_id (VARCHAR) FOREIGN KEY → users.id
- name (VARCHAR)
- description (TEXT)
- category (VARCHAR) -- Perfumes, Cremas, Maquillajes, Otros
- quantity (INTEGER) CHECK >= 0
- min_threshold (INTEGER) CHECK >= 0
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `inventory_exits`
```sql
- id (VARCHAR/UUID) PRIMARY KEY
- product_id (VARCHAR) FOREIGN KEY → products.id
- user_id (VARCHAR) FOREIGN KEY → users.id
- quantity (INTEGER) -- Cantidad descontada
- previous_quantity (INTEGER) -- Stock antes
- new_quantity (INTEGER) -- Stock después
- created_at (TIMESTAMP)
```

**Relaciones:**
- Un usuario tiene muchos productos (1:N)
- Un producto tiene muchas salidas (1:N)
- Foreign keys con CASCADE: Si eliminas usuario/producto, se eliminan relacionados

---

## ✅ Validación de Datos

### Zod Schema (`utils/validation.ts`)

**Product Schema:**
```typescript
- name: string, requerido, 1-255 caracteres
- description: string, opcional, máximo 1000 caracteres
- category: enum ["Perfumes", "Cremas", "Maquillajes", "Otros"]
- quantity: number, entero, >= 0
- minThreshold: number, entero, >= 0
```

**Ventajas:**
- Validación automática
- Mensajes de error claros
- Type-safe (TypeScript infiere tipos)

**Ejemplo de Error:**
```json
{
  "error": "Validation Error",
  "message": "Los datos proporcionados no son válidos",
  "details": {
    "name": "El nombre es requerido",
    "quantity": "La cantidad debe ser mayor o igual a 0"
  }
}
```

---

## 🛡️ Seguridad Implementada

### 1. Contraseñas Hasheadas
- Usa `bcryptjs` con 10 rounds
- Las contraseñas nunca se almacenan en texto plano
- Comparación segura con `bcrypt.compareSync()`

### 2. JWT Tokens
- Firmados con secreto (JWT_SECRET)
- Expiran después de 7 días (configurable)
- Verificación en cada petición protegida

### 3. Validación de Propiedad
- Cada usuario solo puede acceder a sus propios productos
- Verificación en cada operación: `WHERE user_id = ?`

### 4. CORS
- Configurado para permitir solo el frontend especificado
- Previene ataques desde otros dominios

### 5. Validación de Entrada
- Todos los datos se validan antes de procesar
- Previene inyección SQL (usando prepared statements)
- Previene datos malformados

---

## 🔄 Mapeo de Datos

### Problema
Las bases de datos usan `snake_case` (user_id, created_at) pero TypeScript usa `camelCase` (userId, createdAt).

### Solución (`utils/dbMapper.ts`)
Función que convierte automáticamente:
```typescript
// De base de datos
{ user_id: "123", created_at: "2024-01-01" }
// A TypeScript
{ userId: "123", createdAt: "2024-01-01" }
```

---

## 📝 Manejo de Errores

### Middleware Centralizado (`middleware/errorHandler.ts`)

**Tipos de Errores:**
1. **ValidationError**: Datos inválidos → 400 Bad Request
2. **Unauthorized**: Token inválido → 401 Unauthorized
3. **Not Found**: Recurso no existe → 404 Not Found
4. **Internal Server Error**: Error del servidor → 500

**Formato Estándar:**
```json
{
  "error": "Error Type",
  "message": "Descripción del error",
  "details": {} // Opcional
}
```

---

## 🚀 Cómo Usar el Backend

### 1. Instalación
```bash
npm install
```

### 2. Configuración
Crear archivo `.env`:
```env
DB_TYPE=sqlite
PORT=3001
JWT_SECRET=tu-secreto-super-seguro
```

### 3. Iniciar
```bash
npm run dev
```

### 4. Probar
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"fibiadmin","password":"fibi2026"}'

# Guardar el token recibido

# Listar productos
curl http://localhost:3001/api/products \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🎯 Características Destacadas

### ✅ Multi-Database Support
- Cambia de SQLite a MySQL/PostgreSQL solo cambiando `.env`
- Sin modificar código

### ✅ Type-Safe
- Todo escrito en TypeScript
- Autocompletado y detección de errores

### ✅ Validación Robusta
- Validación en cada endpoint
- Mensajes de error claros

### ✅ Seguridad
- JWT para autenticación
- Contraseñas hasheadas
- Validación de propiedad de recursos

### ✅ Auditoría
- Registro de todas las salidas de inventario
- Timestamps en todas las tablas

### ✅ Escalable
- Arquitectura modular
- Fácil agregar nuevas funcionalidades
- Preparado para producción

---

## 📊 Resumen de Funcionalidades

| Funcionalidad | Endpoint | Método | Autenticación |
|--------------|----------|--------|---------------|
| Login | `/api/auth/login` | POST | ❌ No |
| Listar productos | `/api/products` | GET | ✅ Sí |
| Buscar productos | `/api/products?search=...` | GET | ✅ Sí |
| Obtener producto | `/api/products/:id` | GET | ✅ Sí |
| Crear producto | `/api/products` | POST | ✅ Sí |
| Actualizar producto | `/api/products/:id` | PUT/PATCH | ✅ Sí |
| Eliminar producto | `/api/products/:id` | DELETE | ✅ Sí |
| Registrar salida | `/api/products/:id/exit` | POST | ✅ Sí |
| Estado BD | `/api/db/status` | GET | ❌ No |
| Health check | `/health` | GET | ❌ No |

---

## 🔮 Próximos Pasos Posibles

1. **Paginación**: Para listas grandes de productos
2. **Filtros avanzados**: Por categoría, stock bajo, etc.
3. **Historial completo**: Endpoint para ver todas las salidas
4. **Múltiples usuarios**: Ya está preparado (cada producto tiene user_id)
5. **Soft delete**: Eliminación lógica en lugar de física
6. **Backup automático**: Para bases de datos
7. **Rate limiting**: Limitar peticiones por IP
8. **Logging**: Sistema de logs más robusto

---

## 📚 Archivos de Documentación

- `README.md`: Guía rápida de uso
- `CONFIGURAR_BASE_DATOS_LOCAL.md`: Cómo configurar MySQL/PostgreSQL
- `VERIFICAR_BASE_DATOS.md`: Cómo verificar conexión
- `BACKEND_SPECIFICATION.md`: Especificación original del frontend
- `EXPLICACION_DETALLADA_BACKEND.md`: Este documento

---

## 💡 Conceptos Clave

### REST API
- Arquitectura de comunicación cliente-servidor
- Usa métodos HTTP (GET, POST, PUT, DELETE)
- Respuestas en formato JSON

### Middleware
- Funciones que se ejecutan antes de llegar al controlador
- Útiles para autenticación, logging, validación

### Controller
- Contiene la lógica de negocio
- Procesa requests y genera responses

### Route
- Define qué URL maneja qué controlador
- Asocia métodos HTTP con funciones

### Model
- Representa estructura de datos
- En este caso, las tablas de la base de datos

---

## 🎓 ¿Por qué esta Arquitectura?

### Separación de Responsabilidades
- **Routes**: Solo definen URLs
- **Controllers**: Lógica de negocio
- **Database**: Acceso a datos
- **Middleware**: Funciones transversales

### Ventajas
- **Mantenible**: Fácil encontrar y modificar código
- **Testeable**: Cada parte se puede probar independientemente
- **Escalable**: Fácil agregar nuevas funcionalidades
- **Reutilizable**: Middleware y utilidades se reutilizan

---

## 🐛 Debugging

### Ver Logs
El servidor muestra en consola:
- Peticiones recibidas
- Errores
- Estado de base de datos

### Endpoint de Estado
`GET /api/db/status` muestra:
- Si la BD está conectada
- Cantidad de usuarios y productos
- Tipo de base de datos

### Errores Comunes
1. **Token inválido**: Verificar que el token se envía correctamente
2. **Base de datos no conectada**: Verificar variables de entorno
3. **Validación falla**: Revisar formato de datos enviados

---

## ✅ Checklist de Funcionalidades Implementadas

- [x] Autenticación JWT
- [x] CRUD completo de productos
- [x] Búsqueda de productos
- [x] Registro de salidas de inventario
- [x] Validación de datos
- [x] Manejo de errores
- [x] Soporte multi-database
- [x] CORS configurado
- [x] Historial de movimientos
- [x] Usuario admin por defecto
- [x] Endpoints de verificación
- [x] Documentación completa

---

**¡El backend está completo y listo para usar!** 🎉

