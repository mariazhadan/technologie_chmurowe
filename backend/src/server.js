require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const app = express();
const cookieParser = require('cookie-parser');
const db = require('./db');
const { checkOAuthReady } = require('./oauth');
const { ensureRuntimeSchema } = require('./runtime');

const authRoutes = require('./routes/auth');
const warehousesRoutes = require('./routes/warehouses');
const shipmentsRoutes = require('./routes/shipments');
const vehiclesRoutes = require('./routes/vehicles');
const usersRoutes = require('./routes/users');
const eventsRoutes = require('./routes/events');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });

app.use(morgan('dev'));
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cookieParser());
app.use(express.json());
app.set('etag', false);
app.disable('view cache');

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'xpo-logistics-api',
    uptime: process.uptime(),
  });
});

app.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    oauth: false,
  };

  try {
    await db.query('SELECT 1');
    checks.database = true;
    await checkOAuthReady();
    checks.oauth = true;

    return res.json({
      status: 'ready',
      checks,
    });
  } catch (err) {
    return res.status(503).json({
      status: 'not_ready',
      checks,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);

const port = process.env.PORT || 3000;

const startupRetryAttempts = Number(process.env.STARTUP_RETRY_ATTEMPTS || 30);
const startupRetryDelayMs = Number(process.env.STARTUP_RETRY_DELAY_MS || 2000);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureRuntimeSchemaWithRetry() {
  let lastError;

  for (let attempt = 1; attempt <= startupRetryAttempts; attempt += 1) {
    try {
      await ensureRuntimeSchema();
      return;
    } catch (err) {
      lastError = err;
      console.error(
        `Runtime initialization attempt ${attempt}/${startupRetryAttempts} failed: ${err.message}`
      );

      if (attempt < startupRetryAttempts) {
        await wait(startupRetryDelayMs);
      }
    }
  }

  throw lastError;
}

if (require.main === module) {
  ensureRuntimeSchemaWithRetry()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server listening on ${port}`);
      });
    })
    .catch((err) => {
      console.error('Runtime initialization failed:', err);
      process.exit(1);
    });
}

module.exports = app;
