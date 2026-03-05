// ========================
// TENANT DASHBOARD
// ========================

let currentUser = null;
let currentMessagePropertyId = null;

// Check if user is logged in and is tenant
function checkTenantAuth() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    
    if (!session) {
        window.location.href = '../index.html';
        return null;
    }
    
    if (session.role !== 'tenant') {
        if (session.role === 'landlord') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = '../index.html';
        }
        return null;
    }
    
    return session;
}

// Update dashboard with user info
function updateTenantUI(session) {
    const firstName = session.name.split(' ')[0];
    document.getElementById('welcome-name').textContent = firstName;
    document.getElementById('user-name').textContent = session.name;
    document.getElementById('user-avatar').textContent = session.name.charAt(0).toUpperCase();
    
    // Load profile data
    loadProfileData();
}

// Load profile data
function loadProfileData() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    if (!session) return;
    
    document.getElementById('profile-name').value = session.name || '';
    document.getElementById('profile-email').value = session.email || '';
    document.getElementById('profile-phone').value = session.phone || '';
    document.getElementById('profile-avatar').textContent = session.name ? session.name.charAt(0).toUpperCase() : 'U';
}

// Save profile
document.getElementById('profileForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    if (!session) return;
    
    const newName = document.getElementById('profile-name').value.trim();
    const newEmail = document.getElementById('profile-email').value.trim();
    const newPhone = document.getElementById('profile-phone').value.trim();
    const newPassword = document.getElementById('profile-password').value;
    
    if (!newName || !newEmail) {
        alert('Name and email are required');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('nestify_users') || '[]');
    const userIndex = users.findIndex(u => u.id === session.userId);
    
    if (userIndex !== -1) {
        users[userIndex].name = newName;
        users[userIndex].email = newEmail;
        users[userIndex].phone = newPhone;
        if (newPassword) {
            users[userIndex].password = newPassword;
        }
        localStorage.setItem('nestify_users', JSON.stringify(users));
        
        // Update session
        session.name = newName;
        session.email = newEmail;
        session.phone = newPhone;
        localStorage.setItem('nestify_session', JSON.stringify(session));
        
        alert('Profile updated successfully!');
        
        // Update UI
        updateTenantUI(session);
        document.getElementById('profile-password').value = '';
    }
});

// Load and render dashboard data
function loadTenantDashboard() {
    currentUser = checkTenantAuth();
    if (!currentUser) return;
    
    updateTenantUI(currentUser);
    loadStats();
    renderBookings();
    renderFavorites();
    renderMessages();
    showSection('dashboard');
}

// Load stats
function loadStats() {
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const favorites = JSON.parse(localStorage.getItem('nestify_favorites') || '[]');
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    
    // Count user's favorites
    const myFavorites = favorites.filter(f => f.userId === currentUser.userId);
    document.getElementById('total-favorites').textContent = myFavorites.length;
    
    // Count active bookings (pending or confirmed)
    const myBookings = bookings.filter(b => b.tenantId === currentUser.userId);
    const activeBookings = myBookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
    document.getElementById('active-bookings').textContent = activeBookings;
    
    // Count unread messages
    const myMessages = messages.filter(m => m.fromUserId !== currentUser.userId);
    const unreadMessages = myMessages.filter(m => !m.read).length;
    document.getElementById('unread-messages').textContent = unreadMessages;
    
    // Total available properties (active only, or no status = active)
    const availableProperties = properties.filter(p => p.status === 'active' || !p.status).length;
    document.getElementById('total-properties').textContent = availableProperties;
}

// Navigation between sections
function showSection(sectionId) {
    // Save to localStorage
    localStorage.setItem('tenant_dashboard_active_section', sectionId);
    
    // Hide all sections with fade out
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
        section.style.opacity = '0';
    });
    
    const dashboardOverview = document.getElementById('dashboard-overview');
    dashboardOverview.style.opacity = '0';
    
    // Small delay for smooth transition
    setTimeout(() => {
        // Show/hide dashboard overview based on section
        if (sectionId === 'dashboard') {
            dashboardOverview.style.display = 'block';
        } else {
            dashboardOverview.style.display = 'none';
        }
        
        // Show selected section
        const section = document.getElementById(sectionId + '-section');
        if (section) {
            section.classList.add('active');
        }
        
        // Fade in
        dashboardOverview.style.transition = 'opacity 0.3s ease';
        dashboardOverview.style.opacity = '1';
        
        document.querySelectorAll('.dashboard-section.active').forEach(section => {
            section.style.transition = 'opacity 0.3s ease';
            section.style.opacity = '1';
        });
    }, 50);
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the clicked nav item
    const navLink = document.querySelector(`.nav-item[href="#${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    // Close mobile sidebar if open
    const sidebar = document.querySelector('.dashboard-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
}

// ========================
// BOOKINGS
// ========================

let currentBookingFilter = 'all';

function renderBookings(filter = 'all') {
    currentBookingFilter = filter;
    // Fresh fetch from localStorage to get latest status
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter bookings for this tenant
    let myBookings = bookings.filter(b => b.tenantId === currentUser.userId || b.buyerId === currentUser.userId);
    
    // Apply status filter
    if (filter !== 'all') {
        myBookings = myBookings.filter(b => b.status === filter);
    }
    
    // Sort by date (newest first)
    myBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const container = document.getElementById('bookings-list');
    
    if (myBookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No Bookings Found</h3>
                <p>${filter === 'all' ? 'You haven\'t made any booking requests yet' : 'No bookings with this status'}</p>
                <a href="../properties.html" class="btn btn-primary">Browse Properties</a>
            </div>
        `;
        // Update active filter tab even when empty
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            }
        });
        return;
    }
    
    container.innerHTML = myBookings.map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        
        // Format date based on booking type
        let formattedDate = '';
        if (booking.type === 'rental' && booking.checkIn && booking.checkOut) {
            formattedDate = `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`;
        } else if (booking.scheduledDate) {
            formattedDate = new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } else {
            formattedDate = new Date(booking.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        
        // Show Checkout button for confirmed rental and sale bookings that aren't paid
        const canCheckout = booking.status === 'confirmed' && (booking.type === 'rental' || booking.type === 'purchase') && !booking.paidAt;
        
        // Booking type label
        let bookingTypeLabel = 'Request';
        if (booking.type === 'rental') bookingTypeLabel = 'Rental Booking';
        else if (booking.type === 'purchase') bookingTypeLabel = 'Purchase Request';
        
        // Status display
        let statusDisplay = booking.status;
        if (booking.status === 'confirmed' && (booking.type === 'rental' || booking.type === 'purchase')) {
            statusDisplay = 'Ready for Checkout';
        }
        
        // Get tenant/buyer contact info
        const contactName = booking.tenantName || booking.buyerName || 'N/A';
        const contactEmail = booking.tenantEmail || booking.buyerEmail || 'N/A';
        const contactPhone = booking.tenantPhone || booking.buyerPhone || 'N/A';
        
        return `
            <div class="booking-item">
                <div class="booking-info">
                    <div class="booking-property-info">
                        <h4>${property ? property.title : 'Unknown Property'}</h4>
                        <p>${property ? property.location : ''}</p>
                        <span class="booking-type">${bookingTypeLabel}</span>
                    </div>
                    <div class="booking-contact-info">
                        <p><i class="fas fa-user"></i> <strong>Name:</strong> ${contactName}</p>
                        <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${contactEmail}</p>
                        <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${contactPhone}</p>
                    </div>
                </div>
                <div class="booking-details">
                    <div class="booking-date">
                        <i class="fas fa-calendar"></i> ${formattedDate}
                    </div>
                    <span class="booking-status ${booking.status}">${statusDisplay}</span>
                    ${canCheckout ? `<button class="btn btn-primary btn-sm" onclick="goToCheckout(${booking.id})">
                        <i class="fas fa-shopping-cart"></i> Checkout
                    </button>` : ''}
                    ${booking.status === 'completed' || booking.paidAt ? `<span class="paid-badge"><i class="fas fa-check-circle"></i> Paid</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Update active filter tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === filter) {
            tab.classList.add('active');
        }
    });
}

function filterBookings(filter) {
    renderBookings(filter);
}

function goToCheckout(bookingId) {
    // Store booking ID in sessionStorage for checkout page to retrieve
    sessionStorage.setItem('checkout_booking_id', bookingId);
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

function proceedToCheckout(bookingId) {
    // Fresh fetch from localStorage
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
        alert('Booking not found');
        return;
    }
    
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const property = properties.find(p => p.id === booking.propertyId);
    
    if (!property) {
        alert('Property not found');
        return;
    }
    
    const total = property.price;
    const bookingType = booking.type === 'rental' ? 'rental' : 'purchase';
    const confirmPay = confirm(`Proceed to pay $${total.toLocaleString()} for ${property.title}?\n\nThis is a ${bookingType} booking.`);
    
    if (confirmPay) {
        // Mark as completed
        const index = bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
            bookings[index].status = 'completed';
            bookings[index].paidAt = new Date().toISOString();
            localStorage.setItem('nestify_bookings', JSON.stringify(bookings));
        }
        
        alert('Payment successful! Your booking is now confirmed.');
        renderBookings(currentBookingFilter);
    }
}

// ========================
// FAVORITES
// ========================

function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('nestify_favorites') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Get user's favorites
    const myFavorites = favorites.filter(f => f.userId === currentUser.userId);
    const favoritePropertyIds = myFavorites.map(f => f.propertyId);
    
    // Get property objects for favorites (active only or no status = active)
    const favoriteProperties = properties.filter(p => favoritePropertyIds.includes(p.id) && (p.status === 'active' || !p.status));
    
    const container = document.getElementById('favorites-list');
    
    if (favoriteProperties.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-heart"></i>
                <h3>No Favorites Yet</h3>
                <p>Properties you save will appear here</p>
                <a href="../properties.html" class="btn btn-primary">Browse Properties</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = favoriteProperties.map(property => createPropertyCard(property, true)).join('');
}

function createPropertyCard(property, showFavoriteBtn = true) {
    const price = property.type === 'rent' 
        ? `$${property.price.toLocaleString()}/${property.pricePeriod || 'month'}` 
        : `$${property.price.toLocaleString()}`;
    
    const badgeLabel = property.type === 'rent' ? 'For Rent' : 'For Sale';
    
    const image = property.images && property.images.length > 0 
        ? property.images[0] 
        : (property.image || 'https://via.placeholder.com/400x300?text=No+Image');
    
    // Check if favorited
    const favorites = JSON.parse(localStorage.getItem('nestify_favorites') || '[]');
    const isFavorited = favorites.some(f => f.userId === currentUser.userId && f.propertyId === property.id);
    
    const favoriteBtn = showFavoriteBtn ? `
        <button class="property-favorite-btn ${isFavorited ? 'active' : ''}" 
                onclick="toggleFavorite(${property.id}, event)" 
                title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="fas fa-heart"></i>
        </button>
    ` : '';
    
    return `
        <div class="property-card">
            ${favoriteBtn}
            <div class="property-image">
                <img src="${image}" alt="${property.title}" onclick="viewPropertyDetail(${property.id})" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                <div class="property-badges">
                    <span class="property-badge badge-${property.type}">${badgeLabel}</span>
                </div>
            </div>
            <div class="property-content">
                <div class="property-price">${price}</div>
                <h3 class="property-title">${property.title}</h3>
                <p class="property-location">
                    <i class="fas fa-map-marker-alt"></i> ${property.location}
                </p>
                <div class="property-details">
                    <span><i class="fas fa-bed"></i> ${property.bedrooms} Beds</span>
                    <span><i class="fas fa-bath"></i> ${property.bathrooms} Baths</span>
                    <span><i class="fas fa-ruler-combined"></i> ${property.sqft || 'N/A'} sqft</span>
                </div>
            </div>
        </div>
    `;
}

function toggleFavorite(propertyId, event) {
    event.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem('nestify_favorites') || '[]');
    const existingIndex = favorites.findIndex(f => f.userId === currentUser.userId && f.propertyId === propertyId);
    
    if (existingIndex > -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
    } else {
        // Add to favorites
        favorites.push({
            userId: currentUser.userId,
            propertyId: propertyId,
            savedAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('nestify_favorites', JSON.stringify(favorites));
    
    // Re-render favorites list
    renderFavorites();
    loadStats();
}

function viewPropertyDetail(propertyId) {
    window.location.href = `property-detail.html?id=${propertyId}`;
}

// ========================
// MESSAGES
// ========================

function renderMessages() {
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter messages sent to this tenant (from landlords)
    const myMessages = messages.filter(m => m.fromUserId !== currentUser.userId);
    
    // Sort by date (newest first)
    myMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const container = document.getElementById('messages-list');
    
    if (myMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope"></i>
                <h3>No Messages Yet</h3>
                <p>When landlords respond to your inquiries, messages will appear here</p>
                <a href="../properties.html" class="btn btn-primary">Browse Properties</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myMessages.map(message => {
        const property = properties.find(p => p.id === message.propertyId);
        const formattedDate = new Date(message.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        return `
            <div class="message-item ${message.read ? '' : 'unread'}" onclick="viewMessage(${message.id})">
                <div class="message-avatar">${message.fromName ? message.fromName.charAt(0) : 'L'}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-name">${message.fromName || 'Landlord'}</span>
                        <span class="message-date">${formattedDate}</span>
                    </div>
                    <p class="message-property">${property ? property.title : 'Unknown Property'}</p>
                    <p class="message-preview">${message.message}</p>
                </div>
                ${message.read ? '' : '<div class="unread-dot"></div>'}
            </div>
        `;
    }).join('');
}

// View message detail
let currentMessageId = null;

function viewMessage(messageId) {
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    const message = messages.find(m => m.id === messageId);
    
    if (!message) return;
    
    currentMessageId = message.id;
    currentMessagePropertyId = message.propertyId;
    
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const property = properties.find(p => p.id === message.propertyId);
    
    document.getElementById('message-sender-avatar').textContent = message.fromName ? message.fromName.charAt(0) : 'L';
    document.getElementById('message-sender-name').textContent = message.fromName || 'Landlord';
    document.getElementById('message-property-title').textContent = property ? property.title : 'Unknown Property';
    document.getElementById('message-date').textContent = new Date(message.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('message-content').textContent = message.message;
    document.getElementById('message-sender-email').textContent = message.fromEmail || 'Not provided';
    document.getElementById('message-sender-phone').textContent = message.fromPhone || 'Not provided';
    
    document.getElementById('messageDetailModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Mark as read
    if (!message.read) {
        const index = messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
            messages[index].read = true;
            localStorage.setItem('nestify_messages', JSON.stringify(messages));
            renderMessages();
            loadStats();
        }
    }
}

function closeMessageModal() {
    document.getElementById('messageDetailModal').classList.remove('active');
    document.body.style.overflow = '';
    currentMessageId = null;
    currentMessagePropertyId = null;
}

function viewPropertyFromMessage() {
    if (currentMessagePropertyId) {
        window.location.href = `property-detail.html?id=${currentMessagePropertyId}`;
    }
}

// ========================
// INITIALIZE
// ========================

document.addEventListener('DOMContentLoaded', function() {
    loadTenantDashboard();
    
    // Nav link click handlers
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                const sectionId = href.replace('#', '');
                showSection(sectionId);
            }
        });
    });
    
    // Modal overlay click to close
    document.getElementById('messageDetailModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeMessageModal();
    });
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.add('active');
            sidebarOverlay?.classList.add('active');
        });
        
        sidebarOverlay?.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
});
