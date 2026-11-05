// Payment Service: simulates payment (no bank or real card details involved).
const express = require('express');
const callService = require('../../lib/call-service');
const app = express();
require('../../lib/metrics')(app);
app.use(express.json());
const PORT = process.env.PORT || 3004;
const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:3003';
const payments = [];
let nextId = 1;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment' }));
app.get('/payments', (req, res) => res.json(payments));
app.post('/payments', async (req, res) => {
  const { reservationId } = req.body;
  if (!Number.isInteger(reservationId)) return res.status(400).json({ error: 'reservationId is required' });
  try {
    const check = await callService(`${RESERVATION_URL}/reservations/${reservationId}`);
    if (!check.ok) return res.status(404).json({ error: 'Reservation not found' });
    const reservation = await check.json();
    if (reservation.status !== 'pending_payment') return res.status(409).json({ error: 'Reservation is not awaiting payment' });
    const update = await callService(`${RESERVATION_URL}/reservations/${reservationId}/paid`, { method: 'POST' });
    if (!update.ok) return res.status(409).json({ error: 'Payment could not be completed' });
    const payment = { id: nextId++, reservationId, amount: reservation.amount, status: 'paid', method: 'simulated' };
    payments.push(payment);
    res.status(201).json(payment);
  } catch (error) {
    res.status(503).json({ error: 'Reservation Service unavailable' });
  }
});

app.listen(PORT, () => console.log(`Payment Service listening on ${PORT}`));
