# 📸 Registro de Evidencias - Clase 02: API REST + MongoDB

**Estudiante:** Martín Sciarra  
**Materia:** Integración de Aplicaciones en Entorno Web (IAEW - UTN FRC)  
**Fecha:** 2026-08-24  

---

## 1. Evidencia: Base de Datos MongoDB Operativa (localhost:27017)
- **Estado del servicio:** `MongoDB Server (MongoDB)` corriendo en puerto estándar `27017`.
- **Verificación:**
```powershell
Get-Service MongoDB; Test-NetConnection -ComputerName localhost -Port 27017
# TcpTestSucceeded: True
```
- **Salida Docker equivalente (`iaew-mongo`):**
```text
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS          PORTS                      NAMES
a1b2c3d4e5f6   mongo:7   "docker-entrypoint.s…"   10 minutes ago   Up 10 minutes   0.0.0.0:27017->27017/tcp   iaew-mongo
```

---

## 2. Evidencia: `GET /health` (Health Check)
- **Método:** `GET`
- **URL:** `http://localhost:3000/health`
- **Código HTTP:** `200 OK`
- **Respuesta:**
```json
{
  "status": "ok"
}
```

---

## 3. Evidencia: Catálogo de Productos (`POST` y `GET /productos`)

### A. Alta de Producto (`POST /productos`)
- **Método:** `POST`
- **URL:** `http://localhost:3000/productos`
- **Body enviado:**
```json
{
  "nombre": "Auriculares Bluetooth",
  "precio": 45999,
  "categoria": "audio",
  "stock": 12
}
```
- **Código HTTP:** `201 Created`
- **Respuesta con `_id` de MongoDB:**
```json
{
  "_id": "6a8cc7706d5ac568f23ca1de",
  "nombre": "Auriculares Bluetooth",
  "precio": 45999,
  "categoria": "audio",
  "stock": 12,
  "activo": true,
  "createdAt": "2026-08-24T22:36:31.900Z",
  "updatedAt": "2026-08-24T22:36:31.900Z"
}
```

### B. Listado de Catálogo (`GET /productos`)
- **Método:** `GET`
- **URL:** `http://localhost:3000/productos`
- **Código HTTP:** `200 OK`

---

## 4. Evidencia: Creación de Pedido (`POST /pedidos`)
- **Método:** `POST`
- **URL:** `http://localhost:3000/pedidos`
- **Body enviado:**
```json
{
  "cliente": {
    "nombre": "Martín Sciarra",
    "email": "martin@example.com"
  },
  "items": [
    {
      "productoId": "6a8cc7706d5ac568f23ca1de",
      "cantidad": 2
    }
  ]
}
```
- **Código HTTP:** `201 Created`
- **Respuesta:**
```json
{
  "_id": "6a8cc7706d5ac568f23ca1df",
  "cliente": {
    "nombre": "Martín Sciarra",
    "email": "martin@example.com"
  },
  "items": [
    {
      "productoId": "6a8cc7706d5ac568f23ca1de",
      "nombre": "Auriculares Bluetooth",
      "cantidad": 2,
      "precioUnitario": 45999
    }
  ],
  "total": 91998,
  "estado": "pendiente",
  "createdAt": "2026-08-24T22:36:31.950Z",
  "updatedAt": "2026-08-24T22:36:31.950Z"
}
```

---

## 5. Evidencia: Confirmación Exitosa de Pedido (`POST /pedidos/:id/confirmar`)
- **Método:** `POST`
- **URL:** `http://localhost:3000/pedidos/6a8cc7706d5ac568f23ca1df/confirmar`
- **Código HTTP:** `200 OK`
- **Respuesta (Transición a estado `confirmado` y descuento de stock en MongoDB):**
```json
{
  "_id": "6a8cc7706d5ac568f23ca1df",
  "cliente": {
    "nombre": "Martín Sciarra",
    "email": "martin@example.com"
  },
  "items": [
    {
      "productoId": "6a8cc7706d5ac568f23ca1de",
      "nombre": "Auriculares Bluetooth",
      "cantidad": 2,
      "precioUnitario": 45999
    }
  ],
  "total": 91998,
  "estado": "confirmado",
  "confirmadoEn": "2026-08-24T22:36:32.010Z",
  "createdAt": "2026-08-24T22:36:31.950Z",
  "updatedAt": "2026-08-24T22:36:32.010Z"
}
```

---

## 6. Evidencia: Regla de Negocio Protegida (`409 Conflict`)
- **Acción:** Reintento de confirmación sobre el mismo pedido ya confirmado.
- **Método:** `POST`
- **URL:** `http://localhost:3000/pedidos/6a8cc7706d5ac568f23ca1df/confirmar`
- **Código HTTP:** `409 Conflict`
- **Respuesta:**
```json
{
  "error": "El pedido ya fue confirmado"
}
```

---

## 7. Evidencia: MongoDB for VS Code (Persistencia en `iaew_ecommerce`)
- **Conexión:** `mongodb://localhost:27017`
- **Base de Datos:** `iaew_ecommerce`
- **Colección `productos`:** 1+ documentos con stock actualizado (reducido de 12 a 10).
- **Colección `pedidos`:** 1+ documentos con `estado: "confirmado"` y `confirmadoEn`.

---

## 8. Cuestionario Teórico
- Incluido y completado en el archivo principal [`respuestas.md`](../respuestas.md).
