// Parking Service: owns the parking-space data. No other service edits this array.
const express = require('express');
const app = express();
require('../../lib/metrics')(app);
app.use(express.json());
const PORT = process.env.PORT || 3002;
const spaces = [
  { id: 1, location: 'Riyadh Mall', pricePerHour: 10, status: 'available' },
  { id: 2, location: 'Riyadh Mall', pricePerHour: 10, status: 'available' },
  { id: 3, location: 'University', pricePerHour: 5, status: 'available' }
];
let nextId = 4;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'parking' }));
app.get('/spaces', (req, res) => res.json(spaces));
app.get('/spaces/available', (req, res) => res.json(spaces.filter(s => s.status === 'available')));
app.get('/spaces/:id', (req, res) => {
  const space = spaces.find(s => s.id === Number(req.params.id));
  if (!space) return res.status(404).json({ error: 'Space not found' });
  res.json(space);
});
app.post('/spaces', (req, res) => {
  const { location, pricePerHour } = req.body;
  if (!location || !Number.isFinite(pricePerHour) || pricePerHour < 0) {
    return res.status(400).json({ error: 'Valid location and pricePerHour required' });
  }
  const space = { id: nextId++, location, pricePerHour, status: 'available' };
  spaces.push(space);
  res.status(201).json(space);
});
// Internal demo operation: claim a spot, refusing to claim an occupied spot.
app.post('/spaces/:id/reserve', (req, res) => {
  const space = spaces.find(s => s.id === Number(req.params.id));
  if (!space) return res.status(404).json({ error: 'Space not found' });
  if (space.status !== 'available') return res.status(409).json({ error: 'Space already reserved' });
  space.status = 'reserved';
  res.json(space);
});
app.post('/spaces/:id/release', (req, res) => {
  const space = spaces.find(s => s.id === Number(req.params.id));
  if (!space) return res.status(404).json({ error: 'Space not found' });
  space.status = 'available';
  res.json(space);
});

app.listen(PORT, () => console.log(`Parking Service listening on ${PORT}`));
