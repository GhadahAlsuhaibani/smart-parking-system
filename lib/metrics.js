// Shared monitoring: times every request and serves the numbers at GET /metrics for Prometheus.
const client = require('prom-client');

client.collectDefaultMetrics();
const duration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'How long each HTTP request took, by method, route and status code',
  labelNames: ['method', 'route', 'status'],
  // 0.5 is a bucket edge so Grafana can count requests that meet the 500 ms SLO.
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

module.exports = function addMetrics(app) {
  app.use((req, res, next) => {
    // The SLO excludes health checks; /metrics is Prometheus itself.
    if (req.path === '/health' || req.path === '/metrics') return next();
    const end = duration.startTimer({ method: req.method });
    res.on('finish', () => {
      // Use the route pattern (/spaces/:id), not the real id, so the number of series stays small.
      const route = req.route ? req.baseUrl + req.route.path : req.path.replace(/\/\d+(?=\/|$)/g, '/:id');
      end({ route, status: res.statusCode });
    });
    next();
  });
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });
};
