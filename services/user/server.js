// User Service: stores sample users in memory (data resets after restart).
const express = require('express');
const app = express();
require('../../lib/metrics')(app);
app.use(express.json());
const PORT = process.env.PORT || 3001;
const users = [{ id: 1, name: 'Sara', email: 'sara@example.com', role: 'driver' }];
let nextId = 2;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user' }));
app.get('/users', (req, res) => res.json(users));
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
app.post('/users', (req, res) => {
  const { name, email, role = 'driver' } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
  if (users.some(u => u.email === email)) return res.status(409).json({ error: 'Email already exists' });
  const user = { id: nextId++, name, email, role };
  users.push(user);
  res.status(201).json(user);
});

app.listen(PORT, () => console.log(`User Service listening on ${PORT}`));
