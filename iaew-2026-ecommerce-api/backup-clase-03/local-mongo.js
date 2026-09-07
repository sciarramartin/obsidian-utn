const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

async function startLocalMongo() {
  const dbDir = path.join(__dirname, '.mongodb_data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'iaew_ecommerce',
      storageEngine: 'wiredTiger',
      dbPath: dbDir
    }
  });

  console.log('Servidor MongoDB local iniciado en:', mongoServer.getUri());
}

startLocalMongo().catch(err => {
  if (err.message && err.message.includes('Port 27017 already in use')) {
    console.log('MongoDB ya está corriendo en el puerto 27017.');
  } else {
    console.warn('Nota sobre MongoDB local:', err.message);
  }
});
