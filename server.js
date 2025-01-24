const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const paymentRoutes = require('./backend/routes/paymentRoutes');

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// 路由
app.use('/api/payment', paymentRoutes);

// 主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
