# Protocolo de Comunicación: WebSockets

**Materia:** Integración de Aplicaciones en Entorno Web (UTN FRC)  
**Fecha:** 2026-08-10  
**Categoría:** Protocolos de Comunicación y Tiempo Real  

---

## 💡 ¿Qué es WebSocket?
**WebSocket** es un protocolo de red (estándar RFC 6455) que establece un **canal de comunicación bidireccional (full-duplex) y continuo sobre una única conexión TCP persistente** entre el navegador (cliente) y el servidor.

A diferencia del protocolo HTTP tradicional (donde el cliente siempre debe realizar una petición para recibir una respuesta), WebSocket permite que **tanto el cliente como el servidor se envíen datos de forma instantánea en cualquier momento** sin la sobrecarga de reabrir conexiones ni enviar cabeceras HTTP repetitivas.

---

## 📞 Analogía Sencilla: Carta Postal vs. Llamada Telefónica

- **HTTP Tradicional (Carta Postal):** Cada mensaje requiere escribir una carta, poner sobre y estampilla, enviarla y esperar que vuelva la carta de respuesta. Si quieres saber si hay novedades, tienes que enviar otra carta a preguntar.
- **WebSocket (Llamada Telefónica):** Llamas una sola vez, la línea queda **abierta indefinidamente** y ambas personas pueden hablar o escuchar en tiempo real sin colgar la llamada.

---

## ⚖️ Comparación: HTTP vs. WebSocket

| Característica | HTTP Tradicional | WebSocket |
| :--- | :--- | :--- |
| **Flujo de comunicación** | Unidireccional (Cliente solicita, Servidor responde) | Bidireccional / Full-Duplex (Ambos envían cuando quieren) |
| **Conexión** | Efímera (se abre y se cierra por cada petición) | Persistente (se mantiene abierta en segundo plano) |
| **Latencia** | Alta (~50ms - 300ms por sobrecarga de cabeceras) | Ultra baja (~1ms - 5ms por mensaje) |
| **Ideal para** | Cargar páginas, APIs REST, formularios, documentos | Chats, juegos online, cotizaciones en vivo, mapas |

---

## 🚀 Casos de Uso Típicos en la Industria
1. **Chats en Tiempo Real:** WhatsApp Web, Discord, Slack.
2. **Seguimiento GPS en vivo:** Ver el ícono del auto/moto moviéndose en tiempo real en Uber, PedidosYa o Rappi.
3. **Finanzas y Criptomonedas:** Gráficos de precios de Bitcoin o acciones cambiando cada milisegundo en Binance o Yahoo Finance.
4. **Colaboración Multiusuario:** Ver el cursor de tus compañeros en Figma o Google Docs.
5. **Juegos Multijugador Web:** Transmisión rápida de posiciones de jugadores.

---

## 💻 Ejemplo Genérico en Código (JavaScript)

### 1. Servidor (Node.js):
```javascript
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (socket) => {
  console.log('Cliente conectado');

  // Enviar mensaje instantáneo al cliente
  socket.send('¡Conexión establecida en tiempo real!');

  // Escuchar mensajes entrantes del cliente
  socket.on('message', (data) => {
    console.log('Mensaje del cliente:', data.toString());
  });
});
```

### 2. Cliente (Navegador):
```javascript
// Abre la conexión permanente usando el protocolo ws://
const socket = new WebSocket('ws://localhost:8080');

// Al conectar exitosamente
socket.onopen = () => {
  socket.send('¡Hola Servidor desde el navegador!');
};

// Escucha notificaciones instantáneas enviadas por el servidor (Push)
socket.onmessage = (event) => {
  console.log('Notificación recibida:', event.data);
};
```
