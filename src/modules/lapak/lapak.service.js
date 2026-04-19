const axios = require('axios');

const BASE_URL = process.env.LAPAK_BASE_URL;
const API_KEY = process.env.LAPAK_API_KEY;

const headers = {
  Authorization: `Bearer ${API_KEY}`
};

// 👉 PRODUCTS LENA
exports.getProducts = async () => {
  const res = await axios.get(`${BASE_URL}/api/products`, { headers });
  return res.data;
};

// 👉 ORDER BHEJNA
exports.createOrder = async (data) => {
  const res = await axios.post(`${BASE_URL}/api/order`, {
    product_code: data.product_code,
    user_id: data.user_id,
    server_id: data.server_id,
    reference_id: data.reference_id,
    end_user_ip_address: '127.0.0.1'
  }, { headers });

  return res.data;
};