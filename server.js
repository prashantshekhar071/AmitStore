const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files like index.html

// PayU Configuration (In production, use environment variables)
const PAYU_KEY = process.env.PAYU_KEY || 'SdqYBK'; // Replace with your PayU merchant key
const PAYU_SALT = process.env.PAYU_SALT || 'Iz32nhUteOVtxXd0lkzwgvJuEBXx1m1H'; // Replace with your PayU salt
const PAYU_BASE_URL = 'https://secure.payu.in/_payment'; // For production, use https://secure.payu.in/_payment

// Base URL for callbacks
const BASE_URL = process.env.URL || `http://localhost:${PORT}`;

// In-memory user storage (for demo; use DB in production)
let users = []; // { email, password, name }

// Routes
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  users.push({ name, email, password });
  res.json({ message: 'Account created successfully' });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
});

app.post('/order', (req, res) => {
  const { name, email, phone, address, city, state, pincode, orderItems, total } = req.body;
  if (!name || !email || !phone || !address || !city || !state || !pincode || !orderItems) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  // Generate order ID
  const orderId = 'ORD' + Date.now();
  
  // Calculate total amount (remove ₹ and convert to number)
  const amount = parseFloat(total.replace('₹', ''));
  
  // Prepare product info
  const productInfo = orderItems.map(item => `${item.product} x${item.quantity}`).join(', ');
  
  // PayU parameters
  const txnid = orderId;
  const surl = `${BASE_URL}/payment-success.html?orderId=${orderId}`; // Success URL
  const furl = `${BASE_URL}/payment-failure.html?orderId=${orderId}`; // Failure URL
  
  // Generate hash (SHA512 of key|txnid|amount|productinfo|firstname|email|||||||||||salt)
  const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productInfo}|${name}|${email}|||||||||||${PAYU_SALT}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  
  // Create HTML form that auto-submits to PayU
  const payuForm = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Redirecting to PayU...</title>
    </head>
    <body>
        <p>Redirecting to PayU for payment...</p>
        <form action="${PAYU_BASE_URL}" method="post" id="payuForm">
            <input type="hidden" name="key" value="${PAYU_KEY}" />
            <input type="hidden" name="txnid" value="${txnid}" />
            <input type="hidden" name="amount" value="${amount}" />
            <input type="hidden" name="productinfo" value="${productInfo}" />
            <input type="hidden" name="firstname" value="${name}" />
            <input type="hidden" name="email" value="${email}" />
            <input type="hidden" name="phone" value="${phone}" />
            <input type="hidden" name="surl" value="${surl}" />
            <input type="hidden" name="furl" value="${furl}" />
            <input type="hidden" name="hash" value="${hash}" />
            <input type="hidden" name="address1" value="${address}" />
            <input type="hidden" name="city" value="${city}" />
            <input type="hidden" name="state" value="${state}" />
            <input type="hidden" name="country" value="India" />
            <input type="hidden" name="zipcode" value="${pincode}" />
        </form>
        <script>
            document.getElementById('payuForm').submit();
        </script>
    </body>
    </html>
  `;
  
  res.send(payuForm);
});

// Payment success callback
app.get('/payment-success', (req, res) => {
  const { orderId, txnid, amount, productinfo, firstname, email, status } = req.query;
  // In a real app, verify the hash and update order status
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Successful</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: green; }
        </style>
    </head>
    <body>
        <h1 class="success">Payment Successful!</h1>
        <p>Order ID: ${orderId}</p>
        <p>Transaction ID: ${txnid}</p>
        <p>Amount: ₹${amount}</p>
        <p>Thank you for your purchase.</p>
        <a href="/">Back to Store</a>
    </body>
    </html>
  `);
});

// Payment failure callback
app.get('/payment-failure', (req, res) => {
  const { orderId, txnid, amount, productinfo, firstname, email, status } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Failed</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .failure { color: red; }
        </style>
    </head>
    <body>
        <h1 class="failure">Payment Failed</h1>
        <p>Order ID: ${orderId}</p>
        <p>Please try again.</p>
        <a href="/">Back to Store</a>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
