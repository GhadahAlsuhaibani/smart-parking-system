// A simple API Gateway: forwards incoming requests to the right service.
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const routes = {
  '/users': process.env.USER_URL || 'http://localhost:3001',
  '/spaces': process.env.PARKING_URL || 'http://localhost:3002',
  '/reservations': process.env.RESERVATION_URL || 'http://localhost:3003',
  '/payments': process.env.PAYMENT_URL || 'http://localhost:3004'
};

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gateway' }));
app.use(async (req, res) => {
  const prefix = Object.keys(routes).find(p => req.path === p || req.path.startsWith(p + '/'));
  if (!prefix) return res.status(404).json({ error: 'Unknown API route' });
  try {
    const target = routes[prefix] + req.originalUrl;
    const headers = { 'content-type': req.headers['content-type'] || 'application/json' };
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
      duplex: ['GET', 'HEAD'].includes(req.method) ? undefined : 'half',
      signal: AbortSignal.timeout(5000)
    });
    res.status(response.status);
    res.setHeader('content-type', response.headers.get('content-type') || 'application/json');
    res.send(await response.text());
  } catch (error) {
    res.status(502).json({ error: 'Backend service unavailable' });
  }
});
app.listen(PORT, () => console.log(`API Gateway listening on ${PORT}`));
