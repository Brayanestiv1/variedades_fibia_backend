# Variedades Fibia - Backend API

Backend API REST para el Sistema de Gestión de Inventario de Variedades Fibia. Desarrollado con Node.js, Express, TypeScript. Soporta **SQLite**, **MySQL** y **PostgreSQL**.

## Características

- ✅ Autenticación JWT
- ✅ CRUD completo de productos
- ✅ Registro de salidas de inventario
- ✅ Validación de datos con Zod
- ✅ Base de datos SQLite
- ✅ Historial de movimientos de inventario
- ✅ CORS configurado
- ✅ Manejo de errores centralizado

## Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Conexión a internet (solo la primera vez para descargar archivos WASM de sql.js)

## Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd variedades_fibia_backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp env.example.txt .env
```

Editar el archivo `.env` y configurar las variables según sea necesario.

**Para SQLite (por defecto):**
```env
DB_TYPE=sqlite
DATABASE_PATH=./database.sqlite
```

**Para MySQL:**
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=variedades_fibia
```

**Para PostgreSQL:**
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=variedades_fibia
```

📖 **Ver documentación completa:** [CONFIGURAR_BASE_DATOS_LOCAL.md](./CONFIGURAR_BASE_DATOS_LOCAL.md)

4. Inicializar la base de datos:
```bash
npm run migrate
```

O simplemente iniciar el servidor (la base de datos se inicializa automáticamente):
```bash
npm run dev
```

## Uso

### Desarrollo
```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3001` (o el puerto configurado en `.env`).

### Producción
```bash
npm run build
npm start
```

## Credenciales por Defecto

Al inicializar la base de datos, se crea automáticamente un usuario administrador:

- **Usuario:** `fibiadmin`
- **Contraseña:** `fibi2026`

⚠️ **Importante:** Cambiar estas credenciales en producción.

## Endpoints de la API

### Autenticación

#### POST `/api/auth/login`
Iniciar sesión y obtener token JWT.

**Body:**
```json
{
  "username": "fibiadmin",
  "password": "fibi2026"
}
```

**Respuesta:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "admin"
  }
}
```

### Productos

#### GET `/api/products`
Obtener todos los productos del usuario autenticado.

**Query Parameters:**
- `search` (opcional): Filtrar productos por nombre

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "products": [...],
  "total": 10,
  "lowStockCount": 2
}
```

#### GET `/api/products/:id`
Obtener un producto por ID.

**Headers:**
```
Authorization: Bearer {token}
```

#### POST `/api/products`
Crear un nuevo producto.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Perfume X",
  "description": "Descripción del producto",
  "category": "Perfumes",
  "quantity": 50,
  "minThreshold": 10
}
```

**Categorías válidas:** `Perfumes`, `Cremas`, `Maquillajes`, `Otros`

#### PUT/PATCH `/api/products/:id`
Actualizar un producto existente.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:** (mismo formato que POST)

#### DELETE `/api/products/:id`
Eliminar un producto.

**Headers:**
```
Authorization: Bearer {token}
```

### Inventario

#### POST `/api/products/:id/exit`
Registrar una salida de inventario.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "quantity": 5
}
```

**Respuesta:**
```json
{
  "product": {
    "id": "product-id",
    "name": "Product Name",
    "quantity": 45,
    "minThreshold": 10
  },
  "exitQuantity": 5,
  "newQuantity": 45,
  "isLowStock": false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Estructura del Proyecto

```
variedades_fibia_backend/
├── src/
│   ├── controllers/      # Controladores de la API
│   ├── database/         # Configuración de base de datos
│   ├── middleware/       # Middlewares (auth, error handling)
│   ├── routes/           # Rutas de la API
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Utilidades (validación)
│   └── server.ts         # Punto de entrada
├── .env.example          # Ejemplo de variables de entorno
├── package.json
├── tsconfig.json
└── README.md
```

## Base de Datos

El proyecto utiliza SQLite como base de datos. La base de datos se crea automáticamente al iniciar el servidor.

### Tablas

- **users**: Usuarios del sistema
- **products**: Productos del inventario
- **inventory_exits**: Historial de salidas de inventario

## Validaciones

- **Nombre:** Requerido, máximo 255 caracteres
- **Descripción:** Opcional, máximo 1000 caracteres
- **Categoría:** Debe ser una de: Perfumes, Cremas, Maquillajes, Otros
- **Cantidad:** Entero >= 0
- **Umbral mínimo:** Entero >= 0

## Manejo de Errores

La API retorna errores en el siguiente formato:

```json
{
  "error": "Error Type",
  "message": "Descripción del error",
  "details": {}
}
```

### Códigos HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado
- `204 No Content`: Recurso eliminado
- `400 Bad Request`: Error de validación
- `401 Unauthorized`: No autenticado o token inválido
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

## Seguridad

- Las contraseñas se almacenan hasheadas con bcrypt
- Autenticación mediante JWT
- Validación de datos en todos los endpoints
- Verificación de propiedad de recursos (cada usuario solo accede a sus productos)

## Desarrollo

### Scripts Disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo con hot-reload
- `npm run build`: Compila TypeScript a JavaScript
- `npm start`: Inicia el servidor en modo producción
- `npm run migrate`: Inicializa la base de datos

## Licencia

ISC
