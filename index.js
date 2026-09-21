const pool = require('./db');
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.send('Hello! Mera Printing Marketplace server chal raha hai!');
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Database connected! Time: ${result.rows[0].now}`);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, phone_number, email, role } = req.body;
    const result = await pool.query(
      'INSERT INTO users (name, phone_number, email, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone_number, email, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`);
});