# Actividad Práctica: Clase 02 - E-commerce Integrado (API REST + MongoDB)

**Materia Hub:** [[2026-08-10_integracion_aplicaciones_web_utn_frc|IAEW]]  
**Tags:** #materia/iaew #utn #sistemas #api-rest #mongodb #express #docker #mongoose  
**Fecha:** 2026-08-24  
**Clase efectiva:** 2 | **Duración:** 120 min  
**Repositorio / Web:** [iaew-2026-ecommerce-api](https://utn-frc-iaew.github.io/iaew-2026-ecommerce-api/)  

---

## 📚 Materiales y Enlaces de la Clase

| Recurso | Enlace |
| :--- | :--- |
| **Presentación HTML** | [presentacion/](https://utn-frc-iaew.github.io/iaew-2026-ecommerce-api/clases/clase-02/presentacion/) |
| **Material Adicional Completo** | [material-adicional/material-completo.md](https://utn-frc-iaew.github.io/iaew-2026-ecommerce-api/clases/clase-02/material-adicional/material-completo.html) |

---

## 🎯 Objetivo de la Actividad

Construir desde cero una **API REST con Express** para una mini plataforma de e-commerce:
1. Construir endpoints iniciales que respondan con **datos mock** (en memoria) para validar el contrato HTTP.
2. Levantar **MongoDB con Docker**, configurar la cadena de conexión con variables de entorno y utilizar **Mongoose** para persistir productos y pedidos.

> [!IMPORTANT]
> **Criterios de Entrega y Verificación:**
> - Responde `GET /health` (`status: "ok"`).
> - Permite crear y listar productos (`POST /productos`, `GET /productos`).
> - Permite crear pedidos calculando el total y validando items (`POST /pedidos`).
> - Permite confirmar pedidos descontando stock (`POST /pedidos/:id/confirmar`).
> - Persistencia en MongoDB local en contenedor Docker.
> - Manejo de reglas de negocio: responde **`409 Conflict`** si se intenta confirmar dos veces el mismo pedido o si falta stock.

---

## 🛒 Caso de Uso y Regla de Negocio

El sistema modela una compra online simplificada:
1. El cliente consulta el catálogo de productos disponibles.
2. Crea un pedido seleccionando productos y cantidades.
3. El sistema calcula automáticamente el total y lo deja en estado `pendiente`.
4. Se confirma la compra (descontando stock y marcando el pedido como `confirmado`).
5. Si se intenta confirmar otra vez, la API **rechaza la operación con `409 Conflict`**.

> [!NOTE]
> **Idea Central:**  
> **Una API no solo guarda datos. También protege reglas de negocio e invariantes de dominio.**

---

## 🛠️ Prerrequisitos y Herramientas

### Software Base
| Recurso | Uso en la actividad |
| :--- | :--- |
| **Node.js LTS** | Ejecutar la API con JavaScript del lado servidor. |
| **npm** | Inicializar el proyecto, instalar dependencias y scripts. |
| **Docker Desktop** | Levantar MongoDB localmente como contenedor reproducible. |
| **VS Code** | Editor de código principal. |
| **Postman / Insomnia / REST Client** | Cliente HTTP para probar los endpoints. |

### Verificación de Entorno
```bash
node --version
npm --version
docker --version
docker ps
```

> [!TIP]
> Si `docker --version` responde pero `docker ps` falla, abrir Docker Desktop y esperar a que el demonio termine de inicializar.

### Extensiones Recomendadas en VS Code
- **MongoDB for VS Code** (`mongodb.mongodb-vscode`): Explorar bases, colecciones y documentos directamente.
- **REST Client** (`humao.rest-client`): Probar endpoints desde archivos `.http`.
- **Docker** (`ms-azuretools.vscode-docker`): Gestionar contenedores, imágenes y logs.
- **ESLint** (`dbaeumer.vscode-eslint`) y **Prettier** (`esbenp.prettier-vscode`).

---

## 🚀 Guía Paso a Paso de Implementación

### Paso 1: Crear el proyecto e inicializar dependencias
```bash
mkdir iaew-2026-ecommerce-api
cd iaew-2026-ecommerce-api
npm init -y
npm install express
npm install --save-dev nodemon
```

Configurar los scripts en `package.json`:
```json
{
  "scripts": {
    "dev": "nodemon app.js",
    "start": "node app.js"
  }
}
```

---

### Paso 2: Crear la API Express mínima
Crear `app.js`:
```javascript
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
```

* **Prueba:** `GET http://localhost:3000/health`
* **Respuesta esperada:** `{"status": "ok"}`

---

### Paso 3: Endpoints mock de Productos (en memoria)
Crear carpeta `routes/` y archivo `routes/productos.js`:
```javascript
const express = require('express');
const router = express.Router();

const productos = [
  { id: 'prod-1', nombre: 'Auriculares Bluetooth', precio: 45999, categoria: 'audio', stock: 12, activo: true }
];

router.get('/', (req, res) => {
  res.json(productos);
});

router.post('/', (req, res) => {
  const nuevoProducto = {
    id: `prod-${productos.length + 1}`,
    nombre: req.body.nombre,
    precio: req.body.precio,
    categoria: req.body.categoria,
    stock: req.body.stock,
    activo: true
  };
  productos.push(nuevoProducto);
  res.status(201).json(nuevoProducto);
});

module.exports = router;
```

Registrar la ruta en `app.js`:
```javascript
const express = require('express');
const productosRouter = require('./routes/productos');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/productos', productosRouter);

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
```

---

### Paso 4: Endpoints mock de Pedidos
Crear `routes/pedidos.js`:
```javascript
const express = require('express');
const router = express.Router();

const pedidos = [];

router.post('/', (req, res) => {
  const nuevoPedido = {
    id: `ped-${pedidos.length + 1}`,
    cliente: req.body.cliente,
    items: req.body.items,
    estado: 'pendiente',
    total: 0
  };
  pedidos.push(nuevoPedido);
  res.status(201).json(nuevoPedido);
});

router.post('/:id/confirmar', (req, res) => {
  const pedido = pedidos.find((item) => item.id === req.params.id);
  if (!pedido) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  if (pedido.estado !== 'pendiente') {
    return res.status(409).json({ error: 'El pedido ya fue confirmado' });
  }

  pedido.estado = 'confirmado';
  pedido.confirmadoEn = new Date().toISOString();
  res.json(pedido);
});

module.exports = router;
```

Integrar en `app.js`:
```javascript
const pedidosRouter = require('./routes/pedidos');
// ...
app.use('/pedidos', pedidosRouter);
```

---

### Paso 5: Levantar MongoDB con Docker
```bash
# Descargar imagen oficial de MongoDB
docker pull mongo:7

# Levantar contenedor en el puerto default 27017
docker run --name iaew-mongo -p 27017:27017 -d mongo:7

# Si el contenedor ya fue creado previamente:
docker start iaew-mongo

# Verificar estado
docker ps
```
* **Cadena de conexión:** `mongodb://localhost:27017/iaew_ecommerce`

---

### Paso 6: Configurar Variables de Entorno y Mongoose
Instalar paquetes:
```bash
npm install mongoose dotenv
```

Crear `.env.example`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/iaew_ecommerce
```

Crear `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/iaew_ecommerce
```

Crear `.gitignore`:
```gitignore
node_modules/
.env
.DS_Store
```

---

### Paso 7: Módulo de Conexión a Base de Datos
Crear `db.js`:
```javascript
const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/iaew_ecommerce';
  await mongoose.connect(uri);
  console.log('Conexión a MongoDB establecida');
}

module.exports = { connectDb };
```

Actualizar `app.js`:
```javascript
require('dotenv').config();
const express = require('express');
const { connectDb } = require('./db');
const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/productos', productosRouter);
app.use('/pedidos', pedidosRouter);

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
```

---

### Paso 8: Definir Modelo Mongoose de Producto
Crear carpeta `models/` y archivo `models/Producto.js`:
```javascript
const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    categoria: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Producto', productoSchema);
```

---

### Paso 9: Reemplazar Mock de Productos por Persistencia Real
Modificar `routes/productos.js`:
```javascript
const express = require('express');
const Producto = require('../models/Producto');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar productos' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.nombre || !req.body.categoria) {
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
```

---

### Paso 10: Definir Modelo Mongoose de Pedido
Crear `models/Pedido.js`:
```javascript
const mongoose = require('mongoose');

const itemPedidoSchema = new mongoose.Schema(
  {
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const pedidoSchema = new mongoose.Schema(
  {
    cliente: {
      nombre: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true }
    },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmado', 'cancelado'],
      default: 'pendiente'
    },
    items: {
      type: [itemPedidoSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'El pedido debe tener al menos un item'
      }
    },
    total: { type: Number, required: true, min: 0 },
    confirmadoEn: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pedido', pedidoSchema);
```

---

### Paso 11: Reemplazar Mock de Pedidos con Reglas de Negocio
Modificar `routes/pedidos.js`:
```javascript
const express = require('express');
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const router = express.Router();

// Crear pedido
router.post('/', async (req, res) => {
  try {
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
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

// Confirmar pedido (regla de negocio y descuento de stock)
router.post('/:id/confirmar', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de pedido inválido' });
    }

    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(409).json({ error: 'El pedido ya fue confirmado' });
    }

    for (const item of pedido.items) {
      const producto = await Producto.findById(item.productoId);
      if (!producto || !producto.activo || producto.stock < item.cantidad) {
        return res.status(409).json({ error: `No hay stock suficiente para ${item.nombre}` });
      }
    }

    for (const item of pedido.items) {
      await Producto.findByIdAndUpdate(item.productoId, {
        $inc: { stock: -item.cantidad }
      });
    }

    pedido.estado = 'confirmado';
    pedido.confirmadoEn = new Date();
    await pedido.save();

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: 'Error al confirmar pedido' });
  }
});

module.exports = router;
```

---

### Paso 12: Pruebas del Flujo Completo

1. **Crear Producto:**
   `POST http://localhost:3000/productos`
   ```json
   {
     "nombre": "Auriculares Bluetooth",
     "precio": 45999,
     "categoria": "audio",
     "stock": 12
   }
   ```
2. **Listar Productos:** `GET http://localhost:3000/productos` (Copiar el `_id`).
3. **Crear Pedido:**
   `POST http://localhost:3000/pedidos`
   ```json
   {
     "cliente": {
       "nombre": "Ana Pérez",
       "email": "ana@example.com"
     },
     "items": [
       { "productoId": "<ID_DEL_PRODUCTO>", "cantidad": 1 }
     ]
   }
   ```
4. **Confirmar Pedido:** `POST http://localhost:3000/pedidos/<ID_DEL_PEDIDO>/confirmar`
5. **Reintentar Confirmación (Idempotencia / Validación de Estado):**
   `POST http://localhost:3000/pedidos/<ID_DEL_PEDIDO>/confirmar`
   * **Status:** `409 Conflict`
   * **Body:** `{"error": "El pedido ya fue confirmado"}`

---

### Paso 13: Validación de Datos en MongoDB desde VS Code

1. Abrir la extensión **MongoDB for VS Code**.
2. Conectar a: `mongodb://localhost:27017`
3. Explorar la base de datos `iaew_ecommerce` y verificar las colecciones:
   - `productos`: Documentos creados y actualización del campo `stock`.
   - `pedidos`: Documento con `estado: "confirmado"` y `confirmadoEn`.

---

## 📝 Paso 14: Cuestionario de Reflexión (`respuestas.md`)

```markdown
# Respuestas Clase 02

## 1. ¿Qué endpoint fue CRUD?
Respuesta: 
- `GET /productos` y `POST /productos` (operaciones estándar de lectura y creación de recursos en el catálogo).

## 2. ¿Qué endpoint fue una operación de negocio?
Respuesta: 
- `POST /pedidos/:id/confirmar` (no es un simple update de un campo, ejecuta lógica de dominio: validación de estado previo, verificación y descuento de stock, y cambio de estado a confirmado).

## 3. ¿Qué regla de negocio protegimos?
Respuesta: 
- Que un pedido solo puede confirmarse si está en estado `pendiente`.
- Que no se pueda confirmar dos veces la misma compra (evitar doble procesamiento/cobro).
- Que haya stock físico suficiente antes de confirmar y descontar unidades.

## 4. ¿Por qué 409 Conflict es más claro que 500?
Respuesta: 
- El código HTTP `500 Internal Server Error` indica que ocurrió una falla inesperada o un bug no controlado en el servidor. 
- En cambio, `409 Conflict` comunica con precisión semántica que la solicitud es válida a nivel HTTP pero entra en conflicto con el estado actual del recurso en el negocio (el pedido ya cambió de estado o no hay stock).
```

---

## 📦 Pautas de Entrega (UV / Moodle)

### Estructura del `.zip`
- Código fuente (`app.js`, `db.js`, carpetas `models/`, `routes/`).
- `package.json` y `package-lock.json`.
- `.env.example`.
- `.gitignore`.
- `respuestas.md`.
- Evidencias solicitadas (capturas).

> [!CAUTION]
> **NO INCLUIR EN EL ZIP:**
> - `node_modules/`
> - Archivo `.env` real (con credenciales)
> - Archivos temporales o del sistema operativo.

### Evidencias requeridas:
1. Salida de `docker ps` mostrando `iaew-mongo`.
2. `GET /health`
3. `GET /productos` y `POST /productos`
4. `POST /pedidos`
5. `POST /pedidos/:id/confirmar`
6. Captura del error `409 Conflict` al reintentar confirmación.
7. MongoDB for VS Code con la base `iaew_ecommerce`.
