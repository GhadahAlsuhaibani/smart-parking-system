// A simple API Gateway: forwards incoming requests to the right service.
const express = require('express');
const callService = require('../lib/call-service');
const app = express();
require('../lib/metrics')(app);
const PORT = process.env.PORT || 3000;
const routes = {
  '/users': process.env.USER_URL || 'http://localhost:3001',
  '/spaces': process.env.PARKING_URL || 'http://localhost:3002',
  '/reservations': process.env.RESERVATION_URL || 'http://localhost:3003',
  '/payments': process.env.PAYMENT_URL || 'http://localhost:3004'
};
// Internal operations that services call on each other; never exposed to clients.
const internalRoutes = [/^\/spaces\/[^/]+\/(reserve|release)\/?$/i, /^\/reservations\/[^/]+\/paid\/?$/i];
// Longer than two 1-second calls between services, so a slow downstream app is not blamed on its caller.
const TIMEOUT_MS = 2500;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gateway' }));
app.use(async (req, res) => {
  if (internalRoutes.some(r => r.test(req.path))) return res.status(403).json({ error: 'Internal route not available through the gateway' });
  const prefix = Object.keys(routes).find(p => req.path === p || req.path.startsWith(p + '/'));
  if (!prefix) return res.status(404).json({ error: 'Unknown API route' });
  try {
    const target = routes[prefix] + req.originalUrl;
    const headers = { 'content-type': req.headers['content-type'] || 'application/json' };
    const response = await callService(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
      duplex: ['GET', 'HEAD'].includes(req.method) ? undefined : 'half'
    }, TIMEOUT_MS);
    res.status(response.status);
    res.setHeader('content-type', response.headers.get('content-type') || 'application/json');
    res.send(await response.text());
  } catch (error) {
    if (error.circuitOpen) return res.status(503).json({ error: 'Backend service unavailable, try again shortly' });
    res.status(502).json({ error: 'Backend service unavailable' });
  }
});
app.listen(PORT, () => console.log(`API Gateway listening on ${PORT}`));
