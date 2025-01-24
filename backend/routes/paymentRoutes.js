const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 创建订单
router.post('/create-order', paymentController.createOrder);

// 获取支付状态
router.get('/status/:orderId', paymentController.getPaymentStatus);

// 支付回调接口
router.post('/callback', paymentController.paymentCallback);

module.exports = router;
