const { onRequest } = require('firebase-functions/v2/https');
const app = require('./server');

exports.api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '512MiB',
    secrets: ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRE', 'DB_SYNC'],
  },
  app,
);
