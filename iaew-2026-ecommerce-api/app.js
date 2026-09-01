require('dotenv').config();
const express = require('express');
const { connectDb } = require('./db');
const { requireAuth } = require('./middleware/auth');
const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de Health Check (Público)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint de Identidad / Depuración (Protegido: Bearer Token)
app.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use('/productos', productosRouter);
app.use('/pedidos', pedidosRouter);

// Conectar a MongoDB y luego levantar la API
connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API escuchando en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar a MongoDB');
    console.error(error.message);
    process.exit(1);
  });
