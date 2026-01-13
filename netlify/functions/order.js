const crypto = require('crypto');

// PayU Configuration (In production, use environment variables)
const PAYU_KEY = process.env.PAYU_KEY || 'SdqYBK'; // Replace with your PayU merchant key
const PAYU_SALT = process.env.PAYU_SALT || 'Iz32nhUteOVtxXd0lkzwgvJuEBXx1m1H'; // Replace with your PayU salt
const PAYU_BASE_URL = 'https://secure.payu.in/_payment'; // For production, use https://secure.payu.in/_payment

// Base URL for callbacks
const BASE_URL = process.env.URL || 'http://localhost:3000';

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { name, email, phone, address, city, state, pincode, orderItems, total } = body;

    if (!name || !email || !phone || !address || !city || !state || !pincode || !orderItems) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'All fields required' }),
      };
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: payuForm,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};