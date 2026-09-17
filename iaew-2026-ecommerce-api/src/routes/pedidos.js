const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');

const { requireScope } = require('../middleware/auth0');
const { publishPedidoConfirmado } = require('../lib/rabbit');
const { validateIdempotencyKey } = require('../lib/idempotency');
const { sendError } = require('../lib/errors');
const router = express.Router();

router.get('/', requireScope('read:pedidos'), async (req, res) => {
  try {
    res.json(await Pedido.find().sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar pedidos' });
  }
});

router.post('/', requireScope('write:pedidos'), async (req, res) => {
  try {
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({
        error: 'El pedido debe tener al menos un item'
      });
    }

    const items = [];

    for (const item of req.body.items) {
      if (!mongoose.Types.ObjectId.isValid(item.productoId)) {
        return res.status(400).json({ error: 'ID de producto inválido' });
      }

      const producto = await Producto.findById(item.productoId);

      if (!producto || !producto.activo) {
        return res.status(400).json({ error: 'Producto inválido' });
      }

      if (!item.cantidad || item.cantidad < 1) {
        return res.status(400).json({ error: 'Cantidad inválida' });
      }

      items.push({
        productoId: producto._id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio
      });
    }

    const total = items.reduce((acum, item) => {
      return acum + item.cantidad * item.precioUnitario;
    }, 0);

    const pedido = await Pedido.create({
      cliente: req.body.cliente,
      items,
      total,
      estado: 'pendiente'
    });

    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/confirmar', requireScope('confirm:pedidos'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de pedido inválido' });
    }

    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // 1. Validar el header Idempotency-Key
    const key = req.header('Idempotency-Key');
    const invalidKey = validateIdempotencyKey(key);
    if (invalidKey) {
      return sendError(
        res,
        400,
        invalidKey.error,
        invalidKey.code,
        false,
        'Enviar una clave válida y estable por operación',
        invalidKey.details
      );
    }

    // 2. Replay: misma clave en pedido ya confirmado -> devolver resultado guardado
    if (
      pedido.estado === 'confirmado' &&
      pedido.confirmacionIdempotencyKey === key &&
      pedido.confirmacionEvento?.eventId
    ) {
      res.set('Idempotency-Replayed', 'true');
      return res.status(200).json({
        pedido,
        evento: pedido.confirmacionEvento,
        idempotencia: { key, replayed: true }
      });
    }

    // 3. Conflicto: pedido confirmado con otra clave
    if (pedido.estado === 'confirmado') {
      return res.status(409).json({
        error: 'El pedido ya fue confirmado con otra clave',
        code: 'IDEMPOTENCY_KEY_MISMATCH',
        retryable: false,
        action: 'Consultar el pedido y no generar una nueva confirmación'
      });
    }

    for (const item of pedido.items) {
      const producto = await Producto.findById(item.productoId);

      if (!producto || !producto.activo || producto.stock < item.cantidad) {
        return res.status(409).json({
          error: `No hay stock suficiente para ${item.nombre}`
        });
      }
    }

    for (const item of pedido.items) {
      await Producto.findByIdAndUpdate(item.productoId, {
        $inc: { stock: -item.cantidad }
      });
    }

    pedido.estado = 'confirmado';
    pedido.confirmadoEn = new Date();

    const evento = {
      eventId: crypto.randomUUID(),
      type: 'pedido.confirmado',
      version: 1,
      occurredAt: pedido.confirmadoEn.toISOString(),
      data: { pedidoId: pedido.id }
    };

    pedido.confirmacionIdempotencyKey = key;
    pedido.confirmacionEvento = evento;

    try {
      await pedido.save();
    } catch (error) {
      if (error?.code === 11000) {
        return sendError(
          res,
          409,
          'La clave de idempotencia ya fue usada en otro pedido',
          'IDEMPOTENCY_KEY_REUSED',
          false,
          'Usar una clave distinta por operación'
        );
      }
      throw error;
    }

    try {
      await publishPedidoConfirmado(evento);
      res.set('Idempotency-Replayed', 'false');
      return res.status(200).json({
        pedido,
        evento,
        idempotencia: { key, replayed: false }
      });
    } catch (error) {
      console.error('Pedido confirmado, pero no se pudo publicar el evento:', error.message);
      return res.status(503).json({
        error: 'El pedido quedó confirmado, pero no se pudo publicar la notificación.',
        pedido
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al confirmar pedido' });
  }
});

module.exports = router;
