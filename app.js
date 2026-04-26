const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const supplierRoutes = require('./src/modules/supplier/supplier.routes');
const app = express();

/**
 * 🔥 IMPORTANT: Webhook must come BEFORE express.json()
 * Otherwise body will be parsed incorrectly
 */
app.use('/api/payments/webhook', express.json());
// Middlewares
const allowedOrigins = [
  'https://sdshop.gg',
  'https://admin.sdshop.gg',
  'http://localhost:4200'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow postman / curl

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔥 IMPORTANT (preflight fix)
app.options(/.*/, cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.use('/api/users', require('./src/modules/users/user.routes'));
app.use('/api/sections', require('./src/modules/section/section.routes'));
app.use('/api/coupons', require('./src/modules/coupon/coupon.routes'));
app.use('/api/categories', require('./src/modules/categorey/category.routes'));
app.use('/api/supplier', supplierRoutes);
// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});
app.set('trust proxy', true);
module.exports = app;