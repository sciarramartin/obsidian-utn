# Instructivo Paso a Paso: Laboratorio Clase 05 — Resiliencia de Integraciones

**Rama:** [[Hub_IAEW|IAEW]]  
**Tags:** #materia/iaew #instructivo #resiliencia #idempotencia #rabbitmq #mongodb #dlq #postman #laboratorio  
**Fecha:** 2026-09-17  
**Destinatario:** Guía de estudio y réplica práctica para compañeros de cursada  

---

## 👋 ¿De qué se trata esta clase?

En esta clase trabajamos sobre la API de **E-commerce** para resolver un problema típico de sistemas distribuidos: **la red falla o es ambigua**. 
Si un cliente manda a pagar o confirmar un pedido y se le corta el WiFi, no sabe si la orden se procesó o no. Si reintenta a ciegas, puede cobrarle dos veces o descontar stock duplicado.

Para solucionar esto implementamos:
1. **Idempotencia en HTTP:** Con el header `Idempotency-Key` para que el cliente pueda reintentar de forma segura sin duplicar nada.
2. **Resiliencia en Mensajería (RabbitMQ):** Topología de reintentos con tiempo de espera (TTL de 3s) y descarte a una **Dead Letter Queue (DLQ)** ante fallas persistentes, evitando colgar la CPU con bucles infinitos.

---

## 🛠️ Requisitos Previos

Antes de arrancar necesitás tener:
1. **Node.js** instalado (v18 o superior).
2. **MongoDB** corriendo (local en `localhost:27017` o una URI de Mongo Atlas).
3. **RabbitMQ o CloudAMQP:** Si no tenés RabbitMQ instalado en tu máquina, create una cuenta gratis en [CloudAMQP](https://www.cloudamqp.com/), creá una instancia gratis (*Little Lemur*) y copiate la **AMQP URL** (empieza con `amqps://...`).
4. **Postman** para enviar las peticiones HTTP y sacar las capturas.

---

## 🚀 Paso 0: Configurar el Proyecto

1. Abrí la carpeta del proyecto `iaew-2026-ecommerce-api` en tu terminal (PowerShell o VS Code).
2. Instalá las dependencias:
   ```bash
   npm install
   ```
3. Creá tu archivo `.env` en la raíz del proyecto con estos valores:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/iaew_ecommerce
   INTERNAL_API_KEY=secreto-local-123
   AUTH0_DOMAIN=tu-tenant.us.auth0.com
   AUTH0_AUDIENCE=https://iaew-pedidos-api
   RABBIT_URL=amqps://tu_usuario:tu_password@jackal.rmq.cloudamqp.com/tu_vhost
   RETRY_DELAY_MS=3000
   MAX_RETRIES=3
   SIMULATE_TRANSIENT_FAILURES=0
   ```
   *(Reemplazá `RABBIT_URL` por tu URL de CloudAMQP o `amqp://localhost:5672` si lo tenés local).*

4. Abrí **dos terminales separadas**:
   * **Terminal 1 (API):** `node src/app.js` (o `npm run dev`) $\rightarrow$ Debe decir *"API escuchando en http://localhost:3000"*.
   * **Terminal 2 (Worker):** `node src/worker.js` $\rightarrow$ Debe decir *"Worker escuchando mensajes en la cola: notificaciones.pedido-confirmado..."*.

---

## 🧪 Las 5 Pruebas Paso a Paso (Para sacar las evidencias)

---

### 🔹 PRUEBA 1: Crear un Pedido y Primera Confirmación

1. **En Postman, crear el pedido:**
   * **Método:** `POST`
   * **URL:** `http://localhost:3000/pedidos`
   * **Headers:**  
     * `Authorization`: `Bearer test-token`
     * `Content-Type`: `application/json`
   * **Body (raw JSON):**
     ```json
     {
       "cliente": {
         "nombre": "Estudiante UTN",
         "email": "alumno@frc.utn.edu.ar"
       },
       "items": [
         {
           "productoId": "<ID_DE_UN_PRODUCTO>",
           "cantidad": 1
         }
       ]
     }
     ```
   * Dale a **Send**. Te devolverá `201 Created`. **Copiá el `_id` del pedido generado**.

2. **Confirmar el pedido por primera vez:**
   * **Método:** `POST`
   * **URL:** `http://localhost:3000/pedidos/<ID_DEL_PEDIDO>/confirmar`
   * **Headers:**
     * `Authorization`: `Bearer test-token`
     * `Idempotency-Key`: `pedido-test-01`
   * **Body:** `none` (vacío).
   * Dale a **Send**.

📸 **Qué capturar de la Prueba 1:**
* En Postman: Status `200 OK`, header `Idempotency-Replayed: false` y body con `"replayed": false`.
* En la Terminal del Worker: El mensaje `Notificación procesada para pedido ...; evento ...`.

---

### 🔹 PRUEBA 2: Replay con la misma clave (Demostración de Idempotencia)

Esta prueba simula que el cliente perdió la conexión y volvió a enviar el mismo request.

1. **En Postman:**
   * En la misma pestaña anterior, **sin cambiar nada**, volvé a hacer clic en **Send**.
2. **Resultado esperado:**
   * Status `200 OK`.
   * En el **Body**: Verás `"replayed": true` (devuelve la misma orden original).
   * En los **Headers de respuesta**: Verás `Idempotency-Replayed: true`.
   * En la **Terminal del Worker**: **NO procesa nada nuevo** (no se publicó mensaje duplicado a RabbitMQ).
   * Si consultás `GET /productos`, el stock no se descontó doble.

📸 **Qué capturar de la Prueba 2:**
* Captura de Postman mostrando `replayed: true` y el header `Idempotency-Replayed: true`.

---

### 🔹 PRUEBA 3: Conflictos de Idempotencia (HTTP 409)

#### Caso 3A: Mismo pedido con OTRA clave
1. En la misma URL del pedido ya confirmado, cambiá el header a `Idempotency-Key: pedido-test-OTRA-CLAVE`.
2. Dale a **Send**.
3. **Resultado:** Status **`409 Conflict`** con `"code": "IDEMPOTENCY_KEY_MISMATCH"`.

#### Caso 3B: Reutilizar clave vieja en un pedido NUEVO
1. Creá un **segundo pedido** (`POST /pedidos`) y copiá su nuevo `_id`.
2. Intentá confirmarlo enviando la clave vieja: `Idempotency-Key: pedido-test-01`.
3. Dale a **Send**.
4. **Resultado:** Status **`409 Conflict`** con `"code": "IDEMPOTENCY_KEY_REUSED"`.

📸 **Qué capturar de la Prueba 3:**
* Capturas de Postman de los errores 409 `IDEMPOTENCY_KEY_MISMATCH` y `IDEMPOTENCY_KEY_REUSED`.

---

### 🔹 PRUEBA 4: Falla Transitoria y Reintentos con TTL en RabbitMQ

Demuestra cómo el Worker maneja caídas temporales esperando con TTL sin trabar la CPU.

1. Abrí el archivo `.env` y cambiá:
   ```env
   SIMULATE_TRANSIENT_FAILURES=2
   ```
2. En la terminal del Worker, hacé `Ctrl + C` y volvé a ejecutar:
   ```bash
   node src/worker.js
   ```
3. Creá un **tercer pedido** en Postman y confirmalo con una clave nueva (`Idempotency-Key: pedido-test-04`).
4. **Mirá tu terminal del Worker:**
   Verás cómo imprime:
   * `Reintento 1/3: Falla transitoria simulada 1/2` *(espera 3 segundos)*
   * `Reintento 2/3: Falla transitoria simulada 2/2` *(espera 3 segundos)*
   * `Notificación procesada para pedido ...` *(¡Éxito en el 3er intento!)*

📸 **Qué capturar de la Prueba 4:**
* Captura de la terminal mostrando los 2 reintentos con pausa y el éxito final.

---

### 🔹 PRUEBA 5: Falla Definitiva y Enrutamiento a la DLQ (Dead Letter Queue)

Demuestra qué pasa cuando un mensaje agota todos sus reintentos permitidos (`MAX_RETRIES=3`).

1. En el archivo `.env` cambiá:
   ```env
   SIMULATE_TRANSIENT_FAILURES=4
   ```
2. Reiniciá el Worker en la terminal (`Ctrl + C` $\rightarrow$ `node src/worker.js`).
3. Creá un **cuarto pedido** en Postman y confirmalo con `Idempotency-Key: pedido-test-05`.
4. **Mirá tu terminal del Worker:**
   * Reintento 1/3 (espera 3s)
   * Reintento 2/3 (espera 3s)
   * Reintento 3/3 (espera 3s)
   * 🛑 **`Enviando a DLQ - reintentos agotados (3/3): Falla transitoria simulada 4/4`**
5. Al terminar, volvé a dejar `SIMULATE_TRANSIENT_FAILURES=0` en tu `.env`.

📸 **Qué capturar de la Prueba 5:**
* Captura de la terminal con el mensaje derivado a la DLQ.

---

## 📦 ¿Cómo se entrega la actividad?

1. Creá una carpeta llamada `evidencias/` dentro del proyecto y pegá tus capturas de pantalla.
2. Comprimí todo el proyecto en un archivo `.zip` **eliminando antes la carpeta `node_modules`** para que no pese de más.
3. Subí el archivo `.zip` a la plataforma de la cátedra (UV / Moodle).

---

## 💡 Conceptos Clave para el Parcial

* **`Idempotency-Key` (HTTP) vs. `eventId` (Mensajería):** El `Idempotency-Key` protege la intención del usuario ante caídas de red web. El `eventId` protege al worker consumidor para que no reprocese eventos reentregados por RabbitMQ (*at-least-once*). **No son intercambiables**.
* **¿Por qué NO usar `nack(requeue=true)`?** Porque reinserta el mensaje al frente de la cola al instante, generando un bucle infinito que eleva la CPU al 100%.
* **¿Cómo se reintenta correctamente?** Publicando en una cola de Retry con TTL (`x-message-ttl`), esperando que expire para volver a la cola principal por dead-lettering.
* **¿Para qué sirve la DLQ?** Para aislar mensajes que fallaron definitivamente, evitando que bloqueen a los mensajes sanos y permitiendo auditarlos.

---

## 🔗 Enlaces Relacionados
- [[Hub_IAEW|Hub Principal IAEW]]
- [[2026-09-17_actividad_clase_05_resiliencia_idempotencia_retry_dlq|Bitácora Técnica Clase 05]]
- [[2026-09-17_resumen_maestro_seguridad_oidc_resiliencia|Resumen Maestro de Seguridad y Resiliencia]]
