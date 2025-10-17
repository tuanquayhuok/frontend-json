// ============================================
// TUANSTORE - JAVASCRIPT FILE
// ============================================

console.log('TuanStore loaded');

// ============================================
// GLOBAL VARIABLES
// ============================================
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let productsData = [];
let productsLoadedResolve;
const productsLoaded = new Promise(resolve => { productsLoadedResolve = resolve; });

// ============================================
// UI FUNCTIONS
// ============================================

// Show notification
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Initialize banner slider
function initSlider() {
    const slider = document.querySelector('.banner-slider');
    const slides = document.querySelectorAll('.banner-slide');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const dots = document.querySelectorAll('.slider-dot');
    
    if (!slider || slides.length === 0) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    slides[0].classList.add('active');
    if (dots[0]) dots[0].classList.add('active');
    
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        
        currentSlide = (currentSlide + 1) % totalSlides;
        
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }
    
    function prevSlide() {
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }
    
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            
            currentSlide = index;
            
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        });
    });
    
    setInterval(nextSlide, 5000);
}

// Initialize mobile menu
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : 'auto';
        });
    }
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu) {
                navMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navMenu && navMenu.classList.contains('active')) {
            if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }
    });
    
    // Close mobile menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navMenu) {
            navMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// Back to top functionality
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ============================================
// PRODUCTS FUNCTIONS
// ============================================

// Load products from API
function loadProducts() {
    console.log('Loading products...');
    
    // Try multiple endpoints for better compatibility
    const endpoints = [
        'https://my-json-server.typicode.com/tuanquayhuok/backend-json/products'
    ];
    
    let currentEndpoint = 0;
    
    function tryLoadFromEndpoint() {
        if (currentEndpoint >= endpoints.length) {
            console.error('All endpoints failed');
            showNotification('Không thể tải sản phẩm! Vui lòng kiểm tra kết nối mạng.', 'error');
            return;
        }
        
        const endpoint = endpoints[currentEndpoint];
        console.log(`Trying endpoint: ${endpoint}`);
        
        fetch(endpoint)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Handle different response formats
                if (Array.isArray(data)) {
                    productsData = data;
                } else if (data.products && Array.isArray(data.products)) {
                    productsData = data.products;
                } else {
                    throw new Error('Invalid data format');
                }
                
                console.log('Products loaded successfully:', productsData.length);
                renderProducts();
                if (productsLoadedResolve) productsLoadedResolve();
                
                // Initialize filter buttons after products are loaded
                setTimeout(() => {
                    initializeFilterButtons();
                }, 100);
                
                showNotification(`Đã tải ${productsData.length} sản phẩm thành công!`, 'success');
            })
            .catch(error => {
                console.error(`Error loading from ${endpoint}:`, error);
                currentEndpoint++;
                setTimeout(tryLoadFromEndpoint, 500);
            });
    }
    
    tryLoadFromEndpoint();
}

// ========================================
// HÀM RENDER DANH SÁCH SẢN PHẨM
// ========================================
// Hàm này tạo HTML cho tất cả sản phẩm và hiển thị lên trang
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.error('Products grid not found!');
        return;
    }
    
    productsGrid.innerHTML = productsData.map(product => `
        <div class="product-card" onclick="window.location.href='detail.html?id=${product.id}'">
            <!-- ===== CLICK VÀO CARD = XEM CHI TIẾT =====
                 Khi click vào bất kỳ đâu trên card sản phẩm, 
                 sẽ chuyển đến trang detail.html và truyền ID sản phẩm qua URL
                 VÍ DỤ: detail.html?id=1 (cho iPhone 17 Pro)
            ============================================ -->
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" 
                     style="width: 100%; height: 100%; object-fit: contain;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 4rem; color: #ccc;">📱</div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-rating">
                    ${'★'.repeat(Math.floor(product.rating))} ${product.rating}/5 (${product.reviews} đánh giá)
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                    
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); window.location.href='detail.html?id=${product.id}'">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                </div>
                
            </div>
        </div>
    `).join('');
}

// ========================================
// HÀM MỞ TRANG CHI TIẾT SẢN PHẨM
// ========================================
// Hàm này được gọi khi click vào sản phẩm hoặc nút "Xem chi tiết"
// Nó sẽ chuyển sang trang detail.html và truyền ID sản phẩm qua URL
function openProductModal(productId) {
    window.location.href = `detail.html?id=${productId}`;
}

// Filter products by category
function filterProducts(category) {
    console.log('Filtering products by category:', category);
    console.log('Available products:', productsData.length);
    
    if (!productsData || productsData.length === 0) {
        console.log('No products data available yet');
        showNotification('Đang tải sản phẩm, vui lòng thử lại sau...', 'warning');
        return;
    }
    
    let filteredProducts;
    if (category === 'all') {
        filteredProducts = productsData;
    } else {
        filteredProducts = productsData.filter(product => 
            product.category.toLowerCase() === category.toLowerCase()
        );
    }
    
    console.log('Filtered products count:', filteredProducts.length);
    displayFilteredProducts(filteredProducts);
    
    // Show notification
    if (category === 'all') {
        showNotification(`Hiển thị tất cả ${filteredProducts.length} sản phẩm`, 'info');
    } else {
        showNotification(`Hiển thị ${filteredProducts.length} sản phẩm ${category}`, 'info');
    }
}

// Display filtered products
function displayFilteredProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="window.location.href='detail.html?id=${product.id}'">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" 
                     style="width: 100%; height: 100%; object-fit: contain;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 4rem; color: #ccc;">📱</div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-rating">
                    ${'★'.repeat(Math.floor(product.rating))} ${product.rating}/5 (${product.reviews} đánh giá)
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); window.location.href='detail.html?id=${product.id}'">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                </div>
                
            </div>
        </div>
    `).join('');
}

// ============================================
// CART FUNCTIONS
// ============================================

// Toggle cart sidebar
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    if (cartSidebar && cartOverlay) {
        if (cartSidebar.classList.contains('open') || cartSidebar.classList.contains('active')) {
            cartSidebar.classList.remove('open', 'active');
            cartOverlay.classList.remove('active');
            cartOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        } else {
            cartSidebar.classList.add('open', 'active');
            cartOverlay.classList.add('active');
            cartOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
            updateCartDisplay();
        }
    }
}

// ========================================
// HÀM CẬP NHẬT SỐ LƯỢNG SẢN PHẨM TRÊN ICON GIỎ HÀNG
// ========================================
// Hàm này tính tổng số lượng sản phẩm trong giỏ hàng và hiển thị số đó
// lên badge (số nhỏ màu đỏ) ở góc icon giỏ hàng trên header
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
        cartCount.setAttribute('data-count', totalItems);
        // Do not touch transform here to avoid overriding CSS translate positioning
        // Keep simple visibility toggle only
    }
}

// ========================================
// HÀM HIỂN THỊ DANH SÁCH SẢN PHẨM TRONG GIỎ HÀNG
// ========================================
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems || !cartTotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Giỏ hàng trống</p>';
        cartTotal.innerHTML = '<p style="text-align: center; font-weight: 600; color: #333;">Tổng: 0₫</p>';
    } else {
        cartItems.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            return `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 1.5rem; color: #ccc;">📱</div>
                    </div>
                    <div class="cart-item-info">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <p class="cart-item-price">${formatPrice(item.price)}</p>
                        <div class="cart-item-quantity">
                            <span>Số lượng: <strong>${item.quantity}</strong></span>
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <span class="quantity-number">${item.quantity}</span>
                                <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <p class="cart-item-total">Thành tiền: <strong style="color: #ff4757;">${formatPrice(itemTotal)}</strong></p>
                    </div>
                    <button onclick="removeFromCart(${item.id})" class="remove-item" style="background: #ff4757; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 1.2rem;">×</button>
                </div>
            `;
        }).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.innerHTML = `
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Tạm tính:</span>
                    <span>${formatPrice(total)}</span>
                </div>
                <div class="summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>30.000₫</span>
                </div>
                <div class="summary-row total">
                    <span>Tổng cộng:</span>
                    <span>${formatPrice(total + 30000)}</span>
                </div>
            </div>
        `;
    }
}

// ========================================
// HÀM CẬP NHẬT SỐ LƯỢNG SẢN PHẨM TRONG GIỎ HÀNG
// ========================================
// Được gọi khi người dùng nhấn nút + hoặc - trong giỏ hàng
function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartDisplay();
    }
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
}

// Go to checkout
function goToCheckout() {
    if (cart.length === 0) {
        showNotification('Giỏ hàng trống!', 'error');
        return;
    }
    
    window.location.href = 'checkout.html';
}

// ========================================
// HÀM THÊM SẢN PHẨM VÀO GIỎ HÀNG
// ========================================
// Đây là hàm CHÍNH để thêm sản phẩm vào giỏ hàng
// Được gọi khi người dùng click nút "Thêm vào giỏ" trên card sản phẩm
function addToCart(productId) {
    console.log('Adding to cart:', productId);
    
    productsLoaded.then(() => {
        // Sửa lỗi: ID từ API là string, nhưng productId có thể là number
        const product = productsData.find(p => p.id == productId || parseInt(p.id) === productId);
        
        if (!product) {
            showNotification('Không tìm thấy sản phẩm!', 'error');
            return;
        }
        
        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const existingItem = cart.find(item => item.id == productId || parseInt(item.id) === productId);
        
        if (existingItem) {
            // NẾU ĐÃ CÓ: Tăng số lượng lên 1
            existingItem.quantity += 1;
        } else {
            // NẾU CHƯA CÓ: Thêm sản phẩm mới vào giỏ với số lượng = 1
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1,
                category: product.category
            });
        }
        
        // Cập nhật giỏ hàng vào localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // CẬP NHẬT SỐ LƯỢNG trên icon giỏ hàng (badge màu đỏ)
        updateCartCount();
        
        // Cập nhật danh sách sản phẩm trong sidebar giỏ hàng
        updateCartDisplay();
        
        showNotification(`Đã thêm ${product.name} vào giỏ hàng!`, 'success');
    });
}

// ============================================
// WISHLIST FUNCTIONS
// ============================================

// Toggle wishlist
function toggleWishlist(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) {
        showNotification('Không tìm thấy sản phẩm!', 'error');
        return;
    }
    
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        // Remove from wishlist
        wishlist.splice(index, 1);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        showNotification(`Đã bỏ ${product.name} khỏi yêu thích`, 'info');
    } else {
        // Add to wishlist
        wishlist.push(productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        showNotification(`Đã thêm ${product.name} vào yêu thích`, 'success');
    }
    
    // Update wishlist display
    updateWishlistDisplay();
    // Re-render products to update button states
    renderProducts();
}

// Update wishlist count in header
function updateWishlistDisplay() {
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
        wishlistCount.style.display = wishlist.length > 0 ? 'block' : 'none';
    }
}

// Show wishlist modal
function showWishlistModal() {
    if (wishlist.length === 0) {
        showNotification('Chưa có sản phẩm nào trong danh sách yêu thích!', 'warning');
        return;
    }
    
    const wishlistProducts = wishlist.map(id => 
        productsData.find(p => p.id === id)
    ).filter(p => p);
    
    if (wishlistProducts.length === 0) {
        showNotification('Không có sản phẩm nào trong danh sách yêu thích!', 'error');
        return;
    }
    
    const modalHTML = `
        <div id="wishlistModal" class="wishlist-modal">
            <div class="wishlist-modal-content">
                <div class="wishlist-header">
                    <h2>Sản phẩm yêu thích (${wishlistProducts.length})</h2>
                    <button class="close-wishlist" onclick="closeWishlistModal()">&times;</button>
                </div>
                <div class="wishlist-items">
                    ${wishlistProducts.map(product => `
                        <div class="wishlist-item">
                            <div class="item-image">
                                <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
                            </div>
                            <div class="item-details">
                                <h3>${product.name}</h3>
                                <div class="item-price">${formatPrice(product.price)}</div>
                                <div class="item-rating">
                                    ${'★'.repeat(Math.floor(product.rating))} ${product.rating}/5 (${product.reviews} đánh giá)
                                </div>
                            </div>
                            <div class="item-actions">
                                <button class="btn btn-primary" onclick="addToCart(${product.id})">
                                    <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                                </button>
                                <button class="btn btn-secondary" onclick="window.location.href='detail.html?id=${product.id}'">
                                    <i class="fas fa-eye"></i> Xem chi tiết
                                </button>
                                <button class="btn btn-danger" onclick="toggleWishlist(${product.id}); closeWishlistModal(); setTimeout(() => showWishlistModal(), 300);">
                                    <i class="fas fa-heart-broken"></i> Bỏ yêu thích
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="wishlist-actions">
                    <button class="btn btn-secondary" onclick="clearWishlist()">
                        <i class="fas fa-trash"></i> Xóa tất cả
                    </button>
                    <button class="btn btn-primary" onclick="addAllWishlistToCart()">
                        <i class="fas fa-cart-plus"></i> Thêm tất cả vào giỏ
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    setTimeout(() => {
        const modal = document.getElementById('wishlistModal');
        if (modal) {
            modal.classList.add('show');
        }
    }, 10);
}

// Close wishlist modal
function closeWishlistModal() {
    const modal = document.getElementById('wishlistModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Clear wishlist
function clearWishlist() {
    wishlist = [];
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistDisplay();
    closeWishlistModal();
    renderProducts();
    showNotification('Đã xóa tất cả sản phẩm khỏi yêu thích', 'info');
}

// Add all wishlist products to cart
function addAllWishlistToCart() {
    let addedCount = 0;
    wishlist.forEach(productId => {
        const product = productsData.find(p => p.id === productId);
        if (product) {
            addToCart(productId);
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        showNotification(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng!`, 'success');
    }
}

// ============================================
// COMPARE FUNCTIONS
// ============================================

// Toggle compare
function toggleCompare(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) {
        showNotification('Không tìm thấy sản phẩm!', 'error');
        return;
    }
    
    const index = compareList.indexOf(productId);
    if (index > -1) {
        // Remove from compare
        compareList.splice(index, 1);
        localStorage.setItem('compareList', JSON.stringify(compareList));
        showNotification(`Đã bỏ ${product.name} khỏi danh sách so sánh`, 'info');
    } else {
        // Check if compare list is full (max 4 products)
        if (compareList.length >= 4) {
            showNotification('Chỉ có thể so sánh tối đa 4 sản phẩm!', 'warning');
            return;
        }
        
        // Add to compare
        compareList.push(productId);
        localStorage.setItem('compareList', JSON.stringify(compareList));
        showNotification(`Đã thêm ${product.name} vào danh sách so sánh`, 'success');
    }
    
    // Update compare display
    updateCompareDisplay();
    // Re-render products to update button states
    renderProducts();
}

// Update compare count in header
function updateCompareDisplay() {
    const compareCount = document.getElementById('compareCount');
    if (compareCount) {
        compareCount.textContent = compareList.length;
        compareCount.style.display = compareList.length > 0 ? 'block' : 'none';
    }
}

// Show compare modal
function showCompareModal() {
    if (compareList.length === 0) {
        showNotification('Chưa có sản phẩm nào để so sánh!', 'warning');
        return;
    }
    
    // Create compare modal HTML
    const compareProducts = compareList.map(id => 
        productsData.find(p => p.id === id)
    ).filter(p => p);
    
    if (compareProducts.length === 0) {
        showNotification('Không có sản phẩm nào để so sánh!', 'error');
        return;
    }
    
    const modalHTML = `
        <div id="compareModal" class="compare-modal">
            <div class="compare-modal-content">
                <div class="compare-header">
                    <h2>So sánh sản phẩm (${compareProducts.length}/4)</h2>
                    <button class="close-compare" onclick="closeCompareModal()">&times;</button>
                </div>
                <div class="compare-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Tính năng</th>
                                ${compareProducts.map(product => `
                                    <th>
                                        <div class="compare-product-header">
                                            <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
                                            <h3>${product.name}</h3>
                                            <div class="compare-price">${formatPrice(product.price)}</div>
                                            <button onclick="removeFromCompare(${product.id})" class="btn-remove-compare">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Thương hiệu</td>
                                ${compareProducts.map(p => `<td>${p.brand || 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>Danh mục</td>
                                ${compareProducts.map(p => `<td>${p.category || 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>Đánh giá</td>
                                ${compareProducts.map(p => `<td>${p.rating || 'N/A'}/5 (${p.reviews || 0} đánh giá)</td>`).join('')}
                            </tr>
                            <tr>
                                <td>Màn hình</td>
                                ${compareProducts.map(p => `<td>${p.screenSize || p.specifications?.Màn_hình || 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>Chip/CPU</td>
                                ${compareProducts.map(p => `<td>${p.chip || p.specifications?.CPU || 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>RAM</td>
                                ${compareProducts.map(p => `<td>${p.ram || p.specifications?.RAM || 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td>Dung lượng</td>
                                ${compareProducts.map(p => `<td>${p.storageOptions?.[0]?.size || p.specifications?.ROM || 'N/A'}</td>`).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="compare-actions">
                    <button class="btn btn-secondary" onclick="clearCompareList()">
                        <i class="fas fa-trash"></i> Xóa tất cả
                    </button>
                    <button class="btn btn-primary" onclick="addAllToCart()">
                        <i class="fas fa-cart-plus"></i> Thêm tất cả vào giỏ
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    setTimeout(() => {
        const modal = document.getElementById('compareModal');
        if (modal) {
            modal.classList.add('show');
        }
    }, 10);
}

// Close compare modal
function closeCompareModal() {
    const modal = document.getElementById('compareModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Remove from compare
function removeFromCompare(productId) {
    const index = compareList.indexOf(productId);
    if (index > -1) {
        compareList.splice(index, 1);
        localStorage.setItem('compareList', JSON.stringify(compareList));
        updateCompareDisplay();
        
        // Re-render compare modal if open
        const modal = document.getElementById('compareModal');
        if (modal) {
            closeCompareModal();
            setTimeout(() => {
                if (compareList.length > 0) {
                    showCompareModal();
                }
            }, 300);
        }
        
        // Re-render products
        renderProducts();
    }
}

// Clear compare list
function clearCompareList() {
    compareList = [];
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareDisplay();
    closeCompareModal();
    renderProducts();
    showNotification('Đã xóa tất cả sản phẩm khỏi danh sách so sánh', 'info');
}

// Add all compared products to cart
function addAllToCart() {
    let addedCount = 0;
    compareList.forEach(productId => {
        const product = productsData.find(p => p.id === productId);
        if (product) {
            addToCart(productId);
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        showNotification(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng!`, 'success');
    }
}

// ============================================
// SEARCH FUNCTIONS
// ============================================

// Perform search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderProducts();
        return;
    }
    
    // Wait for products to load if not ready
    if (!productsData || productsData.length === 0) {
        showNotification('Đang tải sản phẩm, vui lòng thử lại sau...', 'warning');
        return;
    }
    
    const filteredProducts = productsData.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.category && product.category.toLowerCase().includes(searchTerm)) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
    );
    
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        if (filteredProducts.length > 0) {
            displayFilteredProducts(filteredProducts);
            showNotification(`Tìm thấy ${filteredProducts.length} sản phẩm cho "${searchTerm}"`, 'success');
        } else {
            productsGrid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>Không tìm thấy sản phẩm</h3>
                    <p>Không có sản phẩm nào phù hợp với từ khóa "<strong>${searchTerm}</strong>"</p>
                    <button class="btn btn-primary" onclick="renderProducts()">
                        <i class="fas fa-refresh"></i> Hiển thị tất cả sản phẩm
                    </button>
                </div>
            `;
            
            showNotification(`Không tìm thấy sản phẩm nào cho "${searchTerm}"`, 'warning');
        }
    }
}

// Show search suggestions
function showSearchSuggestions() {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer) return;
    
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    // Generate suggestions based on product names and categories
    const suggestions = [];
    if (productsData && productsData.length > 0) {
        const productNames = productsData.map(p => p.name).filter(name => 
            name.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        
        const categories = [...new Set(productsData.map(p => p.category))].filter(cat => 
            cat && cat.toLowerCase().includes(searchTerm)
        ).slice(0, 3);
        
        suggestions.push(...productNames, ...categories);
    }
    
    if (suggestions.length > 0) {
        const suggestionsContent = document.getElementById('suggestionsContent');
        suggestionsContent.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">
                <i class="fas fa-search"></i>
                <span>${suggestion}</span>
            </div>
        `).join('');
        suggestionsContainer.style.display = 'block';
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

// Hide search suggestions
function hideSearchSuggestions() {
    setTimeout(() => {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }, 200);
}

// Select search suggestion
function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = suggestion;
        performSearch();
    }
    hideSearchSuggestions();
}

// Handle search input
function handleSearchInput(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm.length >= 2) {
        showSearchSuggestions();
    } else {
        hideSearchSuggestions();
    }
    
    // Auto-search as user types (with debounce)
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        if (searchTerm.length >= 3) {
            performSearch();
        } else if (searchTerm.length === 0) {
            renderProducts();
        }
    }, 500);
}

// ============================================
// FILTER FUNCTIONS
// ============================================

// Apply sidebar filters (price, brand, sort)
function applySidebarFilters() {
    let filtered = [...productsData];
    
    // Get selected price ranges
    const selectedPrices = [];
    const priceCheckboxes = document.querySelectorAll('.price-range-filter input[type="checkbox"]:checked');
    priceCheckboxes.forEach(checkbox => {
        const value = checkbox.value;
        const [min, max] = value.split('-').map(Number);
        selectedPrices.push({ min, max });
    });
    
    // Filter by price
    if (selectedPrices.length > 0) {
        filtered = filtered.filter(product => {
            const price = product.price || 0;
            return selectedPrices.some(range => price >= range.min && price <= range.max);
        });
    }
    
    // Get selected brands
    const selectedBrands = [];
    const brandCheckboxes = document.querySelectorAll('.brand-filter input[type="checkbox"]:checked');
    brandCheckboxes.forEach(checkbox => {
        selectedBrands.push(checkbox.value.toLowerCase());
    });
    
    // Filter by brand
    if (selectedBrands.length > 0) {
        filtered = filtered.filter(product => {
            return product.brand && selectedBrands.includes(product.brand.toLowerCase());
        });
    }
    
    // Get selected sort option
    const selectedSort = document.querySelector('.sort-filter input[type="radio"]:checked');
    if (selectedSort) {
        const sortValue = selectedSort.value;
        
        switch (sortValue) {
            case 'price-low':
                filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price-high':
                filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'name':
                filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
        }
    }
    
    displayFilteredProducts(filtered);
    
    const filterCount = selectedPrices.length + selectedBrands.length;
    if (filterCount > 0) {
        showNotification(`Đã lọc ${filtered.length} sản phẩm`, 'info');
    }
}

// Reset filters
function resetFilters() {
    renderProducts();
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    filterBtns[0].classList.add('active');
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        if (radio.value === 'default') radio.checked = true;
        else radio.checked = false;
    });
    
    showNotification(`Hiển thị tất cả ${productsData.length} sản phẩm`, 'info');
}

// Initialize filter buttons
function initializeFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    console.log('Initializing filter buttons:', filterBtns.length);
    
    if (filterBtns.length === 0) {
        console.log('No filter buttons found, retrying...');
        setTimeout(initializeFilterButtons, 500);
        return;
    }
    
    filterBtns.forEach(btn => {
        // Remove existing event listeners
        btn.replaceWith(btn.cloneNode(true));
    });
    
    // Re-select after cloning
    const newFilterBtns = document.querySelectorAll('.filter-btn');
    newFilterBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Filter button clicked:', this.textContent);
            
            // Remove active class from all buttons
            newFilterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            console.log('Category to filter:', category);
            
            if (category) {
                filterProducts(category);
            }
        });
    });
    
    console.log('Filter buttons initialized successfully');
}

// ============================================
// ORDER HISTORY
// ============================================

// Switch cart tab
window.switchCartTab = function(tab) {
    document.querySelectorAll('.cart-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchCartTab('${tab}')"]`).classList.add('active');
    
    document.querySelectorAll('.cart-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tab === 'cart') {
        document.getElementById('cartContent').classList.add('active');
    } else if (tab === 'history') {
        document.getElementById('historyContent').classList.add('active');
        loadOrderHistory();
    }
};

// Load order history
window.loadOrderHistory = function() {
    const orderHistory = document.getElementById('orderHistory');
    const orders = JSON.parse(localStorage.getItem('orderHistory')) || [];
    
    if (orders.length === 0) {
        orderHistory.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <h3>Chưa có đơn hàng nào</h3>
                <p>Lịch sử đơn hàng của bạn sẽ hiển thị ở đây</p>
            </div>
        `;
        return;
    }
    
    fetch('db.json')
        .then(response => response.json())
        .then(data => {
            const products = data.products || data;
            
            orderHistory.innerHTML = orders.map(order => {
                const orderItems = order.items.map(item => {
                    const product = products.find(p => p.id === item.id);
                    if (product) {
                        return `
                            <div class="order-item">
                                <div class="order-item-image">
                                    <img src="${product.image}" alt="${product.name}">
                                </div>
                                <div class="order-item-details">
                                    <div class="order-item-name">${product.name}</div>
                                    <div class="order-item-quantity">Số lượng: ${item.quantity}</div>
                                </div>
                            </div>
                        `;
                    }
                    return '';
                }).join('');
                
                return `
                    <div class="order-history-item">
                        <div class="order-history-header">
                            <div>
                                <div class="order-number">Đơn hàng #${order.orderNumber}</div>
                                <div class="order-date">${new Date(order.date).toLocaleDateString('vi-VN')}</div>
                            </div>
                            <span class="order-status ${order.status}">${order.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}</span>
                        </div>
                        <div class="order-items">
                            ${orderItems}
                        </div>
                        <div class="order-total">
                            <span>Tổng cộng:</span>
                            <span>${formatPrice(order.total)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        })
        .catch(error => {
            console.error('Error loading order history:', error);
        });
};

// ============================================
// NEWSLETTER SUBSCRIPTION
// ============================================
window.subscribeNewsletter = function(event) {
    event.preventDefault();
    
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value.trim();
    
    if (!email) {
        showNotification('Vui lòng nhập email!', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Email không hợp lệ!', 'error');
        return;
    }
    
    let subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers')) || [];
    
    if (subscribers.includes(email)) {
        showNotification('Email này đã đăng ký nhận tin!', 'warning');
        return;
    }
    
    subscribers.push(email);
    localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
    
    showNotification('Đăng ký nhận tin thành công! Cảm ơn bạn đã đăng ký.', 'success');
    
    emailInput.value = '';
};

// ============================================
// MAIN INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing...');
    
    // Initialize cart
    updateCartCount();
    
    // Load products
    loadProducts();
    
    // Test cart count with sample data (remove this in production)
    setTimeout(() => {
        if (cart.length === 0) {
            // Add some test items to cart for demonstration
            cart = [
                { id: 1, name: "iPhone 17 Pro", price: 32990000, image: "image/ip17.jpg", quantity: 5, category: "Điện thoại" },
                { id: 2, name: "iPhone 17 Pro Max", price: 36990000, image: "image/17prm.png", quantity: 3, category: "Điện thoại" },
                { id: 3, name: "MacBook Pro M3", price: 45990000, image: "image/maytinh1.webp", quantity: 2, category: "Máy tính" }
            ];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            console.log('Test cart items added. Total items:', cart.reduce((sum, item) => sum + item.quantity, 0));
        }
    }, 2000);
    
    // Initialize UI components
    setTimeout(() => {
        initSlider();
    }, 200);
    
    initMobileMenu();
    initBackToTop();
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'cart') {
            cart = JSON.parse(e.newValue || '[]');
            updateCartCount();
            updateCartDisplay();
        }
    });
    
    // Initialize cart event listeners
    const cartIcon = document.querySelector('.cart-icon');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.querySelector('.close-cart');
    
    if (cartIcon && cartSidebar) {
        cartIcon.addEventListener('click', function() {
            cartSidebar.classList.add('active');
            updateCartDisplay();
        });
    }
    
    if (closeCart && cartSidebar) {
        closeCart.addEventListener('click', function() {
            cartSidebar.classList.remove('active');
        });
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', function() {
            cartSidebar.classList.remove('active');
            cartOverlay.style.display = 'none';
        });
    }
    
    // Initialize search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
    
    // Initialize filter buttons after products are loaded
    setTimeout(() => {
        initializeFilterButtons();
    }, 1000); // Wait 1 second for products to load
    
    // Initialize brand filter links
    const brandLinks = document.querySelectorAll('.brand-dropdown a');
    brandLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const brand = this.getAttribute('data-brand');
            if (brand) {
                const filteredProducts = productsData.filter(product => 
                    product.brand && product.brand.toLowerCase() === brand.toLowerCase()
                );
                displayFilteredProducts(filteredProducts);
                showNotification(`Hiển thị sản phẩm ${brand}`, 'info');
            }
        });
    });
    
    // Initialize sidebar filters
    const priceCheckboxes = document.querySelectorAll('.price-range-filter input[type="checkbox"]');
    priceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applySidebarFilters);
    });
    
    const brandCheckboxes = document.querySelectorAll('.brand-filter input[type="checkbox"]');
    brandCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applySidebarFilters);
    });
    
    const sortRadios = document.querySelectorAll('.sort-filter input[type="radio"]');
    sortRadios.forEach(radio => {
        radio.addEventListener('change', applySidebarFilters);
    });
    
    console.log('Application initialized successfully');
});

// ============================================
// EXPORT FUNCTIONS TO WINDOW
// ============================================
window.showNotification = showNotification;
window.formatPrice = formatPrice;
window.openProductModal = openProductModal;
window.toggleCart = toggleCart;
window.updateCartCount = updateCartCount;
window.updateCartDisplay = updateCartDisplay;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.goToCheckout = goToCheckout;
window.addToCart = addToCart;
window.performSearch = performSearch;
window.showSearchSuggestions = showSearchSuggestions;
window.hideSearchSuggestions = hideSearchSuggestions;
window.selectSuggestion = selectSuggestion;
window.handleSearchInput = handleSearchInput;
window.filterProducts = filterProducts;
window.applySidebarFilters = applySidebarFilters;
window.resetFilters = resetFilters;
window.renderProducts = renderProducts;
window.initializeFilterButtons = initializeFilterButtons;

// Export wishlist and compare functions
window.toggleWishlist = toggleWishlist;
window.updateWishlistDisplay = updateWishlistDisplay;
window.showWishlistModal = showWishlistModal;
window.closeWishlistModal = closeWishlistModal;
window.clearWishlist = clearWishlist;
window.addAllWishlistToCart = addAllWishlistToCart;

window.toggleCompare = toggleCompare;
window.updateCompareDisplay = updateCompareDisplay;
window.showCompareModal = showCompareModal;
window.closeCompareModal = closeCompareModal;
window.removeFromCompare = removeFromCompare;
window.clearCompareList = clearCompareList;
window.addAllToCart = addAllToCart;

console.log('All functions loaded and exported successfully');
