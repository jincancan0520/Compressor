// 获取DOM元素
const uploadButton = document.getElementById('uploadButton');
const imageInput = document.getElementById('imageInput');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalInfo = document.getElementById('originalInfo');
const compressedInfo = document.getElementById('compressedInfo');
const downloadButton = document.getElementById('downloadButton');

// 在文件开头添加初始化函数
function initializeUI() {
    // 初始隐藏相关元素
    document.querySelector('.settings').classList.add('hidden');
    document.querySelector('.preview-container').classList.add('hidden');
    document.getElementById('downloadButton').classList.add('hidden');
}

// 在文件选择处理函数中显示这些元素
function showUIElements() {
    document.querySelector('.settings').classList.remove('hidden');
    document.querySelector('.preview-container').classList.remove('hidden');
    document.getElementById('downloadButton').classList.remove('hidden');
}

// 点击上传按钮时触发文件选择
uploadButton.addEventListener('click', () => {
    imageInput.click();
});

// 添加拖拽上传支持
document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('.upload-container').classList.add('drag-over');
});

document.body.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('.upload-container').classList.remove('drag-over');
});

document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('.upload-container').classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
        showUIElements(); // 显示UI元素
        handleMultipleImages(files);
        handlePreviewImage(files[0]);
    }
});

// 修改文件选择处理函数
imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        showUIElements(); // 显示UI元素
        handleMultipleImages(files);
        handlePreviewImage(files[0]);
    }
});

// 修改预览图片处理函数
async function handlePreviewImage(file) {
    originalInfo.textContent = `大小: ${formatFileSize(file.size)}`;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        originalImage.src = e.target.result;
        originalImage.dataset.originalSize = file.size;
        originalImage.onload = async () => {
            const compressed = await compressImage(originalImage);
            if (compressedImage.src) {
                URL.revokeObjectURL(compressedImage.src);
            }
            compressedImage.src = compressed.url;
            compressedInfo.textContent = `大小: ${formatFileSize(compressed.size)}`;
            downloadButton.disabled = false;
        };
    };
    reader.readAsDataURL(file);
}

// 修改质量滑块变化处理
qualitySlider.addEventListener('input', async (e) => {
    qualityValue.textContent = e.target.value + '%';
    if (originalImage.src) {
        // 更新预览图
        const compressed = await compressImage(originalImage);
        compressedImage.src = compressed.url;
        compressedInfo.textContent = `大小: ${formatFileSize(compressed.size)}`;
        
        // 更新列表中的所有图片
        const imageItems = document.querySelectorAll('.image-item');
        for (const item of imageItems) {
            const originalImg = item.querySelector('img');
            const info = item.querySelector('.info');
            const compressed = await compressImage(originalImg);
            
            // 更新压缩信息
            const spans = info.querySelectorAll('span');
            spans[1].textContent = `压缩质量: ${qualitySlider.value}%`;
            spans[2].textContent = `压缩后: ${formatFileSize(compressed.size)}`;
            
            // 更新下载按钮的链接
            const downloadBtn = item.querySelector('.download-btn');
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.download = `compressed-${originalImg.dataset.filename}`;
                link.href = compressed.url;
                link.click();
                // 清理URL对象
                URL.revokeObjectURL(compressed.url);
            };
        }
    }
});

// 添加常量
const PRICE_PER_IMAGE = 0.1;
let paymentCheckInterval = null;

// 创建付款弹窗
function createPaymentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'paymentModal';
    
    // 添加时间戳防止缓存
    const timestamp = new Date().getTime();
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close">×</button>
            <h3>支付提示</h3>
            <div class="payment-info">
                <div class="amount-display">
                    应付金额：<span class="payment-amount">0</span> 元
                </div>
                <div class="payment-notice" style="color: #ff4d4f; margin: 10px 0; font-size: 14px;">
                    ⚠️ 请务必支付正确金额，否则可能无法完成下载
                </div>
            </div>
            <div class="payment-steps" style="text-align: left; margin: 15px 0; font-size: 14px;">
                <p>1. 请使用微信/支付宝扫描下方二维码</p>
                <p>2. <strong>输入金额：<span class="payment-amount">0</span> 元</strong></p>
                <p>3. 完成支付后点击下方验证按钮</p>
            </div>
            <div class="payment-tabs">
                <button class="payment-tab active" data-type="wechat">微信支付</button>
                <button class="payment-tab" data-type="alipay">支付宝</button>
            </div>
            <div class="payment-qrcodes">
                <div class="qrcode-container active" id="wechatQR">
                    <img src="wechat-qr.JPG?t=${timestamp}" alt="微信支付">
                </div>
                <div class="qrcode-container" id="alipayQR">
                    <img src="alipay-qr.JPG?t=${timestamp}" alt="支付宝">
                </div>
            </div>
            <div class="amount-verify" style="margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <input type="number" step="0.01" placeholder="请输入实际支付金额" style="width: 150px; padding: 5px; margin-right: 10px;">
                <button class="verify-amount-btn" style="padding: 5px 10px;">验证支付</button>
            </div>
            <div class="payment-tip" style="color: #666; font-size: 13px;">请确保支付金额正确，并在支付完成后进行验证</div>
        </div>
    `;
    
    return modal;
}

// 修改下载按钮事件处理
downloadButton.addEventListener('click', async () => {
    // 检查是否有图片被选择
    const imageItems = document.querySelectorAll('.image-item');
    const hasPreviewImage = compressedImage.src && compressedImage.src !== '';
    
    // 如果既没有列表图片也没有预览图片，提示用户
    if (imageItems.length === 0 && !hasPreviewImage) {
        alert('请先选择图片再下载');
        return;
    }

    // 计算需要支付的金额
    const imageCount = imageItems.length || 1;
    const amount = (imageCount * PRICE_PER_IMAGE).toFixed(2);
    
    // 创建并显示支付弹窗
    const paymentModal = createPaymentModal();
    document.body.appendChild(paymentModal);
    
    // 更新所有显示金额的地方
    const amountElements = paymentModal.querySelectorAll('.payment-amount');
    amountElements.forEach(el => el.textContent = amount);
    
    // 绑定关闭按钮事件
    const closeBtn = paymentModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        paymentModal.remove();
    });
    
    // 绑定金额验证事件
    const verifyBtn = paymentModal.querySelector('.verify-amount-btn');
    const amountInput = paymentModal.querySelector('.amount-verify input');
    
    verifyBtn.addEventListener('click', () => {
        const expectedAmount = parseFloat(amount);
        const paidAmount = parseFloat(amountInput.value);
        
        if (isNaN(paidAmount)) {
            alert('请输入有效的支付金额');
            return;
        }
        
        // 允许支付金额大于等于所需金额，或者误差在0.01元以内
        if (paidAmount >= expectedAmount || Math.abs(paidAmount - expectedAmount) < 0.01) {
            paymentModal.remove();
            handleDownload();
        } else {
            alert('支付金额不正确，请确认后重试');
            amountInput.value = '';
        }
    });
    
    // 支付方式切换事件
    const paymentTabs = paymentModal.querySelectorAll('.payment-tab');
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            paymentTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const type = tab.dataset.type;
            paymentModal.querySelectorAll('.qrcode-container').forEach(qr => qr.classList.remove('active'));
            paymentModal.querySelector(`#${type}QR`).classList.add('active');
        });
    });
});

// 抽取下载逻辑为单独的函数
async function handleDownload() {
    const imageItems = document.querySelectorAll('.image-item');
    if (imageItems.length === 0) {
        const link = document.createElement('a');
        link.download = 'compressed-preview.jpg';
        link.href = compressedImage.src;
        link.click();
        return;
    }

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const item of imageItems) {
        const originalImg = item.querySelector('img');
        const compressed = await compressImage(originalImg);
        
        const link = document.createElement('a');
        link.download = `compressed-${originalImg.dataset.filename}`;
        link.href = compressed.url;
        link.click();
        
        URL.revokeObjectURL(compressed.url);
        await delay(100);
    }
}

// 修改多图片处理函数中的相关部分
async function handleMultipleImages(files) {
    const imagesList = document.getElementById('imagesList');
    
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const div = document.createElement('div');
            div.className = 'image-item';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.dataset.originalSize = file.size;
            img.dataset.filename = file.name;
            
            const info = document.createElement('div');
            info.className = 'info';
            
            // 等待图片加载完成后再压缩
            img.onload = async () => {
                const compressed = await compressImage(img);
                const originalSizeKB = (file.size / 1024).toFixed(2);
                const compressedSizeKB = (compressed.size / 1024).toFixed(2);
                const compressionRatio = (compressed.size / file.size * 100).toFixed(0);
                
                info.innerHTML = `
                    <span>原始大小: ${originalSizeKB} KB</span><br>
                    <span>压缩质量: ${qualitySlider.value}%</span><br>
                    <span>压缩后: ${compressedSizeKB} KB</span>
                `;
                
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.textContent = '下载压缩图片';
                downloadBtn.onclick = async () => {
                    // 计算需要支付的金额（每张图片0.1元）
                    const amount = PRICE_PER_IMAGE.toFixed(2);
                    
                    // 创建并显示支付弹窗
                    const paymentModal = createPaymentModal();
                    document.body.appendChild(paymentModal);
                    
                    // 更新所有显示金额的地方
                    const amountElements = paymentModal.querySelectorAll('.payment-amount');
                    amountElements.forEach(el => el.textContent = amount);
                    
                    // 绑定关闭按钮事件
                    const closeBtn = paymentModal.querySelector('.close');
                    closeBtn.addEventListener('click', () => {
                        paymentModal.remove();
                    });
                    
                    // 绑定金额验证事件
                    const verifyBtn = paymentModal.querySelector('.verify-amount-btn');
                    const amountInput = paymentModal.querySelector('.amount-verify input');
                    
                    verifyBtn.addEventListener('click', () => {
                        const expectedAmount = parseFloat(amount);
                        const paidAmount = parseFloat(amountInput.value);
                        
                        if (isNaN(paidAmount)) {
                            alert('请输入有效的支付金额');
                            return;
                        }
                        
                        // 允许支付金额大于等于所需金额，或者误差在0.01元以内
                        if (paidAmount >= expectedAmount || Math.abs(paidAmount - expectedAmount) < 0.01) {
                            paymentModal.remove();
                            // 下载当前图片
                            const link = document.createElement('a');
                            link.download = `compressed-${file.name}`;
                            link.href = compressed.url;
                            link.click();
                        } else {
                            alert('支付金额不正确，请确认后重试');
                            amountInput.value = '';
                        }
                    });
                    
                    // 支付方式切换事件
                    const paymentTabs = paymentModal.querySelectorAll('.payment-tab');
                    paymentTabs.forEach(tab => {
                        tab.addEventListener('click', () => {
                            paymentTabs.forEach(t => t.classList.remove('active'));
                            tab.classList.add('active');
                            const type = tab.dataset.type;
                            paymentModal.querySelectorAll('.qrcode-container').forEach(qr => qr.classList.remove('active'));
                            paymentModal.querySelector(`#${type}QR`).classList.add('active');
                        });
                    });
                };
                
                div.appendChild(img);
                div.appendChild(info);
                div.appendChild(downloadBtn);
                imagesList.appendChild(div);
            };
        };
        reader.readAsDataURL(file);
    }
}

// 修改压缩图片函数
async function compressImage(image) {
    return new Promise((resolve, reject) => {
        try {
            // 确保图片已经完全加载
            if (!image.complete || !image.naturalWidth) {
                reject(new Error('图片未完全加载'));
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 获取原始图片大小（以字节为单位）
            const originalSize = parseInt(image.dataset.originalSize);

            // 设置canvas尺寸为原图尺寸
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            ctx.drawImage(image, 0, 0);

            // 如果质量为100%，直接返回原图数据
            if (qualitySlider.value === '100') {
                canvas.toBlob(
                    (blob) => {
                        const url = URL.createObjectURL(blob);
                        resolve({
                            url: url,
                            size: originalSize
                        });
                    },
                    'image/jpeg',
                    1
                );
                return;
            }

            // 计算目标文件大小：基于用户设置的压缩质量百分比
            const targetSize = originalSize * (qualitySlider.value / 100);

            // 二分法查找合适的压缩质量
            let minQuality = 0.1; // 最小质量设为0.1，避免过度压缩
            let maxQuality = 1;
            let bestBlob = null;
            let bestUrl = null;
            let attempts = 0;
            const maxAttempts = 8; // 增加尝试次数以获得更精确的结果

            const tryCompress = (quality) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('压缩失败'));
                            return;
                        }

                        // 如果是第一次压缩，保存结果
                        if (!bestBlob) {
                            bestBlob = blob;
                            bestUrl = URL.createObjectURL(blob);
                        }

                        // 如果当前结果更接近目标大小，更新最佳结果
                        if (Math.abs(blob.size - targetSize) < Math.abs(bestBlob.size - targetSize)) {
                            if (bestUrl) {
                                URL.revokeObjectURL(bestUrl);
                            }
                            bestBlob = blob;
                            bestUrl = URL.createObjectURL(blob);
                        }

                        attempts++;
                        if (attempts >= maxAttempts || Math.abs(maxQuality - minQuality) < 0.01) {
                            // 返回最佳结果
                            resolve({
                                url: bestUrl,
                                size: bestBlob.size
                            });
                            return;
                        }

                        // 继续二分查找
                        if (blob.size > targetSize) {
                            maxQuality = quality;
                            tryCompress((minQuality + quality) / 2);
                        } else {
                            minQuality = quality;
                            tryCompress((maxQuality + quality) / 2);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            // 开始压缩，初始质量设为0.7
            tryCompress(0.7);
        } catch (error) {
            reject(error);
        }
    });
}

// 获取base64图片的实际大小
function getBase64Size(base64String) {
    const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
    const base64Length = base64String.substring(base64String.indexOf(',') + 1).length - padding;
    return Math.floor(base64Length * 0.75);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 在文件加载完成后调用初始化函数
document.addEventListener('DOMContentLoaded', initializeUI); 