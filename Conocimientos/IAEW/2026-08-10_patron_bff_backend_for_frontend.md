# Patrón de Arquitectura: Backend For Frontend (BFF)

**Materia:** Integración de Aplicaciones en Entorno Web (UTN FRC)  
**Materia Hub:** [[2026-08-10_integracion_aplicaciones_web_utn_frc|Integración de Aplicaciones Web (IAEW)]]
**Tags:** #materia/iaew
**Fecha:** 2026-08-10  
**Categoría:** Patrones de Integración y Arquitectura Web  

---

## 💡 ¿Qué es el Patrón BFF (Backend For Frontend)?
El **Patrón BFF** consiste en crear una capa de backend específica y dedicada para cada tipo de cliente frontend (por ejemplo, un BFF para la aplicación Web, un BFF para la App Móvil iOS/Android, y un BFF para integración con Terceros).

En lugar de que todos los clientes consuman una única API generalista o llamen a decenas de microservicios directamente, **cada frontend habla con su propio BFF**, y el BFF se encarga de orquestar la comunicación con los microservicios internos.

---

## ❓ ¿Por qué surge y qué problema resuelve?

### El problema:
- **Diferentes necesidades de UI/UX:** Una App Móvil necesita consumir menos datos (ahorro de batería y datos móviles) y prefiere 1 sola llamada comprimida. Una aplicación Web en desktop tiene mayor ancho de banda y necesita información detallada.
- **Acoplamiento excesivo:** Si los microservicios internos intentan adaptarse a los caprichos de cada diseño de UI, los microservicios se vuelven complejos y difíciles de mantener.
- **Múltiples llamadas cliente-servidor (Over-fetching / Under-fetching):** Para renderizar una sola pantalla en la App móvil, el teléfono tendría que hacer 5 llamadas consecutivas a microservicios distintos a través de la red móvil (latencia alta).

---

## 🏗️ Diagrama de Arquitectura BFF

```
[ App Móvil (iOS/Android) ]      [ App Web (Desktop/Browser) ]
            │                                  │
            ▼                                  ▼
   ┌─────────────────┐                ┌─────────────────┐
   │    BFF Móvil    │                │     BFF Web     │
   └────────┬────────┘                └────────┬────────┘
            │                                  │
            └───────────────┬──────────────────┘
                            │ (Red Interna)
                            ▼
        ┌───────────────────────────────────────┐
        │       Microservicios Internos         │
        │  [Usuarios]  [Catálogo]  [Pedidos]   │
        └───────────────────────────────────────┘
```

---

## ⚙️ Funciones Principales de un BFF
1. **Agregación de Datos (Composition):** El BFF llama a 3 microservicios internos en paralelo y combina las respuestas en un único objeto JSON listo para la UI.
2. **Transformación y Filtrado de Payloads:** Elimina campos innecesarios para el móvil y adapta formatos de fecha, moneda o idiomas.
3. **Manejo de Autenticación y Sesiones:** Convierte cookies del navegador en tokens JWT para los microservicios backend.
4. **Caché y Resiliencia:** Implementa patrones como *Circuit Breaker*, límites de tasa (*rate limiting*) y caché optimizada para la interfaz cliente.

---

## 🍕 Explicación Sencilla (La Analogía del Restaurante)

Imagínate que vas a un restaurante a cenar:
- En la cocina hay **varios especialistas**: el parrillero, el barman de tragos, el repostero y el cajero.
- **Sin BFF:** Tú tendrías que levantarte de tu mesa e ir a hablar uno por uno con cada especialista (ir a la parrilla por la carne, ir a la barra por la bebida, ir a la caja a pagar). Sería caótico, lento y gastarías mucha energía.
- **Con BFF (El Mozo dedicado):** Tú te sientas en la mesa y le das **una sola orden al mozo** ("Quiero una hamburguesa, una gaseosa y el postre"). El mozo va a la cocina, le pide a cada especialista lo suyo, acomoda todo en una sola bandeja y **te trae todo junto a tu mesa en un solo viaje**.

### ¿Cómo se aplica esto a las Apps?
- **La App de tu Celular:** Es el cliente sentado en la mesa.
- **Los Servidores de la empresa:** Son los especialistas de la cocina (Servidor de usuarios, Servidor de pagos, Servidor de catálogo).
- **El BFF:** Es el **mozo personal** de tu App. La App le hace **1 sola llamada al BFF**, el BFF junta la información de todos los servidores internos y le entrega a la App **únicamente lo que necesita para mostrar en pantalla**.

---

## 📱 ¿Por qué hay un BFF para Celular y otro para Web?
Porque el cliente en el celular quiere un **"menú rápido"** (pocos datos para no gastar batería ni megas), mientras que el cliente en la computadora (Web) tiene pantalla grande y quiere el **"menú completo con todos los detalles"**.

Cada BFF prepara la comida (los datos) en el tamaño y formato perfecto para su pantalla.

---

## 💻 Ejemplo Genérico en Código (Node.js / Express)

### ❌ Sin BFF (La App Móvil tendría que hacer 3 peticiones por la red móvil):
```javascript
// La App móvil tendría que ejecutar esto en el teléfono:
const usuario = await fetch('http://api.empresa.com/usuarios/123').then(r => r.json());
const pedidos = await fetch('http://api.empresa.com/pedidos/123').then(r => r.json());
const puntos  = await fetch('http://api.empresa.com/puntos/123').then(r => r.json());

// Resultado: 3 viajes de red lentos sobre 4G/5G
```

### ✅ Con BFF (Un solo endpoint preparado para la pantalla del Celular):

```javascript
// Servidor BFF Móvil (bff-movil.js)
const express = require('express');
const app = express();

// Endpoint único diseñado a la medida de la pantalla de inicio del Móvil
app.get('/api/movil/inicio/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;

  try {
    // 1. El BFF llama a los 3 microservicios internos en paralelo (red interna ultra rápida)
    const [resUsuario, resPedidos, resPuntos] = await Promise.all([
      fetch(`http://microservicio-usuarios/api/v1/users/${usuarioId}`),
      fetch(`http://microservicio-pedidos/api/v1/orders?userId=${usuarioId}&limit=2`),
      fetch(`http://microservicio-puntos/api/v1/points/${usuarioId}`)
    ]);

    const usuario = await resUsuario.json();
    const pedidos = await resPedidos.json();
    const puntos  = await resPuntos.json();

    // 2. Agrega, simplifica y recorta los datos estrictamente necesarios para la UI
    const payloadOptimizado = {
      nombreCliente: usuario.nombreCompleto,
      puntosAcumulados: puntos.totalPuntos,
      ultimosPedidos: pedidos.map(p => ({
        id: p.id,
        estado: p.status,
        total: `$${p.montoTotal}`
      }))
    };

    // 3. Retorna todo listo en un solo paquete JSON
    res.json(payloadOptimizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar la pantalla de inicio' });
  }
});

app.listen(3000, () => console.log('BFF Móvil corriendo en puerto 3000'));
```

---

## ⚡ ¿Por qué la primera forma es secuencial/lenta y el BFF en paralelo?

### 1. El problema en la App móvil (Secuencial / Múltiples viajes de red):
Cuando usas `await` línea por línea en el celular:
- La línea 1 abre una conexión por antena 4G/5G, viaja al servidor, espera la respuesta y vuelve (**~100 ms**).
- Recién cuando termina, la línea 2 hace lo mismo (**~100 ms**).
- Luego la línea 3 (**~100 ms**).
- **Tiempo total:** `100ms + 100ms + 100ms = 300ms` (La App se siente congelada o lenta).

### 2. La ventaja del BFF (`Promise.all` en el Servidor):
En JavaScript, `Promise.all([ fetch1, fetch2, fetch3 ])` **dispara las 3 consultas al mismo tiempo en el mismo milisegundo**.
- Como el servidor BFF está alojado en la **misma red interna o Data Center** (AWS, Google Cloud) que los microservicios, la velocidad entre ellos es de **1 ms** por fibra óptica local.
- Las 3 consultas arrancan juntas en paralelo.
- **Tiempo total:** Lo que tarde la consulta más lenta (ej. **10 ms**).

### ⏱️ Comparación de Tiempos:
- **Celular directo (Secuencial):** `[--- 100ms ---] -> [--- 100ms ---] -> [--- 100ms ---]` = **300 ms**
- **Servidor BFF (Paralelo):** `[--- 10ms ---]` (las 3 se ejecutan al mismo tiempo) = **10 ms**
