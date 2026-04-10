const axios = require('axios');
const Order = require('../orders/order.model');

const BASE_URL = 'https://dev.lapakgaming.com/api';
const API_KEY = process.env.SUPPLIER_API_KEY;

exports.createSupplierOrder = async (order, product) => {
  try {
    const payload = {
      product_code: product.supplierId, // This should be the Lapakgaming product code (e.g., "ML78_8-S2")
      user_id: order.userGameId || "test_user", // Required: user's game ID
      reference_id: order._id.toString(), // Required: your reference ID
      end_user_ip_address: order.userIpAddress || "1.1.1.1", // Required for Hoyoverse games
      notification_url: `${process.env.BASE_URL}/api/supplier/webhook` // Optional: override callback URL
    };

    console.log('📦 Supplier Payload:', payload);

    const response = await axios.post(
      `${BASE_URL}/order`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Supplier Response:', response.data);

    if (response.data.code !== 'SUCCESS') {
      throw new Error(response.data.message || 'Supplier failed');
    }

    return response.data;

  } catch (err) {
    console.log('❌ SUPPLIER ERROR:', err.response?.data || err.message);
    throw err;
  }
};

exports.webhook = async (req, res) => {
  try {
    const data = req.body;

    console.log('📩 SUPPLIER WEBHOOK:', JSON.stringify(data, null, 2));

    // Extract order information from the callback
    const referenceId = data.data?.reference_id || data.reference_id;
    const status = data.data?.status || data.status;
    const tid = data.data?.tid; // Lapakgaming transaction ID

    if (!referenceId) {
      console.log('⚠️ No reference_id in webhook');
      return res.status(200).json({ message: "SUCCESS" });
    }

    const order = await Order.findById(referenceId);
    if (!order) {
      console.log('⚠️ Order not found:', referenceId);
      return res.status(200).json({ message: "SUCCESS" });
    }

    // Update order based on callback status
    if (status === 'SUCCESS') {
      order.supplierStatus = 'completed';
      order.status = 'paid';
      
      // Store the transaction details
      if (data.data?.transactions) {
        order.supplierResponse = {
          tid: tid,
          transactions: data.data.transactions,
          completedAt: new Date()
        };
      }
    } else if (status === 'REFUNDED' || status === 'FAILED') {
      order.supplierStatus = 'failed';
      order.status = 'cancelled';
      order.supplierResponse = data.data;
    } else if (status === 'PENDING') {
      order.supplierStatus = 'processing';
      order.supplierResponse = data.data;
    }

    await order.save();

    console.log(`✅ Order ${order._id} updated to ${order.status}`);
    
    // Return 200 OK as required by Lapakgaming
    return res.status(200).json({ message: "SUCCESS" });

  } catch (err) {
    console.log('❌ WEBHOOK ERROR:', err.message);
    // Still return 200 to acknowledge receipt
    return res.status(200).json({ message: "SUCCESS" });
  }
};