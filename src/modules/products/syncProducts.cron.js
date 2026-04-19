// syncProducts.cron.js
const cron = require('node-cron');
const supplier = require('../modules/supplier/supplier.service');

cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Syncing products...');
  await supplier.syncProducts();
});