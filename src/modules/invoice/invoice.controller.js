const service = require('./invoice.service');

exports.getAll = async (req, res, next) => {
  try {
    const invoices = await service.getAllInvoices();
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};