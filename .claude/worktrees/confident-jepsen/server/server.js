require('dotenv').config();

const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/db');
const { initializeSocket } = require('./socket');
const logger = require('./config/logger');
const { logMetricsSummary } = require('./middlewares/metrics');
const { connect: connectRedis, disconnect: disconnectRedis } = require('./config/redis');

// Initialize Redis cache
connectRedis().catch(err => {
  logger.warn('Redis connection failed - continuing without cache', {
    error: err.message
  });
});

// Run database migrations
const runMigrations = async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', '20260113_add_ladies_only.sql');

    if (fs.existsSync(migrationPath)) {
      logger.info('🔄 Running migration: 20260113_add_ladies_only.sql');
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(sql);
      logger.info('✅ Migration executed successfully');
    } else {
      logger.warn('⚠️ Migration file not found:', migrationPath);
    }
  } catch (err) {
    logger.error('❌ Migration failed:', err.message);
  }
};

// Start server
const PORT = config.PORT;

const startServer = async () => {
  // Run migrations before starting server
  await runMigrations();

  const server = app.listen(PORT, () => {
    logger.info('Server started successfully', {
      port: PORT,
      environment: config.NODE_ENV,
      frontendUrl: config.FRONTEND_URL,
      database: `${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`,
      timestamp: new Date().toISOString(),
    });
  });

  // Initialize Socket.io
  const io = initializeSocket(server);
  logger.info('Socket.io initialized for real-time notifications');

  // Make io instance available globally for controllers
  app.set('io', io);

  // Graceful shutdown handling...
  // (We need to move gracefulShutdown definition or make sure 'server' variable is accessible)
  // To keep scope clean, we'll attach 'server' to 'app' or use a global var if needed, 
  // but 'server' is const inside this scope. 
  // We need to move gracefulShutdown logic inside this function or handle it differently.

  // Actually, let's keep it simple. We can just export 'server' if needed, but module.exports = app is at the end.
  // The original code had gracefulShutdown using 'server'.
  setupGracefulShutdown(server);
};

// Extracted graceful shutdown logic
const setupGracefulShutdown = (server) => {
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      // Close Redis connection
      try {
        await disconnectRedis();
        logger.info('Redis connection closed');
      } catch (err) {
        logger.warn('Error closing Redis connection', {
          error: err.message,
        });
      }

      // Close database connection pool
      try {
        await pool.end();
        logger.info('Database pool closed');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing database pool', {
          error: err.message,
          stack: err.stack,
        });
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Make database pool available globally for controllers
app.set('dbPool', pool);

// Log metrics summary every 15 minutes (optional)
if (config.NODE_ENV === 'production') {
  setInterval(logMetricsSummary, 15 * 60 * 1000); // 15 minutes
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception - Server will shut down', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection - Server will shut down', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

module.exports = app;
