# Especificación Técnica - Backend API
## Sistema de Gestión de Inventario - Variedades Fibia

### Descripción General

Este documento describe las especificaciones técnicas del frontend para que el desarrollador de backend pueda implementar la API REST que conectará la aplicación web con la base de datos. El sistema es una aplicación de gestión de inventario para productos de perfumería, cremas y maquillajes, desarrollada en **Next.js 16** con **React 19** y **TypeScript**.

### Estado Actual del Frontend

Actualmente, el frontend utiliza **localStorage** para persistir datos localmente en el navegador. El objetivo es reemplazar esta implementación con llamadas a una API REST que se conecte a una base de datos real.

---

## Estructura de Datos

### Modelo: Product

El sistema maneja un único modelo principal de datos: **Product**.

```typescript
interface Product {
  id: string              // Identificador único del producto
  name: string           // Nombre del producto (requerido)
  description: string     // Descripción del producto (opcional)
  category: string       // Categoría del producto (requerido)
  quantity: number        // Cantidad actual en stock (requerido, >= 0)
  minThreshold: number   // Stock mínimo permitido (requerido, >= 0)
}
```

#### Categorías de Productos

Las categorías válidas son:
- `"Perfumes"`
- `"Cremas"`
- `"Maquillajes"`
- `"Otros"`

Estas categorías están definidas como constantes en el frontend y deben ser validadas en el backend.

---

## Funcionalidades del Sistema

### 1. Autenticación

**Estado actual:** El frontend implementa una autenticación simple con credenciales hardcodeadas:
- Usuario: `admin`
- Contraseña: `fibia2024`

**Requisitos para el backend:**
- Endpoint de login que valide credenciales
- Generación y retorno de token de autenticación (JWT recomendado)
- Validación de token en endpoints protegidos
- El frontend almacenará el token en localStorage y lo enviará en el header `Authorization` de las peticiones

**Flujo esperado:**
1. Usuario ingresa credenciales
2. Frontend envía POST a `/api/auth/login` con `{ username, password }`
3. Backend valida y retorna `{ token, user }` o error
4. Frontend guarda token y lo usa en peticiones subsecuentes

---

### 2. Gestión de Productos

#### 2.1. Listar Productos

**Endpoint requerido:** `GET /api/products`

**Respuesta esperada:**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "quantity": 0,
      "minThreshold": 0
    }
  ],
  "total": 0,
  "lowStockCount": 0  // Cantidad de productos con quantity <= minThreshold
}
```

**Características:**
- Debe retornar todos los productos del usuario autenticado
- Incluir conteo de productos con stock bajo (quantity <= minThreshold)
- Ordenar por nombre (alfabético) por defecto

#### 2.2. Buscar Productos

**Endpoint requerido:** `GET /api/products?search={query}`

**Parámetros:**
- `search` (query string, opcional): Término de búsqueda para filtrar por nombre

**Respuesta esperada:**
```json
{
  "products": [...],
  "total": 0
}
```

**Características:**
- Búsqueda case-insensitive
- Filtrar productos cuyo nombre contenga el término de búsqueda
- Usado en el diálogo de "Registrar Salida" para buscar productos

#### 2.3. Obtener Producto por ID

**Endpoint requerido:** `GET /api/products/:id`

**Respuesta esperada:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "quantity": 0,
  "minThreshold": 0
}
```

**Errores:**
- `404 Not Found` si el producto no existe o no pertenece al usuario

#### 2.4. Crear Producto

**Endpoint requerido:** `POST /api/products`

**Body:**
```json
{
  "name": "string",           // Requerido
  "description": "string",    // Opcional (puede ser vacío)
  "category": "string",       // Requerido, debe ser una de las categorías válidas
  "quantity": 0,              // Requerido, >= 0
  "minThreshold": 0           // Requerido, >= 0
}
```

**Respuesta esperada:**
```json
{
  "id": "string",             // ID generado por el backend
  "name": "string",
  "description": "string",
  "category": "string",
  "quantity": 0,
  "minThreshold": 0,
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Validaciones requeridas:**
- `name`: Requerido, no vacío, máximo 255 caracteres
- `description`: Opcional, máximo 1000 caracteres
- `category`: Requerido, debe ser una de: "Perfumes", "Cremas", "Maquillajes", "Otros"
- `quantity`: Requerido, número entero >= 0
- `minThreshold`: Requerido, número entero >= 0

**Errores:**
- `400 Bad Request` con detalles de validación
- `401 Unauthorized` si no hay token válido

#### 2.5. Actualizar Producto

**Endpoint requerido:** `PUT /api/products/:id` o `PATCH /api/products/:id`

**Body:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "quantity": 0,
  "minThreshold": 0
}
```

**Respuesta esperada:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "quantity": 0,
  "minThreshold": 0,
  "updatedAt": "ISO 8601 datetime"
}
```

**Validaciones:**
- Mismas validaciones que en creación
- Verificar que el producto existe y pertenece al usuario

**Errores:**
- `404 Not Found` si el producto no existe
- `400 Bad Request` si hay errores de validación
- `401 Unauthorized` si no hay token válido

#### 2.6. Eliminar Producto

**Endpoint requerido:** `DELETE /api/products/:id`

**Respuesta esperada:**
```json
{
  "message": "Producto eliminado correctamente"
}
```

**Errores:**
- `404 Not Found` si el producto no existe
- `401 Unauthorized` si no hay token válido

---

### 3. Registro de Salidas de Inventario

**Endpoint requerido:** `POST /api/products/:id/exit` o `POST /api/inventory/exits`

**Body:**
```json
{
  "productId": "string",  // ID del producto
  "quantity": 0           // Cantidad a descontar (requerido, > 0)
}
```

**Respuesta esperada:**
```json
{
  "product": {
    "id": "string",
    "name": "string",
    "quantity": 0,        // Nueva cantidad después del descuento
    "minThreshold": 0
  },
  "exitQuantity": 0,
  "newQuantity": 0,
  "isLowStock": false,    // true si quantity <= minThreshold después del descuento
  "timestamp": "ISO 8601 datetime"
}
```

**Validaciones requeridas:**
- `quantity`: Debe ser > 0
- `quantity`: No puede ser mayor que la cantidad actual del producto
- El producto debe existir y pertenecer al usuario

**Lógica de negocio:**
1. Verificar que el producto existe
2. Verificar que hay suficiente stock (quantity actual >= cantidad a descontar)
3. Descontar la cantidad del stock del producto
4. Actualizar el campo `quantity` del producto
5. Retornar el producto actualizado con la nueva cantidad
6. Indicar si el producto quedó en stock bajo (quantity <= minThreshold)

**Errores:**
- `400 Bad Request`: Si la cantidad es inválida o insuficiente
- `404 Not Found`: Si el producto no existe
- `401 Unauthorized`: Si no hay token válido

**Consideraciones:**
- El frontend muestra una alerta si después del descuento el producto quedará en stock bajo
- Se recomienda registrar un historial de salidas para auditoría (opcional pero recomendado)

---

## Autenticación y Autorización

### Headers Requeridos

Todas las peticiones a endpoints protegidos deben incluir:

```
Authorization: Bearer {token}
```

### Endpoints Públicos
- `POST /api/auth/login`

### Endpoints Protegidos
- Todos los demás endpoints requieren autenticación

### Manejo de Errores de Autenticación

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Token inválido o expirado"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "No tienes permisos para realizar esta acción"
}
```

---

## Formato de Respuestas

### Respuestas Exitosas

**Códigos HTTP:**
- `200 OK`: Operación exitosa (GET, PUT, PATCH)
- `201 Created`: Recurso creado exitosamente (POST)
- `204 No Content`: Recurso eliminado exitosamente (DELETE)

### Respuestas de Error

**Formato estándar:**
```json
{
  "error": "Error Type",
  "message": "Descripción del error",
  "details": {}  // Opcional, detalles adicionales de validación
}
```

**Códigos HTTP de error:**
- `400 Bad Request`: Errores de validación o datos inválidos
- `401 Unauthorized`: No autenticado o token inválido
- `403 Forbidden`: No autorizado para la acción
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

**Ejemplo de error de validación:**
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

## Consideraciones Técnicas

### 1. CORS

El backend debe configurar CORS para permitir peticiones desde el frontend. El frontend se ejecutará típicamente en:
- Desarrollo: `http://localhost:3000`
- Producción: Dominio del cliente

### 2. Paginación (Opcional)

Para listados grandes de productos, considerar implementar paginación:
```
GET /api/products?page=1&limit=20
```

**Respuesta:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 3. Búsqueda Avanzada (Opcional)

Considerar expandir la búsqueda para incluir:
- Búsqueda por categoría
- Filtros por stock bajo
- Ordenamiento personalizado

### 4. Historial de Movimientos (Recomendado)

Para auditoría, considerar crear una tabla de historial que registre:
- Creación de productos
- Actualizaciones de productos
- Salidas de inventario
- Eliminaciones (soft delete recomendado)

### 5. Multi-tenancy

Si el sistema soportará múltiples usuarios/empresas, asegurar que:
- Cada producto esté asociado a un usuario/empresa
- Las consultas filtren por el usuario autenticado
- Los IDs de productos sean únicos por usuario o globalmente únicos

---

## Estructura de Base de Datos Sugerida

### Tabla: users
```sql
- id (PK, UUID o auto-increment)
- username (unique)
- password (hashed)
- email (opcional)
- created_at
- updated_at
```

### Tabla: products
```sql
- id (PK, UUID o auto-increment)
- user_id (FK a users) -- Si es multi-usuario
- name (VARCHAR, NOT NULL)
- description (TEXT, nullable)
- category (ENUM o VARCHAR, NOT NULL)
- quantity (INTEGER, NOT NULL, DEFAULT 0, CHECK >= 0)
- min_threshold (INTEGER, NOT NULL, DEFAULT 0, CHECK >= 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabla: inventory_exits (Opcional, para historial)
```sql
- id (PK)
- product_id (FK a products)
- user_id (FK a users)
- quantity (INTEGER, cantidad descontada)
- previous_quantity (INTEGER, cantidad antes del descuento)
- new_quantity (INTEGER, cantidad después del descuento)
- created_at (TIMESTAMP)
```

---

## Notas Adicionales

1. **IDs de Productos:** El frontend actualmente genera IDs usando `Date.now().toString()`. El backend debe generar IDs únicos (UUID recomendado o auto-increment).

2. **Timestamps:** El frontend no maneja timestamps actualmente, pero el backend debería incluir `createdAt` y `updatedAt` en las respuestas.

3. **Validación de Stock:** El frontend valida que no se pueda descontar más stock del disponible. El backend debe reforzar esta validación.

4. **Stock Bajo:** El frontend calcula productos con stock bajo comparando `quantity <= minThreshold`. El backend puede optimizar esto con índices o queries específicas.

5. **Responsive Design:** El frontend está optimizado para móviles y desktop. La API debe ser eficiente para ambos casos de uso.

---

## Contacto y Soporte

Para cualquier duda sobre la implementación del frontend o requerimientos adicionales, contactar al equipo de desarrollo frontend.

**Versión del documento:** 1.0  
**Fecha:** 2024  
**Framework Frontend:** Next.js 16, React 19, TypeScript
