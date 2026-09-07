const amqp = require('amqplib');

const EXCHANGE_NAME = 'pedidos.exchange';
const ROUTING_KEY = 'pedido.confirmado';
const QUEUE_NAME = 'notificaciones.pedido-confirmado';

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

  connection.on('close', () => {
    confirmChannel = null;
    connection = null;
  });

  return confirmChannel;
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

module.exports = {
  getChannel,
  publishPedidoConfirmado,
  EXCHANGE_NAME,
  ROUTING_KEY,
  QUEUE_NAME
};
