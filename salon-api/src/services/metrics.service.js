const client = require("prom-client");

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default metrics (CPU, Memory, Event Loop Lag, GC, etc.)
client.collectDefaultMetrics({
  register,
  prefix: "salon_api_",
});

// Custom Metrics

// 1. HTTP Request Duration Histogram (for p50, p95, p99 latency calculation)
const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});
register.registerMetric(httpRequestDurationMicroseconds);

// 2. HTTP Requests Total Counter
const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests processed",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestsTotal);

// 3. Cache Hits Counter (Layer 1 Client Memory / Layer 2 Server Redis / Layer 3 DB)
const cacheHitsTotal = new client.Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits by tier",
  labelNames: ["tier"], // 'layer1_memory', 'layer2_redis'
});
register.registerMetric(cacheHitsTotal);

// 4. Cache Misses Counter
const cacheMissesTotal = new client.Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
});
register.registerMetric(cacheMissesTotal);

// 5. Database Query Duration Histogram
const dbQueryDurationSeconds = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of MongoDB database queries in seconds",
  labelNames: ["operation", "collection"],
  buckets: [0.002, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
});
register.registerMetric(dbQueryDurationSeconds);

module.exports = {
  register,
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  cacheHitsTotal,
  cacheMissesTotal,
  dbQueryDurationSeconds,
};
