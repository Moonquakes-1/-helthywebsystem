// 表单验证通用函数
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;

    const requiredInputs = form.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('border-danger');
            isValid = false;
        } else {
            input.classList.remove('border-danger');
        }
    });

    if (!isValid) {
        alert('带*的字段不能为空！');
        return false;
    }

    return true;
}

// 更新购物车显示
function updateCartDisplay(count, totalPrice) {
    const cartCountEl = document.getElementById("cartCount");
    const cartTotalEl = document.getElementById("cartTotal");
    
    if (cartCountEl) {
        cartCountEl.textContent = count || 0;
    }
    if (cartTotalEl) {
        cartTotalEl.textContent = totalPrice ? `¥${totalPrice}` : '¥0';
    }
}

// 获取购物车信息
function getCartInfo() {
    fetch("/cart/info")
        .then(res => res.json())
        .then(data => {
            if (data.code === 0) {
                updateCartDisplay(data.count, data.total_price);
            }
        })
        .catch(error => {
            console.error("获取购物车信息失败:", error);
        });
}

// 加入购物车功能
function initAddToCart() {
    // 为每个.add-to-cart按钮添加事件监听器，确保不会重复绑定
    document.querySelectorAll(".add-to-cart").forEach(btn => {
        // 检查按钮是否已经绑定了事件监听器
        if (!btn.dataset.addToCartBound) {
            // 标记按钮为已绑定
            btn.dataset.addToCartBound = "true";
            
            btn.addEventListener("click", function(e) {
                // 阻止事件冒泡，防止触发卡片点击事件导致页面跳转
                e.stopPropagation();
                e.preventDefault();
                
                const productId = this.getAttribute("data-id");
                const productName = this.getAttribute("data-name");
                const productPrice = this.getAttribute("data-price");
                const productType = this.getAttribute("data-type") || "food";

                // 显示加载状态
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-1"></i> 添加中...';
                this.disabled = true;

                fetch("/add-to-cart", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: productId,
                        name: productName,
                        price: productPrice,
                        type: productType
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.code === 0) {
                        // 显示Toast提示
                        const toast = new bootstrap.Toast(document.getElementById("cartToast"));
                        
                        // 更新Toast内容
                        const toastBody = document.querySelector("#cartToast .toast-body");
                        if (toastBody) {
                            toastBody.innerHTML = `<i class="bi bi-check-circle me-2"></i>${data.msg}`;
                        }
                        
                        toast.show();
                        
                        // 更新购物车显示
                        updateCartDisplay(data.count, data.total_price);
                        
                        // 更新按钮状态（短暂显示成功状态）
                        this.innerHTML = '<i class="bi bi-check-circle me-1"></i> 已添加';
                        this.classList.remove('btn-success');
                        this.classList.add('btn-secondary');
                        
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.classList.remove('btn-secondary');
                            this.classList.add('btn-success');
                            this.disabled = false;
                        }, 2000);
                        
                    } else {
                        alert(data.msg);
                        if (data.code === -1) {
                            window.location.href = "/login";
                        } else {
                            this.innerHTML = originalText;
                            this.disabled = false;
                        }
                    }
                })
                .catch(error => {
                    console.error("添加购物车失败:", error);
                    alert("网络错误，请重试");
                    this.innerHTML = originalText;
                    this.disabled = false;
                });
            });
        }
    });
}

// 初始化购物车数量
function initCartCount() {
    getCartInfo();
}

// 购物车数量操作
function initCartQuantityControls() {
    document.querySelectorAll(".cart-quantity-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const productId = this.getAttribute("data-id");
            const action = this.getAttribute("data-action");
            const quantityEl = document.getElementById(`quantity-${productId}`);
            
            fetch("/update-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: productId,
                    operation: action
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.code === 0) {
                    // 更新页面显示
                    updateCartDisplay(data.count, data.total_price);
                    
                    // 如果是删除操作，移除商品行
                    if (action === "remove") {
                        document.getElementById(`cart-item-${productId}`).remove();
                    } else {
                        // 更新数量显示
                        if (quantityEl) {
                            const currentQuantity = parseInt(quantityEl.textContent);
                            if (action === "increase") {
                                quantityEl.textContent = currentQuantity + 1;
                            } else if (action === "decrease") {
                                quantityEl.textContent = currentQuantity - 1;
                            }
                        }
                    }
                    
                    // 更新总价显示
                    const totalPriceEl = document.getElementById("totalPrice");
                    if (totalPriceEl) {
                        totalPriceEl.textContent = `¥${data.total_price}`;
                    }
                    
                    // 如果购物车为空，显示空购物车提示
                    if (data.count === 0) {
                        location.reload(); // 简单重载页面显示空状态
                    }
                } else {
                    alert(data.msg);
                }
            })
            .catch(error => {
                console.error("更新购物车失败:", error);
                alert("网络错误，请重试");
            });
        });
    });
}



// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 表单验证
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // 特殊处理登录表单，确保重定向参数正确设置
            if (this.id === 'loginForm') {
                const modal = document.getElementById('loginModal');
                if (modal && modal.dataset.redirect) {
                    const redirectInput = this.querySelector('input[name="redirect"]');
                    if (redirectInput) {
                        redirectInput.value = modal.dataset.redirect;
                    }
                }
            }
            
            if (!validateForm(form.id)) {
                e.preventDefault();
            }
        });
    });

    // 搜索框回车提交
    const searchInputs = document.querySelectorAll('.search-input, .form-control[placeholder*="搜索"]');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const parent = this.parentElement;
                parent.querySelector('.btn, .search-btn')?.click();
            }
        });
    });

    // 城市筛选
    const citySelect = document.querySelector('.city-select');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            window.location.href = `/gym?city=${this.value}`;
        });
    }

    // 数字输入限制
    const numberInputs = document.querySelectorAll('input[type="number"], .number-input');
    numberInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9.]/g, '');
        });
    });

    // 初始化加入购物车功能
    initAddToCart();
    
    // 初始化购物车数量显示
    initCartCount();
    initCartQuantityControls();

    // 提交订单功能（购物车页面）
    const submitOrderBtn = document.getElementById("submitOrder");
    if (submitOrderBtn) {
        submitOrderBtn.addEventListener("click", function() {
            if (!confirm("确认提交订单吗？")) {
                return;
            }
            
            // 显示加载状态
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-1"></i> 提交中...';
            this.disabled = true;

            fetch("/order/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.code === 0) {
                    alert(`订单提交成功！\n订单号：${data.order_no}\n总金额：¥${data.total_price}`);
                    window.location.href = "/orders";
                } else {
                    alert(data.msg);
                    this.innerHTML = originalText;
                    this.disabled = false;
                }
            })
            .catch(error => {
                console.error("提交订单失败:", error);
                alert("网络错误，请重试");
                this.innerHTML = originalText;
                this.disabled = false;
            });
        });
    }

    // 清空购物车功能
    const clearCartBtn = document.getElementById("clearCart");
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", function() {
            if (!confirm("确定要清空购物车吗？")) {
                return;
            }
            window.location.href = "/cart/clear";
        });
    }
});

// 定期更新购物车信息（防止session过期）
setInterval(() => {
    if (document.getElementById("cartCount")) {
        getCartInfo();
    }
}, 30000); // 每30秒更新一次