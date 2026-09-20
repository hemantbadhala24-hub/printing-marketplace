const pool = require('./db');
const express = require('express');
const app = express();
const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`);
});