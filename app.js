const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static (Landing page)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./src/modules/auth/auth.routes'));
app.use('/api/products', require('./src/modules/products/product.routes'));
app.use('/api/orders', require('./src/modules/orders/order.routes'));
app.use('/api/reviews', require('./src/modules/reviews/review.routes'));
app.use('/api/invoices', require('./src/modules/invoice/invoice.routes'));
app.use('/api/admin', require('./src/modules/admin/admin.routes'));
app.use('/api/banners', require('./src/modules/banner/banner.routes'));
app.use('/api/influencers', require('./src/modules/influencer/influencer.routes'));
app.use('/api/payments', require('./src/modules/payments/payment.routes'));

// 404 handler (important)
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Error handler (LAST)
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;