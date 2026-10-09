require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to MS SQL Server successfully!');
        return pool;
    })
    .catch(err => console.error('Database connection failed:', err));

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. Please log in.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
}

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const pool = await poolPromise;
        const checkUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Users (name, email, password) VALUES (@name, @email, @password)');

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        const user = result.recordset[0];
        if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful!', token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Products');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Products WHERE id = @id');

        if (result.recordset.length === 0) return res.status(404).json({ error: 'Product not found.' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', verifyToken, async (req, res) => {
    const { items, totalAmount } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty.' });
    }

    try {
        const pool = await poolPromise;
        const orderResult = await pool.request()
            .input('userId', sql.Int, req.user.id)
            .input('totalAmount', sql.Decimal(10, 2), totalAmount)
            .query('INSERT INTO Orders (user_id, total_amount) OUTPUT INSERTED.id VALUES (@userId, @totalAmount)');

        const orderId = orderResult.recordset[0].id;

        for (let item of items) {
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('productId', sql.Int, item.id)
                .input('quantity', sql.Int, item.quantity)
                .input('price', sql.Decimal(10, 2), item.price)
                .query('INSERT INTO OrderItems (order_id, product_id, quantity, price) VALUES (@orderId, @productId, @quantity, @price)');
        }

        res.status(201).json({ message: 'Order placed successfully!', orderId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/user/orders', verifyToken, async (req, res) => {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                o.id AS order_id, 
                o.total_amount, 
                o.order_status, 
                o.created_at,
                oi.product_id, 
                oi.quantity, 
                oi.price, 
                p.name AS product_name, 
                p.image_url
            FROM Orders o
            INNER JOIN OrderItems oi ON o.id = oi.order_id
            INNER JOIN Products p ON oi.product_id = p.id
            WHERE o.user_id = @userId
            ORDER BY o.created_at DESC
        `;
        const result = await pool.request()
            .input('userId', sql.Int, req.user.id)
            .query(query);

        const ordersMap = {};
        result.recordset.forEach(row => {
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = {
                    id: row.order_id,
                    total_amount: row.total_amount,
                    order_status: row.order_status,
                    created_at: row.created_at,
                    items: []
                };
            }
            ordersMap[row.order_id].items.push({
                product_id: row.product_id,
                name: row.product_name,
                quantity: row.quantity,
                price: row.price,
                image_url: row.image_url
            });
        });

        res.json(Object.values(ordersMap));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});