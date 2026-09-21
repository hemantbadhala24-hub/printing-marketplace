const pool = require('./db');
const express = require('express');
const bcrypt = require('bcryptjs');
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
    const result = await pool.query('SELECT id, name, phone_number, email, role, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.post('/register', async (req, res) => {
  try {
    const { name, phone_number, email, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, phone_number, email, role, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, phone_number, role',
      [name, phone_number, email, role, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { phone_number, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    
    if (result.rows.length === 0) {
      return res.send('Error: User nahi mila');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.send('Error: Galat password');
    }

    res.json({ id: user.id, name: user.name, role: user.role });
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, category, is_customizable, base_image_url, sizes_available } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, category, is_customizable, base_image_url, sizes_available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, category, is_customizable, base_image_url, sizes_available]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.get('/sellers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sellers');
    res.json(result.rows);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.post('/sellers', async (req, res) => {
  try {
    const { user_id, shop_name, address, latitude, longitude } = req.body;
    const result = await pool.query(
      'INSERT INTO sellers (user_id, shop_name, address, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, shop_name, address, latitude, longitude]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.get('/listings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seller_listings');
    res.json(result.rows);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.post('/listings', async (req, res) => {
  try {
    const { seller_id, product_id, price, stock_quantity } = req.body;
    const result = await pool.query(
      'INSERT INTO seller_listings (seller_id, product_id, price, stock_quantity) VALUES ($1, $2, $3, $4) RETURNING *',
      [seller_id, product_id, price, stock_quantity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.get('/listings-detailed', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT seller_listings.id, seller_listings.price, seller_listings.stock_quantity,
             products.name AS product_name, sellers.shop_name
      FROM seller_listings
      JOIN products ON seller_listings.product_id = products.id
      JOIN sellers ON seller_listings.seller_id = sellers.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders');
    res.json(result.rows);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.post('/orders', async (req, res) => {
  try {
    const { customer_id, seller_id, listing_id, quantity, total_price, delivery_address, delivery_type } = req.body;
    const result = await pool.query(
      `INSERT INTO orders (customer_id, seller_id, listing_id, quantity, total_price, delivery_address, delivery_type, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'placed') RETURNING *`,
      [customer_id, seller_id, listing_id, quantity, total_price, delivery_address, delivery_type]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.get('/seller-orders/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const result = await pool.query(`
      SELECT orders.id, orders.quantity, orders.total_price, orders.delivery_address, 
             orders.status, orders.created_at, users.name AS customer_name, users.phone_number
      FROM orders
      JOIN users ON orders.customer_id = users.id
      WHERE orders.seller_id = $1
      ORDER BY orders.created_at DESC
    `, [sellerId]);
    res.json(result.rows);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, orderId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`);
});