const client = require('prom-client');
const mongoose = require('mongoose');

// Initialize Prometheus registry
const register = new client.Registry();

// Enable default system metrics (CPU, Memory, Event Loop Lag, process info)
client.collectDefaultMetrics({ register });

// Custom Prometheus Metrics
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration histogram in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const dbConnectionGauge = new client.Gauge({
  name: 'mongo_db_connection_status',
  help: 'MongoDB database connection state (1 = connected, 0 = disconnected)',
});

register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDuration);
register.registerMetric(dbConnectionGauge);

/**
 * Express Middleware to capture request metrics for Prometheus scraping
 */
const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route || req.originalUrl,
      status_code: res.statusCode,
    };

    httpRequestCounter.inc(labels);
    end(labels);

    // Update database connection status metric
    const dbStatus = mongoose.connection.readyState === 1 ? 1 : 0;
    dbConnectionGauge.set(dbStatus);
  });

  next();
};

/**
 * Route handler for scraping Prometheus metrics
 */
const metricsHandler = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};

module.exports = {
  metricsMiddleware,
  metricsHandler,
  register,
};
