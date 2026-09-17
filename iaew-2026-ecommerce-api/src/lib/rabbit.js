const amqp = require('amqplib');
const { retryConfig } = require('./config');
const { retryDelayMs } = retryConfig();

const EXCHANGE_NAME = 'pedidos.exchange';
const ROUTING_KEY = 'pedido.confirmado';
const QUEUE_NAME = 'notificaciones.pedido-confirmado';

const RETRY_EXCHANGE = 'pedidos.retry.exchange';
const RETRY_QUEUE = 'notificaciones.pedido-confirmado.retry';
const DLX = 'pedidos.dlx';
const DLQ_ROUTING_KEY = 'pedido.confirmado.dlq';
const DLQ = 'notificaciones.pedido-confirmado.dlq';

let connection = null;
let confirmChannel = null;

async function getChannel() {
  if (confirmChannel) {
    return confirmChannel;
  }

  const url = process.env.RABBIT_URL || 'amqp://iaew:iaew-local@localhost:5672';
  connection = await amqp.connect(url);
  confirmChannel = await connection.createConfirmChannel();

  // Declarar exchange directo y cola durable
  await confirmChannel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
  await confirmChannel.assertQueue(QUEUE_NAME, { durable: true });
  await confirmChannel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

  // Declarar topología de Retry y Dead Letter Queue (DLQ)
  await confirmChannel.assertExchange(RETRY_EXCHANGE, 'direct', { durable: true });
  await confirmChannel.assertExchange(DLX, 'direct', { durable: true });

  await confirmChannel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-message-ttl': retryDelayMs,
      'x-dead-letter-exchange': EXCHANGE_NAME, // al vencer el TTL, vuelve al exchange principal
      'x-dead-letter-routing-key': ROUTING_KEY
    }
  });
  await confirmChannel.bindQueue(RETRY_QUEUE, RETRY_EXCHANGE, ROUTING_KEY);

  await confirmChannel.assertQueue(DLQ, { durable: true });
  await confirmChannel.bindQueue(DLQ, DLX, DLQ_ROUTING_KEY);

  connection.on('close', () => {
    confirmChannel = null;
    connection = null;
  });

  return confirmChannel;
}

async function confirmedPublish(ch, exchange, routingKey, content, options) {
  const accepted = ch.publish(exchange, routingKey, content, options);
  if (!accepted) throw new Error('RabbitMQ aplicó back-pressure al publicar');
  await ch.waitForConfirms();
}

async function publishPedidoConfirmado(evento) {
  const channel = await getChannel();
  const buffer = Buffer.from(JSON.stringify(evento));

  channel.publish(EXCHANGE_NAME, ROUTING_KEY, buffer, {
    persistent: true,
    contentType: 'application/json'
  });

  await channel.waitForConfirms();
}

async function publishRetry(ch, message, retryCount, reason) {
  await confirmedPublish(ch, RETRY_EXCHANGE, ROUTING_KEY, message.content, {
    ...message.properties,
    persistent: true,
    headers: {
      ...(message.properties.headers || {}),
      'x-retry-count': retryCount,
      'x-last-error': reason
    }
  });
}

async function publishDlq(ch, message, reason, retryCount) {
  await confirmedPublish(ch, DLX, DLQ_ROUTING_KEY, message.content, {
    ...message.properties,
    persistent: true,
    headers: {
      ...(message.properties.headers || {}),
      'x-retry-count': retryCount,
      'x-dlq-reason': reason
    }
  });
}

async function closeRabbit() {
  if (confirmChannel) {
    await confirmChannel.close().catch(() => {});
    confirmChannel = null;
  }
  if (connection) {
    await connection.close().catch(() => {});
    connection = null;
  }
}

module.exports = {
  EXCHANGE: EXCHANGE_NAME,
  ROUTING_KEY,
  QUEUE: QUEUE_NAME,
  getChannel,
  publishPedidoConfirmado,
  closeRabbit,
  confirmedPublish,
  publishRetry,
  publishDlq,
  EXCHANGE_NAME,
  QUEUE_NAME,
  RETRY_EXCHANGE,
  RETRY_QUEUE,
  DLX,
  DLQ
};
