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
    
    container.innerHTML = properties.map(property => `
        <div class="property-card">
            <div class="property-image">
                <img src="${property.images?.[0] || './img/card1.jpg'}" alt="${property.title}">
                <button class="favorite-btn active" onclick="removeFavorite('${property.id}')">
                    <span class="material-symbols-outlined">favorite</span>
                </button>
            </div>
            <div class="property-details">
                <h3>${property.title}</h3>
                <p class="property-location">${property.address || 'Location not specified'}</p>
                <p class="property-price">$${formatPrice(property.price)}</p>
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
