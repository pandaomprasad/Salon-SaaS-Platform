const { register, httpRequestDurationMicroseconds, httpRequestsTotal } = require("../services/metrics.service");

const metricsMiddleware = (req, res, next) => {
  if (req.path === "/metrics") {
    return next();
  }

  const end = httpRequestDurationMicroseconds.startTimer();

  res.on("finish", () => {
    const route = req.route ? req.route.path : req.path || "unknown";
    const statusCode = res.statusCode ? String(res.statusCode) : "500";

    const labels = {
      method: req.method,
      route,
      status_code: statusCode,
    };

    end(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
};

const metricsHandler = async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};

module.exports = {
  metricsMiddleware,
  metricsHandler,
};
