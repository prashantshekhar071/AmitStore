# Amit Store - PayU Payment Gateway Integration

This project is a stationary store website with PayU payment gateway integration.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure PayU credentials in `server.js`:
   - Replace `your_payu_key_here` with your PayU merchant key
   - Replace `your_payu_salt_here` with your PayU salt

3. Start the server:
   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

## PayU Integration

The payment integration uses PayU's prebuilt checkout page. When a user places an order:

1. The server generates a secure hash using the merchant key and salt.
2. A form is created with payment parameters and auto-submitted to PayU.
3. User completes payment on PayU's secure page.
4. User is redirected back to success or failure page based on payment status.

## Getting PayU Credentials

1. Sign up for a PayU merchant account at https://www.payu.in/
2. Get your merchant key and salt from the dashboard.
3. For testing, use PayU's test credentials.

## Important Notes

- In production, store PayU credentials as environment variables.
- Implement proper order tracking and database storage.
- Verify payment responses by checking the hash on success/failure callbacks.