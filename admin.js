// Admin Panel JavaScript
let products = [];
let orders = [];
let currentEditingProduct = null;
let deleteProductId = null;

// Domain model for Product
class Product {
    constructor({ id, name, brand, category, price, rating = 4.0, reviews = 0, image, description = '', specifications = {}, thumbnails = [] }) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.category = category;
        this.price = price;
        this.rating = rating;
        this.reviews = reviews;
        this.image = image;
        this.description = description;
        this.specifications = specifications;
        this.thumbnails = thumbnails;
    }
    static fromPlain(obj) { return new Product(obj); }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadOrders();
    updateStats();
    
    // Check authentication (simple check)
    checkAuth();
    // Ensure preview reset when opening modal
    const imgPrev = document.getElementById('imagePreview');
    if (imgPrev) imgPrev.style.display = 'none';
    // Add required classes to the products section (for CSS/JS compatibility)
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
        productsSection.classList.add('products');
        productsSection.classList.add('product');
    }
});

// Simple authentication check
function checkAuth() {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
        // For demo purposes, auto-login as admin
        localStorage.setItem('isAdmin', 'true');
    }
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');
    
    // Add active class to clicked nav item
    event.target.closest('.nav-item').classList.add('active');
    
    // Update stats when switching to analytics
    if (sectionName === 'analytics') {
        updateStats();
    }
}

// Load products from json-server API
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:3000/products');
        if (!response.ok) {
            throw new Error('Không thể kết nối đến json-server');
        }
        const data = await response.json();
        products = data; // json-server trả về mảng products trực tiếp
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Lỗi khi tải sản phẩm! Hãy chạy: npx json-server db.json --port 3000', 'error');
    }
}

// Display products in table
function displayProducts(productsToShow = products) {
    const tbody = document.getElementById('productsTableBody');
    
    if (productsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-box" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Không có sản phẩm nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = productsToShow.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 60px; height: 60px; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px; color: #6c757d;">
                    <i class="fas fa-image"></i>
                </div>
            </td>
            <td>
                <div style="font-weight: 600; color: #2c3e50;">${product.name}</div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.25rem;">
                    ${product.description ? product.description.substring(0, 50) + '...' : 'Không có mô tả'}
                </div>
            </td>
            <td>${product.brand}</td>
            <td>
                <span style="background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                    ${product.category}
                </span>
            </td>
            <td style="font-weight: 600; color: #2c3e50;">${formatPrice(product.price)}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <i class="fas fa-star" style="color: #ffc107;"></i>
                    <span>${product.rating}</span>
                    <span style="color: #6c757d; font-size: 0.8rem;">(${product.reviews})</span>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editProduct(${product.id})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${product.id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load orders from localStorage
function loadOrders() {
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    orders = orderHistory;
    displayOrders();
}

// Display orders in table
function displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Chưa có đơn hàng nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const itemsCount = order.items ? order.items.length : 0;
        const customerName = order.customer ? order.customer.fullName : 'Không rõ';
        
        return `
            <tr>
                <td style="font-weight: 600; color: #667eea;">${order.orderNumber}</td>
                <td>
                    <div style="font-weight: 600;">${customerName}</div>
                    <div style="font-size: 0.8rem; color: #6c757d;">${order.customer ? order.customer.phone : ''}</div>
                </td>
                <td>
                    <span style="background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                        ${itemsCount} sản phẩm
                    </span>
                </td>
                <td style="font-weight: 600; color: #2c3e50;">${formatPrice(order.total)}</td>
                <td>${new Date(order.date).toLocaleDateString('vi-VN')}</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${order.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="viewOrder('${order.orderNumber}')" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="updateOrderStatus('${order.orderNumber}', 'completed')" title="Hoàn thành">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalOrders').textContent = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
    
    // Count unique customers
    const uniqueCustomers = new Set(orders.map(order => order.customer ? order.customer.phone : '')).size;
    document.getElementById('totalCustomers').textContent = uniqueCustomers;
}

// Filter products
function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredProducts = products;
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => 
            product.category === categoryFilter
        );
    }
    
    displayProducts(filteredProducts);
}

// Show add product modal
function showAddProductModal() {
    currentEditingProduct = null;
    document.getElementById('modalTitle').textContent = 'Thêm sản phẩm mới';
    document.getElementById('productForm').reset();
    clearSpecifications();
    // reset image preview
    const imgPrev = document.getElementById('imagePreview');
    if (imgPrev) { imgPrev.src = ''; imgPrev.style.display = 'none'; }
    document.getElementById('productModal').style.display = 'block';
}

// Show edit product modal
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentEditingProduct = productId;
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa sản phẩm';
    
    // Fill form with product data
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productBrand').value = product.brand || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productRating').value = product.rating || '';
    document.getElementById('productReviews').value = product.reviews || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    // preview existing image
    const imgPrev = document.getElementById('imagePreview');
    if (imgPrev) {
        if (product.image) { imgPrev.src = product.image; imgPrev.style.display = 'block'; }
        else { imgPrev.src = ''; imgPrev.style.display = 'none'; }
    }
    
    // Load specifications
    clearSpecifications();
    if (product.specifications) {
        Object.entries(product.specifications).forEach(([key, value]) => {
            addSpecRow(key, value);
        });
    }
    
    document.getElementById('productModal').style.display = 'block';
}

// Clear specifications
function clearSpecifications() {
    document.getElementById('specificationsContainer').innerHTML = `
        <div class="spec-row">
            <input type="text" placeholder="Tên thông số" class="spec-key">
            <input type="text" placeholder="Giá trị" class="spec-value">
            <button type="button" class="btn-remove-spec" onclick="removeSpecRow(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

// Add specification row
function addSpecRow(key = '', value = '') {
    const container = document.getElementById('specificationsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'spec-row';
    newRow.innerHTML = `
        <input type="text" placeholder="Tên thông số" class="spec-key" value="${key}">
        <input type="text" placeholder="Giá trị" class="spec-value" value="${value}">
        <button type="button" class="btn-remove-spec" onclick="removeSpecRow(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newRow);
}

// Remove specification row
function removeSpecRow(button) {
    const container = document.getElementById('specificationsContainer');
    if (container.children.length > 1) {
        button.closest('.spec-row').remove();
    }
}

// Save product
async function saveProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const specifications = {};
    
    // Collect specifications
    document.querySelectorAll('.spec-row').forEach(row => {
        const key = row.querySelector('.spec-key').value.trim();
        const value = row.querySelector('.spec-value').value.trim();
        if (key && value) {
            specifications[key] = value;
        }
    });
    
    const productData = {
        name: formData.get('name'),
        brand: formData.get('brand'),
        category: formData.get('category'),
        price: parseInt(formData.get('price')),
        rating: parseFloat(formData.get('rating')) || 4.0,
        reviews: parseInt(formData.get('reviews')) || 0,
        image: formData.get('image'),
        description: formData.get('description'),
        specifications: specifications,
        thumbnails: [] // Default empty array
    };
    
    try {
        if (currentEditingProduct) {
            // Update existing product
            const productIndex = products.findIndex(p => p.id === currentEditingProduct);
            if (productIndex !== -1) {
                products[productIndex] = { ...products[productIndex], ...productData };
                showNotification('Cập nhật sản phẩm thành công!', 'success');
            }
        } else {
            // Add new product
            const newId = Math.max(...products.map(p => p.id), 0) + 1;
            productData.id = newId;
            products.push(productData);
            showNotification('Thêm sản phẩm thành công!', 'success');
        }
        
        // Save to db.json (in real app, this would be an API call)
        await saveProductsToFile();
        
        closeProductModal();
        displayProducts();
        updateStats();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Lỗi khi lưu sản phẩm!', 'error');
    }
}

// Save products to file (update db.json)
async function saveProductsToFile() {
    try {
        // Update localStorage for admin panel
        localStorage.setItem('products', JSON.stringify(products));
        
        // Create updated db structure
        const updatedDb = {
            products: products
        };
        
        // Create a downloadable JSON file for manual update
        const dataStr = JSON.stringify(updatedDb, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'db_updated.json';
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        
        // Show success message with instructions
        showNotification('Sản phẩm đã được lưu! File db_updated.json đã được tải xuống. Thay thế file db.json cũ bằng file mới này.', 'success');
        
        // Also update localStorage with a flag to indicate db needs update
        localStorage.setItem('dbNeedsUpdate', 'true');
        localStorage.setItem('updatedProducts', JSON.stringify(products));
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (error) {
        console.error('Error saving products:', error);
        throw error;
    }
}

// Show delete confirmation modal
function showDeleteModal(productId) {
    deleteProductId = productId;
    document.getElementById('deleteModal').style.display = 'block';
}

// Confirm delete
async function confirmDelete() {
    if (!deleteProductId) return;
    
    try {
        const productIndex = products.findIndex(p => p.id === deleteProductId);
        if (productIndex !== -1) {
            const productName = products[productIndex].name;
            products.splice(productIndex, 1);
            
            await saveProductsToFile();
            displayProducts();
            updateStats();
            showNotification(`Đã xóa sản phẩm "${productName}"!`, 'success');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Lỗi khi xóa sản phẩm!', 'error');
    }
    
    closeDeleteModal();
}

// Close modals
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    currentEditingProduct = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteProductId = null;
}

// Order management functions
function viewOrder(orderNumber) {
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (order) {
        alert(`Chi tiết đơn hàng ${orderNumber}:\n\n` +
              `Khách hàng: ${order.customer.fullName}\n` +
              `Số điện thoại: ${order.customer.phone}\n` +
              `Email: ${order.customer.email}\n` +
              `Địa chỉ: ${order.customer.address}\n` +
              `Tổng tiền: ${formatPrice(order.total)}\n` +
              `Trạng thái: ${order.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}`);
    }
}

function updateOrderStatus(orderNumber, status) {
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (order) {
        order.status = status;
        localStorage.setItem('orderHistory', JSON.stringify(orders));
        displayOrders();
        updateStats();
        showNotification(`Cập nhật trạng thái đơn hàng ${orderNumber} thành công!`, 'success');
    }
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Handle image file input: read as Data URL and set to hidden input + preview
function handleImageFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        const hiddenInput = document.getElementById('productImage');
        if (hiddenInput) hiddenInput.value = dataUrl;
        const imgPrev = document.getElementById('imagePreview');
        if (imgPrev) { imgPrev.src = dataUrl; imgPrev.style.display = 'block'; }
    };
    reader.readAsDataURL(file);
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notificationText');
    
    text.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Reset database function
function resetDatabase() {
    if (confirm('Bạn có chắc chắn muốn reset về database gốc? Tất cả sản phẩm đã thêm/sửa sẽ bị mất!')) {
        // Clear admin updates
        localStorage.removeItem('dbNeedsUpdate');
        localStorage.removeItem('updatedProducts');
        localStorage.removeItem('products');
        
        // Reload products from db.json
        loadProducts();
        
        showNotification('Đã reset về database gốc! Trang chủ sẽ hiển thị sản phẩm từ db.json.', 'success');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const productModal = document.getElementById('productModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target === productModal) {
        closeProductModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}
