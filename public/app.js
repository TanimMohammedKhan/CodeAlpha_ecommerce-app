let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let token = localStorage.getItem('token') || null;

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateAuthUI();
    updateCartUI();
});

async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        products = await res.json();
        renderProducts(products);
    } catch (err) {
        console.error(err);
    }
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    const countLabel = document.getElementById('product-count-label');
    grid.innerHTML = '';

    if (countLabel) {
        countLabel.innerText = `Showing ${items.length} items`;
    }

    if (items.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No products found.</p>';
        return;
    }

    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-box" onclick="viewProductDetails(${p.id})">
                <img src="${p.image_url}" alt="${p.name}">
            </div>
            <div class="product-details">
                <div class="product-title" onclick="viewProductDetails(${p.id})">${p.name}</div>
                <div class="product-price">$${Number(p.price).toFixed(2)}</div>
                <p class="product-desc">${p.description.substring(0, 75)}...</p>
                <div class="card-actions">
                    <button class="btn-primary" onclick="addToCart(${p.id})">
                        <i class="fa-solid fa-cart-plus"></i> Add
                    </button>
                    <button class="btn-secondary" onclick="viewProductDetails(${p.id})">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
    );
    renderProducts(filtered);
}

async function viewProductDetails(id) {
    try {
        const res = await fetch(`/api/products/${id}`);
        const product = await res.json();

        const detailView = document.getElementById('product-detail-view');
        detailView.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="detail-info">
                <div>
                    <span class="hero-tag" style="color: var(--primary);">Electronics</span>
                    <h1 style="font-size: 2rem; margin: 0.25rem 0 0.5rem;">${product.name}</h1>
                    <div style="font-size: 1.75rem; font-weight: 800; color: var(--text-dark);">$${Number(product.price).toFixed(2)}</div>
                </div>
                <p style="color: var(--text-muted); line-height: 1.6; font-size: 1rem;">${product.description}</p>
                <div style="font-size: 0.9rem; color: var(--text-muted);">
                    <i class="fa-solid fa-box"></i> Stock Availability: <strong>${product.stock} in stock</strong>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn-primary" style="padding: 0.85rem 1.75rem; font-size: 1rem;" onclick="addToCart(${product.id})">
                        <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;

        showSection('product-details-section');
    } catch (err) {
        console.error(err);
    }
}

function showSection(sectionId) {
    document.getElementById('products-section').classList.add('hidden');
    document.getElementById('product-details-section').classList.add('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image_url: product.image_url,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
}

function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }

    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    document.getElementById('cart-count').innerText = count;
    document.getElementById('cart-total').innerText = total.toFixed(2);

    const itemsContainer = document.getElementById('cart-items');
    itemsContainer.innerHTML = '';

    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <div style="text-align: center; margin: auto; color: var(--text-muted);">
                <i class="fa-solid fa-bag-shopping" style="font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p>Your bag is empty.</p>
            </div>
        `;
        return;
    }

    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.innerHTML = `
            <div>
                <strong style="font-size: 0.95rem;">${item.name}</strong>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.2rem;">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-stepper">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        `;
        itemsContainer.appendChild(row);
    });
}

function toggleCart() {
    document.getElementById('cart-modal').classList.toggle('hidden');
}

function toggleAuthModal() {
    document.getElementById('auth-modal').classList.toggle('hidden');
}

function switchAuthTab(type) {
    const loginTab = document.getElementById('login-tab');
    const regTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');

    if (type === 'login') {
        loginTab.classList.add('active');
        regTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
    } else {
        regTab.classList.add('active');
        loginTab.classList.remove('active');
        regForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        alert('Registration complete! You can now log in.');
        switchAuthTab('login');
    } catch (err) {
        alert(err.message);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        token = data.token;
        currentUser = data.user;

        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        updateAuthUI();
        toggleAuthModal();
    } catch (err) {
        alert(err.message);
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showSection('products-section');
}

function updateAuthUI() {
    const authActions = document.getElementById('auth-actions');

    if (currentUser) {
        authActions.innerHTML = `
            <button class="user-badge" onclick="openProfile()">
                <i class="fa-solid fa-circle-user" style="color: var(--primary);"></i>
                <span>${currentUser.name}</span>
            </button>
        `;
    } else {
        authActions.innerHTML = `
            <button class="btn-auth" onclick="toggleAuthModal()">
                <i class="fa-regular fa-user"></i>
                <span>Sign In</span>
            </button>
        `;
    }
}

async function openProfile() {
    if (!currentUser) return;

    document.getElementById('profile-name').innerText = currentUser.name;
    document.getElementById('profile-email').innerText = currentUser.email;

    await loadOrderHistory();
    showSection('profile-section');
}

async function loadOrderHistory() {
    const container = document.getElementById('order-history-list');
    container.innerHTML = '<p style="color: var(--text-muted);">Loading your orders...</p>';

    try {
        const res = await fetch('/api/user/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await res.json();

        if (!res.ok) throw new Error(orders.error);

        if (orders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; border: 1px dashed var(--border); border-radius: var(--radius-md);">
                    <i class="fa-solid fa-receipt" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
                    <p style="color: var(--text-muted);">No orders found yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const orderCard = document.createElement('div');
            orderCard.className = 'order-box';
            orderCard.innerHTML = `
                <div class="order-meta-header">
                    <div>
                        <strong>Order #${order.id}</strong> &bull; 
                        <span style="color: var(--text-muted);">${date}</span>
                    </div>
                    <div>
                        <span class="order-status">${order.order_status}</span>
                        <strong style="margin-left: 0.75rem;">$${Number(order.total_amount).toFixed(2)}</strong>
                    </div>
                </div>
                <div class="order-items-table">
                    ${order.items.map(item => `
                        <div class="order-row">
                            <img src="${item.image_url}" alt="${item.name}">
                            <div class="order-row-info">
                                <h4>${item.name}</h4>
                                <span>Quantity: ${item.quantity} &bull; $${Number(item.price).toFixed(2)} each</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(orderCard);
        });
    } catch (err) {
        container.innerHTML = `<p style="color: var(--danger);">Failed to load orders: ${err.message}</p>`;
    }
}

async function checkout() {
    if (!token) {
        alert('Please sign in to place an order.');
        toggleCart();
        toggleAuthModal();
        return;
    }

    if (cart.length === 0) {
        alert('Your bag is empty.');
        return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cart,
                totalAmount: totalAmount
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        alert(`Order placed successfully! Order ID: #${data.orderId}`);
        cart = [];
        saveCart();
        updateCartUI();
        toggleCart();
        openProfile();
    } catch (err) {
        alert(err.message);
    }
}