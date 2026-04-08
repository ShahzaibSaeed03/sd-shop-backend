const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/', (req, res) => {
  res.send('API Running');
});

app.use('/api/auth', require('./src/modules/auth/auth.routes'));

app.use(require('./src/middlewares/error.middleware'));
app.use('/api/products', require('./src/modules/products/product.routes'));
app.use('/api/orders', require('./src/modules/orders/order.routes'));
app.use('/api/reviews', require('./src/modules/reviews/review.routes'));
app.use('/api/invoices', require('./src/modules/invoice/invoice.routes'));
app.use('/api/admin', require('./src/modules/admin/admin.routes'));
app.use('/api/banners', require('./src/modules/banner/banner.routes'));
app.use('/api/influencers', require('./src/modules/influencer/influencer.routes'));
app.use('/api/payments', require('./src/modules/payments/payment.routes'));
app.use((err, req, res, next) => {
  console.error(err); // log full error

  res.status(500).json({
    message: err.message,
    error: err
  });
});
module.exports = app;