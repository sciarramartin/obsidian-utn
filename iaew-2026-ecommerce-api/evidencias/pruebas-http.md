# 🛡️ Evidencias de Seguridad y Casos de Prueba HTTP - Clase 03

**Estudiante:** Martín Sciarra  
**Materia:** Integración de Aplicaciones en Entorno Web (IAEW - UTN FRC)  
**Fecha:** 2026-08-31  

---

## 📊 Matriz de Casos de Prueba Ejecutados

| # | Caso de Prueba | Método | Endpoint | Headers | Body / Parámetros | Código Esperado | Código Obtenido | Estado |
| :-: | :--- | :-: | :--- | :--- | :--- | :-: | :-: | :-: |
| **1** | Health Check (Público) | `GET` | `/health` | Ninguno | Ninguno | `200 OK` | `200 OK` | ✅ Pasa |
| **2** | Catálogo de Productos (Público) | `GET` | `/productos` | Ninguno | Ninguno | `200 OK` | `200 OK` | ✅ Pasa |
| **3** | Crear Producto sin Headers | `POST` | `/productos` | Ninguno | `{ "nombre": "Teclado", "precio": 69999, ... }` | `401 Unauthorized` | `401 Unauthorized` | ✅ Pasa |
| **4** | Crear Producto con Rol Cliente | `POST` | `/productos` | `x-api-key: clave-interna-demo`<br>`Authorization: Bearer cliente-demo` | `{ "nombre": "Teclado", "precio": 69999, ... }` | `403 Forbidden` | `403 Forbidden` | ✅ Pasa |
| **5** | Crear Producto con Rol Admin | `POST` | `/productos` | `x-api-key: clave-interna-demo`<br>`Authorization: Bearer admin-demo` | `{ "nombre": "Teclado", "precio": 69999, ... }` | `201 Created` | `201 Created` | ✅ Pasa |
| **6** | Endpoint Identidad / Depuración | `GET` | `/me` | `Authorization: Bearer cliente-demo` | Ninguno | `200 OK` | `200 OK` | ✅ Pasa |
| **7** | Crear Pedido sin Token | `POST` | `/pedidos` | Ninguno | `{ "cliente": { ... }, "items": [ ... ] }` | `401 Unauthorized` | `401 Unauthorized` | ✅ Pasa |
| **8** | Crear Pedido con Rol Cliente | `POST` | `/pedidos` | `Authorization: Bearer cliente-demo` | `{ "cliente": { ... }, "items": [ ... ] }` | `201 Created` | `201 Created` | ✅ Pasa |
| **9** | Confirmar Pedido (1ra vez) | `POST` | `/pedidos/:id/confirmar` | `Authorization: Bearer cliente-demo` | Ninguno | `200 OK` | `200 OK` | ✅ Pasa |
| **10**| Confirmar Pedido Repetido | `POST` | `/pedidos/:id/confirmar` | `Authorization: Bearer cliente-demo` | Ninguno | `409 Conflict` | `409 Conflict` | ✅ Pasa |

---

## 📋 Detalle de Peticiones y Respuestas

### 1. `GET /health` (Público)
- **Request:** `GET http://localhost:3000/health`
- **Status:** `200 OK`
- **Response:**
```json
{
  "status": "ok"
}
```

### 2. `GET /productos` (Público)
- **Request:** `GET http://localhost:3000/productos`
- **Status:** `200 OK`

### 3. `POST /productos` (Sin headers de seguridad)
- **Request:** `POST http://localhost:3000/productos`
- **Status:** `401 Unauthorized`
- **Response:**
```json
{
  "error": "API key inválida o ausente"
}
```

### 4. `POST /productos` (Con API Key pero Token con Rol `cliente`)
- **Request:** `POST http://localhost:3000/productos`
- **Headers:** `x-api-key: clave-interna-demo`, `Authorization: Bearer cliente-demo`
- **Status:** `403 Forbidden`
- **Response:**
```json
{
  "error": "Permisos insuficientes"
}
```

### 5. `POST /productos` (Con API Key y Token con Rol `admin`)
- **Request:** `POST http://localhost:3000/productos`
- **Headers:** `x-api-key: clave-interna-demo`, `Authorization: Bearer admin-demo`
- **Status:** `201 Created`
- **Response:**
```json
{
  "_id": "6a961bc37fd904dec9e6e286",
  "nombre": "Teclado mecánico",
  "precio": 69999,
  "categoria": "periféricos",
  "stock": 8,
  "activo": true,
  "createdAt": "2026-08-31T21:26:43.000Z",
  "updatedAt": "2026-08-31T21:26:43.000Z"
}
```

### 6. `GET /me` (Identidad / Depuración)
- **Request:** `GET http://localhost:3000/me`
- **Headers:** `Authorization: Bearer cliente-demo`
- **Status:** `200 OK`
- **Response:**
```json
{
  "user": {
    "id": "usr-1",
    "nombre": "Cliente Demo",
    "rol": "cliente"
  }
}
```

### 7. `POST /pedidos` (Sin Token de autenticación)
- **Request:** `POST http://localhost:3000/pedidos`
- **Status:** `401 Unauthorized`
- **Response:**
```json
{
  "error": "Token ausente"
}
```

### 8. `POST /pedidos` (Con Token de Rol `cliente`)
- **Request:** `POST http://localhost:3000/pedidos`
- **Headers:** `Authorization: Bearer cliente-demo`
- **Status:** `201 Created`
- **Response:**
```json
{
  "_id": "6a961bc37fd904dec9e6e287",
  "cliente": {
    "nombre": "Ana Pérez",
    "email": "ana@example.com"
  },
  "items": [
    {
      "productoId": "6a961bc37fd904dec9e6e286",
      "nombre": "Teclado mecánico",
      "cantidad": 1,
      "precioUnitario": 69999
    }
  ],
  "total": 69999,
  "estado": "pendiente",
  "createdAt": "2026-08-31T21:26:43.050Z",
  "updatedAt": "2026-08-31T21:26:43.050Z"
}
```

### 9. `POST /pedidos/:id/confirmar` (Reintento / Doble confirmación)
- **Request:** `POST http://localhost:3000/pedidos/6a961bc37fd904dec9e6e287/confirmar`
- **Headers:** `Authorization: Bearer cliente-demo`
- **Status:** `409 Conflict`
- **Response:**
```json
{
  "error": "El pedido ya fue confirmado"
}
```

---

## 🧠 Paso 7 - Reflexión Teórica: Agentes de IA, Autorización y Seguridad

**¿Qué endpoints de mi API podrían ser peligrosos si los ejecuta un agente de IA sin autorización suficiente?**

Si dejamos que un agente de IA interactúe con la API sin un control estricto de permisos, podemos tener problemas graves tanto en lecturas como en escrituras:

* **En lecturas sensibles:** Si el agente accede sin restricciones a listar pedidos (`GET /pedidos`), podría leer y filtrar información privada de los usuarios como nombres, correos electrónicos y montos de compra.
* **En escrituras críticas:** En endpoints como `POST /productos` (modificación de catálogo/precios) o `POST /pedidos/:id/confirmar` (confirmación de compra y descuento de inventario), una IA descontrolada podría alterar el stock físico o confirmar órdenes no deseadas.
* **Roles necesarios:** Las acciones de catálogo deben estar estrictamente limitadas al rol **`admin`** junto con la API key interna, mientras que las compras deben pertenecer al rol **`cliente`** dueño de la sesión.
* **Auditoría recomendada:** Para monitorear a la IA, es clave registrar un log de auditoría (*audit trail*) que guarde la fecha y hora, el identificador del usuario/agente, la IP, el endpoint invocado y si la operación fue aprobada o rechazada.

