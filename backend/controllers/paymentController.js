const crypto = require('crypto');

// 存储订单信息
const orders = new Map();

// 生成订单ID
function generateOrderId() {
    return crypto.randomBytes(16).toString('hex');
}

// 创建订单
exports.createOrder = async (req, res) => {
    try {
        const { amount, imageCount } = req.body;
        const orderId = generateOrderId();
        
        // 存储订单信息
        orders.set(orderId, {
            amount,
            imageCount,
            status: 'pending',
            createdAt: new Date(),
            paymentMethod: null
        });

        res.json({
            success: true,
            orderId,
            amount
        });
    } catch (error) {
        console.error('创建订单失败:', error);
        res.status(500).json({
            success: false,
            message: '创建订单失败'
        });
    }
};

// 获取支付状态
exports.getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = orders.get(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }

        res.json({
            success: true,
            status: order.status,
            paymentMethod: order.paymentMethod
        });
    } catch (error) {
        console.error('获取支付状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取支付状态失败'
        });
    }
};

// 模拟支付回调接口（实际项目中这里应该是微信/支付宝的回调接口）
exports.paymentCallback = async (req, res) => {
    try {
        const { orderId, paymentMethod } = req.body;
        const order = orders.get(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }

        // 更新订单状态
        order.status = 'paid';
        order.paymentMethod = paymentMethod;
        order.paidAt = new Date();
        
        res.json({
            success: true,
            message: '支付成功'
        });
    } catch (error) {
        console.error('支付回调处理失败:', error);
        res.status(500).json({
            success: false,
            message: '支付回调处理失败'
        });
    }
};
