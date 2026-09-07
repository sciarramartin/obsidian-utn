require('dotenv').config();
const amqp = require('amqplib');
const { connectDb } = require('./db');
const Pedido = require('./models/Pedido');

const QUEUE_NAME = 'notificaciones.pedido-confirmado';
const EXCHANGE_NAME = 'pedidos.exchange';
const ROUTING_KEY = 'pedido.confirmado';

async function startWorker() {
  await connectDb();
  console.log('Worker conectado a MongoDB.');

  const rabbitUrl = process.env.RABBIT_URL || 'amqp://iaew:iaew-local@localhost:5672';
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();

  // Asegurar exchange, cola y binding
  await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

  channel.prefetch(1);
  console.log(`Worker escuchando mensajes en la cola: ${QUEUE_NAME}...`);

  channel.consume(
    QUEUE_NAME,
    async (message) => {
      if (!message) return;

      try {
        const contentStr = message.content.toString();
        let evento;
        try {
          evento = JSON.parse(contentStr);
        } catch (parseError) {
          console.error('[Worker] Error al parsear JSON del mensaje:', parseError.message);
          channel.nack(message, false, false);
          return;
        }

        // Validar type, version, eventId, occurredAt y data.pedidoId
        const { eventId, type, version, occurredAt, data } = evento || {};
        if (
          !eventId ||
          type !== 'pedido.confirmado' ||
          version !== 1 ||
          !occurredAt ||
          !data ||
          !data.pedidoId
        ) {
          console.error('[Worker] Mensaje inválido según contrato de evento:', evento);
          channel.nack(message, false, false);
          return;
        }

        console.log(`[Worker] Procesando evento ${eventId} para pedido: ${data.pedidoId}`);

        // Actualizar solamente un pedido confirmado cuya notificación aún no esté procesada
        const pedido = await Pedido.findOne({
          _id: data.pedidoId,
          estado: 'confirmado',
          notificacionEstado: 'pendiente'
        });

        if (!pedido) {
          console.warn(
            `[Worker] Pedido ${data.pedidoId} no encontrado, no está confirmado o ya fue procesado.`
          );
          channel.ack(message);
          return;
        }

        pedido.notificacionEstado = 'procesada';
        pedido.notificadoEn = new Date();
        await pedido.save();

        console.log(`[Worker] Notificación procesada exitosamente para pedido ${pedido._id}`);

        // Ejecutar ack después de persistir
        channel.ack(message);
      } catch (err) {
        console.error('[Worker] Error al procesar mensaje:', err.message);
        channel.nack(message, false, false);
      }
    },
    { noAck: false }
  );
}

startWorker().catch((err) => {
  console.error('[Worker] Error fatal al iniciar:', err);
  process.exit(1);
});
