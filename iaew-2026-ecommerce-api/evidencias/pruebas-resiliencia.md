# Evidencias de Pruebas: Resiliencia de Integraciones (Clase 05)

**Materia:** Integración de Aplicaciones en Entorno Web (IAEW) — UTN FRC  
**Estudiante:** Martín Sciarra  
**Fecha:** 17 de Septiembre de 2026  
**Entorno:** Node.js v24.14.0, MongoDB v7.0, RabbitMQ 3.13 (Docker / CloudAMQP)  

---

## 📋 1. Resumen de Pruebas Ejecutadas

| ID | Prueba | Endpoint / Componente | Header / Condición | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **P1** | Primera confirmación | `POST /pedidos/:id/confirmar` | `Idempotency-Key: pedido-001` | HTTP 200, `Idempotency-Replayed: false`, stock -2 | ✅ OK |
| **P2** | Replay con misma clave | `POST /pedidos/:id/confirmar` | `Idempotency-Key: pedido-001` | HTTP 200, `Idempotency-Replayed: true`, mismo `eventId`, stock intacto | ✅ OK |
| **P3A**| Conflicto de clave | `POST /pedidos/:id/confirmar` | `Idempotency-Key: pedido-001-otra` | HTTP 409 `IDEMPOTENCY_KEY_MISMATCH` | ✅ OK |
| **P3B**| Reúso de clave en otro pedido | `POST /pedidos/:otroId/confirmar` | `Idempotency-Key: pedido-001` | HTTP 409 `IDEMPOTENCY_KEY_REUSED` | ✅ OK |
| **P4** | Retry por falla transitoria | Worker RabbitMQ | `SIMULATE_TRANSIENT_FAILURES=2` | Logs: Reintento 1/3, Reintento 2/3, éxito en 3er intento | ✅ OK |
| **P5** | Reintentos agotados $\rightarrow$ DLQ | Worker RabbitMQ | `SIMULATE_TRANSIENT_FAILURES=4` | Agota 3/3, publica en `notificaciones.pedido-confirmado.dlq` | ✅ OK |
| **P6** | Evento duplicado | Worker RabbitMQ | Reenvío manual de mismo `eventId` | Log: "Duplicado reconocido", ack sin re-procesar | ✅ OK |

---

## 🧪 2. Detalle de Evidencias

### Prueba 1: Primera Confirmación (Idempotency-Replayed: false)
**Petición HTTP:**
```http
POST /pedidos/66e8fa1b2c4e8a1234567890/confirmar HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJSUzI1Ni...
Idempotency-Key: pedido-66e8fa1b-v1
```

**Respuesta HTTP:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Idempotency-Replayed: false

{
  "pedido": {
    "_id": "66e8fa1b2c4e8a1234567890",
    "cliente": {
      "nombre": "Estudiante Demo",
      "email": "demo@example.test"
    },
    "items": [
      {
        "productoId": "66e8f9902c4e8a1234567888",
        "nombre": "Teclado laboratorio",
        "cantidad": 2,
        "precioUnitario": 25000
      }
    ],
    "total": 50000,
    "estado": "confirmado",
    "confirmadoEn": "2026-09-17T16:35:10.120Z",
    "notificacionEstado": "pendiente",
    "confirmacionIdempotencyKey": "pedido-66e8fa1b-v1"
  },
  "evento": {
    "eventId": "b3e6c491-3a05-4f32-8419-4a92c4f80872",
    "type": "pedido.confirmado",
    "version": 1,
    "occurredAt": "2026-09-17T16:35:10.120Z",
    "data": {
      "pedidoId": "66e8fa1b2c4e8a1234567890"
    }
  },
  "idempotencia": {
    "key": "pedido-66e8fa1b-v1",
    "replayed": false
  }
}
```

**Log del Worker:**
```text
Worker escuchando mensajes en la cola: notificaciones.pedido-confirmado...
Notificación procesada para pedido 66e8fa1b2c4e8a1234567890; evento b3e6c491-3a05-4f32-8419-4a92c4f80872
```

---

### Prueba 2: Replay con la misma clave (Idempotency-Replayed: true)
**Petición HTTP (Reintento con misma clave):**
```http
POST /pedidos/66e8fa1b2c4e8a1234567890/confirmar HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJSUzI1Ni...
Idempotency-Key: pedido-66e8fa1b-v1
```

**Respuesta HTTP:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Idempotency-Replayed: true

{
  "pedido": {
    "_id": "66e8fa1b2c4e8a1234567890",
    "estado": "confirmado",
    "confirmadoEn": "2026-09-17T16:35:10.120Z",
    "notificacionEstado": "procesada",
    "confirmacionIdempotencyKey": "pedido-66e8fa1b-v1"
  },
  "evento": {
    "eventId": "b3e6c491-3a05-4f32-8419-4a92c4f80872",
    "type": "pedido.confirmado",
    "version": 1,
    "occurredAt": "2026-09-17T16:35:10.120Z",
    "data": {
      "pedidoId": "66e8fa1b2c4e8a1234567890"
    }
  },
  "idempotencia": {
    "key": "pedido-66e8fa1b-v1",
    "replayed": true
  }
}
```

**Evidencia de Stock en MongoDB:**
* Stock Inicial del Producto (`Teclado laboratorio`): **10 unidades**
* Stock tras Prueba 1 (Primera confirmación): **8 unidades** (descontó 2)
* Stock tras Prueba 2 (Replay): **8 unidades** (**NO volvió a descontar**)
* En RabbitMQ **NO se emitió un segundo evento**; se devolvió el `eventId` original.

---

### Prueba 3: Conflictos de Idempotencia (HTTP 409)

#### Caso A: Mismo pedido confirmado con OTRA clave (`IDEMPOTENCY_KEY_MISMATCH`)
```http
POST /pedidos/66e8fa1b2c4e8a1234567890/confirmar HTTP/1.1
Idempotency-Key: pedido-66e8fa1b-v2-OTRA-CLAVE

HTTP/1.1 409 Conflict
{
  "error": "El pedido ya fue confirmado con otra clave",
  "code": "IDEMPOTENCY_KEY_MISMATCH",
  "retryable": false,
  "action": "Consultar el pedido y no generar una nueva confirmación"
}
```

#### Caso B: Misma clave usada en OTRO pedido (`IDEMPOTENCY_KEY_REUSED`)
```http
POST /pedidos/66e8ff999999999999999999/confirmar HTTP/1.1
Idempotency-Key: pedido-66e8fa1b-v1

HTTP/1.1 409 Conflict
{
  "error": "La clave de idempotencia ya fue usada en otro pedido",
  "code": "IDEMPOTENCY_KEY_REUSED",
  "retryable": false,
  "action": "Usar una clave distinta por operación"
}
```

---

### Prueba 4: Retry por Falla Transitoria en Worker
* **Configuración:** `SIMULATE_TRANSIENT_FAILURES=2`, `MAX_RETRIES=3`, `RETRY_DELAY_MS=3000`.

**Logs del Worker:**
```text
Worker escuchando mensajes en la cola: notificaciones.pedido-confirmado...
Reintento 1/3: Falla transitoria simulada 1/2
[RabbitMQ: mensaje encolado en 'notificaciones.pedido-confirmado.retry' con TTL 3000ms]
Reintento 2/3: Falla transitoria simulada 2/2
[RabbitMQ: mensaje encolado en 'notificaciones.pedido-confirmado.retry' con TTL 3000ms]
Notificación procesada para pedido 66e901a12c4e8a9999999999; evento c4f7d582-4b16-4a43-9520-5b03d5e91983
```
* **Comportamiento:** El worker no bloqueó la cola principal ni usó `nack(requeue=true)`. Publicó en la cola de retry con header `x-retry-count: 1` y `2`. Al vencer el TTL de 3 segundos, RabbitMQ devolvió el mensaje a la cola principal por dead-letter routing, completando exitosamente al tercer intento.

---

### Prueba 5: Reintentos Agotados $\rightarrow$ Dead Letter Queue (DLQ)
* **Configuración:** `SIMULATE_TRANSIENT_FAILURES=4`, `MAX_RETRIES=3`.

**Logs del Worker:**
```text
Worker escuchando mensajes en la cola: notificaciones.pedido-confirmado...
Reintento 1/3: Falla transitoria simulada 1/4
Reintento 2/3: Falla transitoria simulada 2/4
Reintento 3/3: Falla transitoria simulada 3/4
Enviando a DLQ — reintentos agotados (3/3): Falla transitoria simulada 4/4
```

**Inspección en RabbitMQ Management Console (`http://localhost:15672`):**
* **Queue:** `notificaciones.pedido-confirmado.dlq`
* **Messages Ready:** `1`
* **Headers del Mensaje en DLQ:**
  * `x-retry-count`: `3`
  * `x-dlq-reason`: `"reintentos agotados (3/3): Falla transitoria simulada 4/4"`
  * Payload íntegro conservado sin pérdida de información.

---

### Prueba 6: Deduplicación por `eventId`
Se republicó manualmente el mensaje anterior desde la consola de RabbitMQ con routing key `pedido.confirmado`.

**Logs del Worker:**
```text
Duplicado reconocido: evento c4f7d582-4b16-4a43-9520-5b03d5e91983
```
* **Efecto:** El worker detectó que `EventoProcesado.exists({ eventId })` era verdadero, ejecutó `activeChannel.ack(message)` de inmediato y **no repitió el efecto en MongoDB**.

---

## 🤖 3. Pregunta Teórica: ¿Qué debe consultar un agente de IA antes de reintentar un HTTP 503?

> [!IMPORTANT]
> Ante una respuesta **HTTP 503 Service Unavailable** (por ejemplo: *"El pedido quedó confirmado, pero no se pudo publicar la notificación"*), un agente de IA autónomo **NUNCA debe generar una nueva clave de idempotencia ni asumir ciegamente que la operación falló**.
>
> **Protocolo obligatorio que debe seguir el agente:**
> 1. **Consultar primero el estado del recurso (`GET /pedidos/:id`):** Debe verificar si el pedido ya transitó a estado `confirmado`.
> 2. **Si el estado es desconocido o requiere reintento:** Debe **conservar exactamente la misma `Idempotency-Key`** que utilizó en la primera llamada.
> 3. **Aplicar Exponential Backoff con Jitter:** No bombardear inmediatamente el endpoint; esperar un tiempo prudencial que crezca exponencialmente con una variación aleatoria.
> 4. **Respetar el flag `retryable` y `action` de la respuesta:** Si `retryable: false`, abstenerse de insistir y escalar a intervención humana.
> 5. **Límite estricto de intentos (`max_retries`):** Cortar la ejecución si supera el umbral para no amplificar una caída en cascada (*thundering herd*).

---

## 📐 4. Ficha de Resiliencia para el TPI

| Campo | Decisión de Arquitectura |
| :--- | :--- |
| **Operación Crítica** | Confirmación y cobro de pedidos / reserva de insumos en el TPI. |
| **Identidad de Intención** | Header `Idempotency-Key: <uuid-v4>` generado por el cliente frontend antes del POST. |
| **Identidad del Hecho** | `eventId: <uuid-v4>` inmutable generado por el backend al momento del commit en base de datos. |
| **Política de Retry** | Backoff con TTL en RabbitMQ (`3000 ms`), límite estricto de **3 reintentos** (`MAX_RETRIES=3`). |
| **Gestión de DLQ** | Exchange `pedidos.dlx` hacia cola `notificaciones.pedido-confirmado.dlq`. Monitoreo mediante métricas Prometheus/Grafana y alertas a canal DevOps cuando messages > 0. |
| **Mecanismo de Deduplicación** | Colección `EventoProcesado` con índice único sobre `eventId`. Verificación y reserva previa al efecto. |
| **Ventana de Inconsistencia Aceptada** | Desacoplamiento entre la persistencia en MongoDB y la confirmación en RabbitMQ. Se mitiga mediante replay idempotente (el cliente puede reintentar con misma clave y el servidor re-publica el evento sin re-descontar stock) y evolución hacia patrón Outbox transaccional. |
