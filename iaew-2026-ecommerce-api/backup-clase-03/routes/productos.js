const express = require('express');
const Producto = require('../models/Producto');
const { requireApiKey, requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /productos - Consultar catálogo desde MongoDB (Público)
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar productos' });
  }
});

// POST /productos - Crear producto (Protegido: API Key + Bearer Token + Rol Admin)
router.post('/', requireApiKey, requireAuth, requireRole('admin'), async (req, res) => {
  try {
    if (!req.body || !req.body.nombre || !req.body.categoria) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const producto = await Producto.create({
      nombre: req.body.nombre,
      precio: req.body.precio,
      categoria: req.body.categoria,
      stock: req.body.stock,
      activo: req.body.activo ?? true
    });

    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
