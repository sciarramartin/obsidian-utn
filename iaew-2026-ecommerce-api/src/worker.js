require('dotenv').config();
const amqp = require('amqplib');
const { connectDb } = require('./db');
const Pedido = require('./models/Pedido');
const EventoProcesado = require('./models/EventoProcesado');
const { retryConfig } = require('./lib/config');
const { publishRetry, publishDlq, getChannel } = require('./lib/rabbit');

const QUEUE_NAME = 'notificaciones.pedido-confirmado';

class PermanentMessageError extends Error {}
class TransientMessageError extends Error {}

function retryCountOf(message) {
  const value = Number(message.properties.headers?.['x-retry-count'] ?? 0);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function parsePedidoConfirmado(buffer) {
  const contentStr = buffer.toString();
  let evento;
  try {
    evento = JSON.parse(contentStr);
  } catch (parseError) {
    throw new PermanentMessageError(`Error al parsear JSON del mensaje: ${parseError.message}`);
  }

  const { eventId, type, version, occurredAt, data } = evento || {};
  if (
    !eventId ||
    type !== 'pedido.confirmado' ||
    version !== 1 ||
    !occurredAt ||
    !data ||
    !data.pedidoId
  ) {
    throw new PermanentMessageError(`Mensaje inválido según contrato de evento: ${JSON.stringify(evento)}`);
  }

  return evento;
}

async function processMessage(message, activeChannel) {
  // count y config se declaran FUERA del try para que el catch también los vea.
  // Si los declarás dentro del try, el catch lanza ReferenceError: count is not defined.
  const count = retryCountOf(message);
  const config = retryConfig();

  try {
    // Falla transitoria simulada para pruebas (controlada por SIMULATE_TRANSIENT_FAILURES)
    if (count < config.simulatedFailures) {
      throw new TransientMessageError(
        `Falla transitoria simulada ${count + 1}/${config.simulatedFailures}`
      );
    }

    const event = parsePedidoConfirmado(message.content);

    // 1. Verificar si el evento ya fue procesado
    if (await EventoProcesado.exists({ eventId: event.eventId })) {
      console.log(`Duplicado reconocido: evento ${event.eventId}`);
      activeChannel.ack(message);
      return;
    }

    // 2. Buscar el pedido
    const pedido = await Pedido.findById(event.data.pedidoId);
    if (!pedido) {
      throw new PermanentMessageError('Pedido inexistente');
    }

    // 3. Reservar el eventId antes de aplicar el efecto
    try {
      await EventoProcesado.create({
        eventId: event.eventId,
        type: event.type,
        pedidoId: pedido._id
      });
    } catch (error) {
      if (error?.code === 11000) {
        console.log(`Duplicado reconocido (race): evento ${event.eventId}`);
        activeChannel.ack(message);
        return;
      }
      throw error;
    }

    // 4. Aplicar el efecto; si falla, revertir la reserva
    try {
      pedido.notificacionEstado = 'procesada';
      pedido.notificadoEn = new Date();
      await pedido.save();
    } catch (error) {
      await EventoProcesado.deleteOne({ eventId: event.eventId });
      throw new TransientMessageError(`MongoDB no pudo persistir el efecto: ${error.message}`);
    }

    console.log(`Notificación procesada para pedido ${pedido.id}; evento ${event.eventId}`);
    activeChannel.ack(message);
  } catch (error) {
    if (!(error instanceof PermanentMessageError) && count < config.maxRetries) {
      console.warn(`Reintento ${count + 1}/${config.maxRetries}: ${error.message}`);
      await publishRetry(activeChannel, message, count + 1, error.message);
      activeChannel.ack(message);
      return;
    }

    const reason =
      error instanceof PermanentMessageError
        ? `permanente: ${error.message}`
        : `reintentos agotados (${count}/${config.maxRetries}): ${error.message}`;

    console.error(`Enviando a DLQ — ${reason}`);
    await publishDlq(activeChannel, message, reason, count);
    activeChannel.ack(message);
  }
}

async function startWorker() {
  await connectDb();
  console.log('Worker conectado a MongoDB.');

  const rabbitUrl = process.env.RABBIT_URL || 'amqp://iaew:iaew-local@localhost:5672';
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createConfirmChannel();

  // Asegurar topología completa de RabbitMQ
  await getChannel();

  channel.prefetch(1);
  console.log(`Worker escuchando mensajes en la cola: ${QUEUE_NAME}...`);

  channel.consume(
    QUEUE_NAME,
    async (message) => {
      if (!message) return;
      await processMessage(message, channel);
    },
    { noAck: false }
  );
}

startWorker().catch((err) => {
  console.error('[Worker] Error fatal al iniciar:', err);
  process.exit(1);
});
