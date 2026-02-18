document.addEventListener('DOMContentLoaded', function() {
    StorageService.initializeSeedData();
    
    const user = AuthService.getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    if (user.role !== 'tenant') {
        window.location.href = 'admin-dashboard.html';
        return;
    }
    
    // Set user info
    document.getElementById('username').textContent = user.username;
    document.getElementById('welcomeName').textContent = user.username;
    document.getElementById('userAvatar').innerHTML = '<span class="material-symbols-outlined">person</span>';
    
    // Check for notifications
    checkNotifications();
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        AuthService.logout();
    });
    
    // Navigation
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.getAttribute('data-section');
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection + 'Section') {
                    section.classList.add('active');
                }
            });
        });
    });
    
    // Booking tabs
    const bookingTabs = document.querySelectorAll('.booking-tab');
    bookingTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            bookingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadBookings(tab.getAttribute('data-status'));
        });
    });
    
    // Initial loads
    loadFavorites();
    loadBookings('pending');
    loadMessages();
});

function checkNotifications() {
    const notifications = StorageService.get('nestify_notifications') || [];
    const user = AuthService.getCurrentUser();
    
    // Filter notifications for current user
    const userNotifications = notifications.filter(n => !n.read);
    
    if (userNotifications.length > 0) {
        // Show notification toast
        const latestNotification = userNotifications[userNotifications.length - 1];
        
        if (latestNotification.type === 'booking_approved') {
            showNotificationToast('Your booking has been approved! Please proceed to checkout.', 'success');
            
            // Mark notification as read
            const allNotifications = StorageService.get('nestify_notifications') || [];
            const updatedNotifications = allNotifications.map(n => {
                if (n.id === latestNotification.id) {
                    return { ...n, read: true };
                }
                return n;
            });
            StorageService.set('nestify_notifications', updatedNotifications);
        }
    }
}

function showNotificationToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'info'}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;
    
    // Add toast styles if not already added
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .notification-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 400px;
            }
            .notification-toast.success {
                border-left: 4px solid #10b981;
            }
            .notification-toast.success .material-symbols-outlined:first-child {
                color: #10b981;
            }
            .notification-toast button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                margin-left: auto;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('nestify_favorites')) || [];
    const container = document.getElementById('favoritesList');
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">favorite</span>
                <p>No favorites yet. Browse properties and save your favorites!</p>
                <a href="property-listings.html" class="btn-primary">Browse Properties</a>
            </div>
        `;
        return;
    }
    
    const properties = favorites.map(id => PropertyService.getPropertyById(id)).filter(p => p);
    
    container.innerHTML = `
        <div class="properties-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; width: 100%;">
            <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--dark-blue);">Saved Properties (${properties.length})</h2>
            <a href="property-listings.html" class="btn-primary" style="padding: 10px 20px; background: var(--primary-blue); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">View More Properties</a>
        </div>
    ` + properties.map(property => `
        <div class="property-card" data-id="${property.id}">
            <div class="property-image">
                <img src="${property.images?.[0] || './img/card1.jpg'}" alt="${property.title}">
                ${property.status === 'available' ? '<span class="property-badge">Featured</span>' : ''}
                <button class="favorite-btn active" onclick="removeFavorite('${property.id}')">
                    <span class="material-symbols-outlined">favorite</span>
                </button>
                <span class="property-price">$${formatPrice(property.price)}</span>
            </div>
            <div class="property-details">
                <h3 class="property-title">${property.title}</h3>
                <p class="property-location">
                    <span class="material-symbols-outlined" style="font-size: 16px;">location_on</span>
                    ${property.address || 'Location not specified'}
                </p>
                <div class="property-features">
                    <span><span class="material-symbols-outlined" style="font-size: 16px;">bed</span> ${property.bedrooms || 0}</span>
                    <span><span class="material-symbols-outlined" style="font-size: 16px;">bathtub</span> ${property.bathrooms || 0}</span>
                    <span><span class="material-symbols-outlined" style="font-size: 16px;">square_foot</span> ${property.sqft || 0}</span>
                </div>
                <button class="view-details-btn" onclick="window.location.href='property-detail.html?id=${property.id}'">View Details</button>
            </div>
        </div>
    `).join('');
}

function loadBookings(status) {
    const user = AuthService.getCurrentUser();
    const bookings = StorageService.getBookingsByTenant(user.id);
    const container = document.getElementById('bookingsList');
    
    const filteredBookings = bookings.filter(b => b.status === status);
    
    if (filteredBookings.length === 0) {
        const statusMessages = {
            pending: 'No pending bookings. Browse properties and make a booking request!',
            approved: 'No approved bookings yet. Your booking requests are waiting for landlord approval.',
            completed: 'No completed bookings yet. Complete your approved bookings to see them here.'
        };
        
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">event_note</span>
                <p>${statusMessages[status]}</p>
                ${status !== 'completed' ? '<a href="property-listings.html" class="btn-primary">Browse Properties</a>' : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredBookings.map(booking => {
        const property = PropertyService.getPropertyById(booking.propertyId);
        if (!property) return '';
        
        let actionButton = '';
        if (status === 'approved') {
            actionButton = `<button class="btn-primary" onclick="goToCheckout('${booking.id}')">Complete Booking</button>`;
        } else if (status === 'pending') {
            actionButton = `<button class="btn-secondary" onclick="cancelBooking('${booking.id}')">Cancel Request</button>`;
        }
        
        return `
            <div class="booking-card">
                <div class="booking-property">
                    <img src="${property.images?.[0] || './img/card1.jpg'}" alt="${property.title}">
                    <div class="booking-info">
                        <h3>${property.title}</h3>
                        <p>${property.address || 'Location not specified'}</p>
                        <p class="booking-price">$${formatPrice(property.price)}</p>
                    </div>
                </div>
                <div class="booking-status">
                    <span class="status-badge ${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-date">
                    <p><strong>Check-In:</strong> ${booking.checkIn || 'Not specified'}</p>
                    <p><strong>Check-Out:</strong> ${booking.checkOut || 'Not specified'}</p>
                </div>
                <div class="booking-actions">
                    ${actionButton}
                </div>
            </div>
        `;
    }).join('');
}

function loadMessages() {
    const user = AuthService.getCurrentUser();
    const messages = StorageService.getMessagesForUser(user.id);
    const container = document.getElementById('messagesList');
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">chat</span>
                <p>No messages yet. Contact landlords about properties you're interested in!</p>
                <a href="property-listings.html" class="btn-primary">Browse Properties</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(message => {
        const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
        const otherUser = StorageService.getUsers().find(u => u.id === otherUserId);
        const property = message.propertyId ? PropertyService.getPropertyById(message.propertyId) : null;
        
        return `
            <div class="message-card ${message.read ? '' : 'unread'}">
                <div class="message-avatar">
                    ${otherUser ? otherUser.username.charAt(0).toUpperCase() : '?'}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <strong>${otherUser ? otherUser.username : 'Unknown'}</strong>
                        <span class="message-time">${formatDate(message.timestamp)}</span>
                    </div>
                    ${property ? `<p class="message-property">Re: ${property.title}</p>` : ''}
                    <p class="message-text">${message.content}</p>
                </div>
            </div>
        `;
    }).join('');
    
    // Update badge
    const unreadCount = messages.filter(m => !m.read && m.senderId !== user.id).length;
    if (unreadCount > 0) {
        const badge = document.getElementById('messageBadge');
        badge.textContent = unreadCount;
        badge.style.display = 'inline-flex';
    }
}

function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
        return (price / 1000).toFixed(0) + 'k';
    }
    return price.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
}

function removeFavorite(propertyId) {
    let favorites = JSON.parse(localStorage.getItem('nestify_favorites')) || [];
    const index = favorites.indexOf(propertyId);
    if (index > -1) {
        favorites.splice(index, 1);
        localStorage.setItem('nestify_favorites', JSON.stringify(favorites));
        loadFavorites();
    }
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking request?')) {
        const bookings = StorageService.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            StorageService.set('nestify_bookings', bookings);
            loadBookings('pending');
        }
    }
}

function goToCheckout(bookingId) {
    window.location.href = `checkout.html?bookingId=${bookingId}`;
}

window.removeFavorite = removeFavorite;
window.cancelBooking = cancelBooking;
window.goToCheckout = goToCheckout;
