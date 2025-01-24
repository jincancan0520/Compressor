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
let paymentConfirmed = false;

// 添加关闭按钮处理函数
function closeHandler() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        paymentModal.classList.add('hidden');
        // 移除模态框
        document.body.removeChild(paymentModal);
    }
}

// 创建付款弹窗
function createPaymentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'paymentModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close">×</button>
            <h3>支付提示</h3>
            <div class="payment-info">
                需要支付 <span class="payment-amount">0</span> 元
            </div>
            <div class="payment-tabs">
                <button class="payment-tab active" data-type="wechat">微信支付</button>
                <button class="payment-tab" data-type="alipay">支付宝</button>
            </div>
            <div class="payment-qrcodes">
                <div class="qrcode-container active" id="wechatQR">
                    <img src="wechat-qr.jpg" alt="微信支付">
                </div>
                <div class="qrcode-container" id="alipayQR">
                    <img src="alipay-qr.jpg" alt="支付宝">
                </div>
            </div>
            <button class="confirm-payment-btn">完成支付</button>
            <div class="payment-tip">支付完成后点击上方按钮下载图片</div>
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

    // 重置支付状态
    paymentConfirmed = false;
    
    // 创建并显示支付弹窗
    const paymentModal = createPaymentModal();
    document.body.appendChild(paymentModal);
    
    // 更新支付金额
    paymentModal.querySelector('.payment-amount').textContent = amount;
    
    // 绑定关闭按钮事件
    const closeBtn = paymentModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        paymentModal.remove();
    });
    
    // 绑定确认支付按钮事件
    const confirmBtn = paymentModal.querySelector('.confirm-payment-btn');
    confirmBtn.addEventListener('click', () => {
        paymentConfirmed = true;
        paymentModal.remove();
        handleDownload();
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
    if (!paymentConfirmed) {
        alert('请先完成支付');
        return;
    }

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

// 更新下载按钮的文本，反映实际功能
function updateDownloadButtonText() {
    const imageItems = document.querySelectorAll('.image-item');
    const downloadButton = document.getElementById('downloadButton');
    if (imageItems.length > 1) {
        downloadButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19V5M12 19L7 14M12 19L17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            下载所有压缩图片 (${imageItems.length}张)
        `;
    } else {
        downloadButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19V5M12 19L7 14M12 19L17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            下载压缩图片
        `;
    }
}

// 修改多图片处理函数中的相关部分
async function handleMultipleImages(files) {
    const imagesList = document.getElementById('imagesList');
    imagesList.innerHTML = ''; // 清空之前的图片列表
    
    // 创建一个加载所有图片的Promise数组
    const imagePromises = files.map((file, index) => {
        return new Promise((resolve) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            // 如果是第一张图片，添加选中状态
            if (index === 0) {
                imageItem.classList.add('selected');
            }
            
            // 创建预览容器
            const originalPreview = document.createElement('img');
            originalPreview.dataset.filename = file.name;
            originalPreview.dataset.originalSize = file.size;
            
            // 添加点击事件处理
            imageItem.addEventListener('click', () => {
                // 移除其他图片项的选中状态
                document.querySelectorAll('.image-item').forEach(item => {
                    item.classList.remove('selected');
                });
                // 添加当前图片的选中状态
                imageItem.classList.add('selected');
                // 更新预览区域
                handlePreviewImage(file);
            });

            const info = document.createElement('div');
            info.className = 'info';
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '下载压缩图片';
            
            imageItem.appendChild(originalPreview);
            imageItem.appendChild(info);
            imageItem.appendChild(downloadBtn);
            imagesList.appendChild(imageItem);
            
            // 读取并显示图片
            const reader = new FileReader();
            reader.onload = (e) => {
                originalPreview.src = e.target.result;
                originalPreview.dataset.originalSize = file.size;
                originalPreview.onload = async () => {
                    info.innerHTML = `
                        <span>原始大小: ${formatFileSize(file.size)}</span>
                        <span>压缩质量: ${qualitySlider.value}%</span>
                    `;
                    
                    try {
                        const compressed = await compressImage(originalPreview);
                        info.innerHTML += `<span>压缩后: ${formatFileSize(compressed.size)}</span>`;
                        
                        downloadBtn.disabled = false;
                        downloadBtn.onclick = () => {
                            const link = document.createElement('a');
                            link.download = `compressed-${file.name}`;
                            link.href = compressed.url;
                            link.click();
                            // 清理URL对象
                            URL.revokeObjectURL(compressed.url);
                        };
                        
                        resolve();
                    } catch (error) {
                        console.error('压缩图片失败:', error);
                        info.innerHTML += `<span style="color: red;">压缩失败</span>`;
                        resolve();
                    }
                };
            };
            reader.readAsDataURL(file);
        });
    });
    
    // 等待所有图片处理完成
    try {
        await Promise.all(imagePromises);
        console.log('所有图片处理完成');
        updateDownloadButtonText();
    } catch (error) {
        console.error('处理图片时发生错误:', error);
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