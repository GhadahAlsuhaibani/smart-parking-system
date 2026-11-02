// Reservation Service: calls User and Parking services over HTTP.
const express = require('express');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3003;
const USER_URL = process.env.USER_URL || 'http://localhost:3001';
const PARKING_URL = process.env.PARKING_URL || 'http://localhost:3002';
const reservations = [];
let nextId = 1;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'reservation' }));
app.get('/reservations', (req, res) => res.json(reservations));
app.get('/reservations/:id', (req, res) => {
  const reservation = reservations.find(r => r.id === Number(req.params.id));
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
  res.json(reservation);
});
app.post('/reservations', async (req, res) => {
  const { userId, spaceId, hours } = req.body;
  if (!Number.isInteger(userId) || !Number.isInteger(spaceId) || !Number.isInteger(hours) || hours < 1) {
    return res.status(400).json({ error: 'userId, spaceId and positive integer hours required' });
  }
  try {
    const userResponse = await fetch(`${USER_URL}/users/${userId}`);
    if (!userResponse.ok) return res.status(400).json({ error: 'User does not exist' });
    const claim = await fetch(`${PARKING_URL}/spaces/${spaceId}/reserve`, { method: 'POST' });
    if (!claim.ok) {
      const data = await claim.json();
      return res.status(claim.status).json(data);
    }
    const space = await claim.json();
    const reservation = {
      id: nextId++, userId, spaceId, hours,
      amount: space.pricePerHour * hours,
      status: 'pending_payment'
    };
    reservations.push(reservation);
    res.status(201).json(reservation);
  } catch (error) {
    res.status(503).json({ error: 'User or Parking Service unavailable' });
  }
});
app.post('/reservations/:id/cancel', async (req, res) => {
  const reservation = reservations.find(r => r.id === Number(req.params.id));
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
  if (reservation.status === 'cancelled') return res.status(409).json({ error: 'Already cancelled' });
  if (reservation.status === 'paid') return res.status(409).json({ error: 'Paid reservations cannot be cancelled in this demo' });
  try {
    const release = await fetch(`${PARKING_URL}/spaces/${reservation.spaceId}/release`, { method: 'POST' });
    if (!release.ok) return res.status(503).json({ error: 'Could not release parking space' });
    reservation.status = 'cancelled';
    res.json(reservation);
  } catch (error) {
    res.status(503).json({ error: 'Parking Service unavailable' });
  }
});
// Payment Service calls this when the simulated payment succeeds.
app.post('/reservations/:id/paid', (req, res) => {
  const reservation = reservations.find(r => r.id === Number(req.params.id));
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
  if (reservation.status !== 'pending_payment') return res.status(409).json({ error: 'Reservation cannot be paid' });
  reservation.status = 'paid';
  res.json(reservation);
});

app.listen(PORT, () => console.log(`Reservation Service listening on ${PORT}`));
