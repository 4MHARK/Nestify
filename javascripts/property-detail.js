// ========================
// PROPERTY DETAIL PAGE
// ========================

let currentProperty = null;
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    // Check authentication
    checkAuth();
    
    // Get property ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = parseInt(urlParams.get('id'));
    
    if (!propertyId) {
        showNotFound();
        return;
    }
    
    loadProperty(propertyId);
}

function checkAuth() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    currentUser = session;
    updateNavUI(session);
}

function updateNavUI(session) {
    const navAuth = document.getElementById('nav-auth');
    const userMenu = document.getElementById('user-menu');
    const dashboardLink = document.querySelector('.user-dropdown a[href*="dashboard"]');
    
    if (session) {
        navAuth.style.display = 'none';
        userMenu.style.display = 'block';
        
        document.getElementById('user-avatar').textContent = session.name.charAt(0).toUpperCase();
        document.getElementById('user-name').textContent = session.name;
        document.getElementById('dropdown-name').textContent = session.name;
        document.getElementById('dropdown-email').textContent = session.email;
        
        // Update dashboard link based on role
        if (dashboardLink) {
            if (session.role === 'tenant') {
                dashboardLink.href = 'tenant-dashboard.html';
            } else {
                dashboardLink.href = 'dashboard.html';
            }
        }
    } else {
        navAuth.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

function loadProperty(propertyId) {
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const property = properties.find(p => p.id === propertyId);
    
    if (!property) {
        showNotFound();
        return;
    }
    
    // Only show active properties to non-owners (hide inactive properties)
    if (property.status === 'inactive' && (!currentUser || currentUser.userId !== property.landlordId)) {
        showNotFound();
        return;
    }
    
    currentProperty = property;
    renderProperty(property);
}

function showNotFound() {
    document.querySelector('.property-detail-section .container').innerHTML = `
        <div class="property-not-found">
            <i class="fas fa-home"></i>
            <h2>Property Not Found</h2>
            <p>This property may have been removed or is no longer available.</p>
            <a href="../properties.html" class="btn btn-primary">Browse Properties</a>
        </div>
    `;
}

function renderProperty(property) {
    const isOwner = currentUser && currentUser.userId === property.landlordId;
    const users = JSON.parse(localStorage.getItem('nestify_users') || '[]');
    const landlord = users.find(u => u.id === property.landlordId);
    
    // Set basic info
    document.getElementById('property-title').textContent = property.title;
    
    // Price with period
    const priceText = property.type === 'rent' 
        ? `$${property.price.toLocaleString()}/${property.pricePeriod || 'month'}`
        : `$${property.price.toLocaleString()}`;
    document.getElementById('property-price').textContent = priceText;
    
    document.getElementById('property-location').textContent = property.location;
    document.getElementById('property-bedrooms').textContent = property.bedrooms;
    document.getElementById('property-bathrooms').textContent = property.bathrooms;
    document.getElementById('property-sqft').textContent = property.sqft || 'N/A';
    
    // Main image
    const mainImage = property.images && property.images.length > 0 
        ? property.images[0] 
        : (property.image || 'https://via.placeholder.com/800x600?text=No+Image');
    document.getElementById('main-image').src = mainImage;
    
    // Badges
    const badgesContainer = document.getElementById('property-badges');
    badgesContainer.innerHTML = `
        <span class="property-type-badge ${property.type}">
            ${property.type === 'rent' ? 'For Rent' : 'For Sale'}
        </span>
        ${property.status === 'inactive' ? '<span class="status-badge inactive">Unavailable</span>' : ''}
    `;
    
    // Thumbnails
    renderThumbnails(property);
    
    // Amenities
    renderAmenities(property);
    
    // Description
    document.getElementById('property-description').textContent = 
        `Beautiful ${property.type === 'rent' ? 'rental' : 'property for sale'} located in ${property.location}. ` +
        `Features ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, and ${property.sqft || 'N/A'} sqft of living space.`;
    
    // Show appropriate sidebar based on ownership
    const ownerActions = document.getElementById('owner-actions');
    const contactCard = document.getElementById('contact-card');
    
    if (isOwner) {
        ownerActions.style.display = 'block';
        contactCard.style.display = 'none';
        
        // Update status toggle button
        const statusBtn = document.getElementById('toggle-status-btn');
        if (property.status === 'inactive') {
            statusBtn.innerHTML = '<i class="fas fa-toggle-off"></i> Mark as Active';
        } else {
            statusBtn.innerHTML = '<i class="fas fa-toggle-on"></i> Mark as Inactive';
        }
    } else {
        ownerActions.style.display = 'none';
        contactCard.style.display = 'block';
        
        // Pre-fill contact form if logged in
        if (currentUser) {
            document.getElementById('contact-name').value = currentUser.name || '';
            document.getElementById('contact-email').value = currentUser.email || '';
            document.getElementById('booking-name').value = currentUser.name || '';
            document.getElementById('booking-email').value = currentUser.email || '';
            document.getElementById('buyer-name').value = currentUser.name || '';
            document.getElementById('buyer-email').value = currentUser.email || '';
            document.getElementById('buyer-phone').value = currentUser.phone || '';
        }
    }
    
    // Landlord info
    if (landlord) {
        document.getElementById('landlord-name').textContent = landlord.name;
        document.getElementById('landlord-avatar').textContent = landlord.name.charAt(0).toUpperCase();
        document.getElementById('landlord-since').textContent = 'Property Landlord';
    }
    
    // Load similar properties (for non-owners)
    if (!isOwner) {
        loadSimilarProperties(property);
    }
    
    // Set property IDs in modals
    document.getElementById('contact-property-id').value = property.id;
    document.getElementById('booking-property-id').value = property.id;
    document.getElementById('message-property-id').value = property.id;
    document.getElementById('rental-property-id').value = property.id;
    document.getElementById('purchase-property-id').value = property.id;
    
    // Load map
    loadMap(property.location);
    
    // Show booking form based on property type (only for non-owners)
    if (!isOwner) {
        if (property.type === 'rent') {
            document.getElementById('rental-booking-card').style.display = 'block';
            setupRentalBookingDates();
        } else if (property.type === 'sale') {
            document.getElementById('purchase-booking-card').style.display = 'block';
        }
    }
}

function renderThumbnails(property) {
    const container = document.getElementById('gallery-thumbnails');
    const images = property.images || (property.image ? [property.image] : []);
    
    if (images.length <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = images.map((img, index) => `
        <div class="thumbnail-item ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
            <img src="${img}" alt="Property thumbnail ${index + 1}">
        </div>
    `).join('');
}

function changeMainImage(src, thumbnail) {
    document.getElementById('main-image').src = src;
    
    document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}

function renderAmenities(property) {
    const container = document.getElementById('amenities-list');
    const amenities = property.amenities || [];
    
    if (amenities.length === 0) {
        container.innerHTML = '<p style="color: var(--gray);">No amenities listed</p>';
        return;
    }
    
    const amenityIcons = {
        'Pool': 'fa-swimming-pool',
        'Garage': 'fa-car',
        'Garden': 'fa-leaf',
        'Gym': 'fa-dumbbell',
        'Parking': 'fa-parking',
        'Security': 'fa-shield-alt',
        'AC': 'fa-snowflake',
        'Heating': 'fa-fire',
        'Wifi': 'fa-wifi',
        'Washer': 'fa-soap',
        'Dishwasher': 'fa-box',
        'Balcony': 'fa-door-open'
    };
    
    container.innerHTML = amenities.map(amenity => `
        <span class="amenity-tag">
            <i class="fas ${amenityIcons[amenity] || 'fa-check'}"></i>
            ${amenity}
        </span>
    `).join('');
}

function loadSimilarProperties(currentProperty) {
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter similar properties
    const similar = properties.filter(p => {
        // Exclude current property
        if (p.id === currentProperty.id) return false;
        
        // Exclude inactive properties (allow properties with no status)
        if (p.status === 'inactive') return false;
        
        // Same type (rent or sale)
        if (p.type !== currentProperty.type) return false;
        
        // Similar price range (+/- 40%)
        const priceDiff = Math.abs(p.price - currentProperty.price) / currentProperty.price;
        if (priceDiff > 0.4) return false;
        
        return true;
    }).slice(0, 4);
    
    if (similar.length === 0) {
        document.getElementById('similar-properties').style.display = 'none';
        return;
    }
    
    document.getElementById('similar-properties').style.display = 'block';
    
    const container = document.getElementById('similar-properties-grid');
    container.innerHTML = similar.map(property => createPropertyCard(property)).join('');
}

// Load map based on location
function loadMap(location) {
    const mapContainer = document.getElementById('map-container');
    const mapIframe = document.getElementById('property-map');
    if (!mapContainer || !location) return;
    
    // Hide map section if no location
    if (!location || location.trim() === '') {
        mapContainer.style.display = 'none';
        return;
    }
    
    // Use OpenStreetMap instead (free, no API key needed)
    const encodedLocation = encodeURIComponent(location);
    const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-0.5%2C51.0%2C0.5%2C51.5&layer=mapnik&marker=${encodedLocation}`;
    
    // Try OpenStreetMap embed
    if (mapIframe) {
        mapIframe.src = `https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        mapIframe.onerror = function() {
            // Fallback to text display if map fails
            mapContainer.innerHTML = `
                <div style="background: var(--light-50); padding: 40px; text-align: center; border-radius: var(--radius);">
                    <i class="fas fa-map-marker-alt" style="font-size: 32px; color: var(--primary); margin-bottom: 12px;"></i>
                    <p style="color: var(--gray-dark); font-weight: 500;">${location}</p>
                    <p style="color: var(--gray); font-size: 14px;">View on Maps: <a href="https://www.google.com/maps/search/${encodedLocation}" target="_blank">Open in Google Maps</a></p>
                </div>
            `;
        };
    }
}

// Setup rental booking date inputs
function setupRentalBookingDates() {
    const checkIn = document.getElementById('check-in-date');
    const checkOut = document.getElementById('check-out-date');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const minCheckIn = today.toISOString().split('T')[0];
    const minCheckOut = tomorrow.toISOString().split('T')[0];
    
    checkIn.min = minCheckIn;
    checkOut.min = minCheckOut;
    
    // Update check-out min when check-in changes
    checkIn.addEventListener('change', function() {
        const checkInDate = new Date(this.value);
        const nextDay = new Date(checkInDate);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOut.min = nextDay.toISOString().split('T')[0];
        checkOut.value = '';
    });
}

// Message Modal
function openMessageModal() {
    if (!currentUser) {
        openAuthModal('signin');
        return;
    }
    document.getElementById('messageModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Pre-fill if logged in
    if (currentUser) {
        document.getElementById('message-name').value = currentUser.name || '';
        document.getElementById('message-email').value = currentUser.email || '';
    }
}

function closeMessageModal() {
    document.getElementById('messageModal').classList.remove('active');
    document.body.style.overflow = '';
}

function sendQuickMessage() {
    const messageText = document.getElementById('landlord-quick-message').value.trim();
    
    if (!messageText) {
        showToast('Please enter a message', 'warning');
        return;
    }
    
    if (!currentUser) {
        openAuthModal('signin');
        return;
    }
    
    const message = {
        id: Date.now(),
        propertyId: currentProperty.id,
        landlordId: currentProperty.landlordId,
        fromUserId: currentUser.userId,
        fromName: currentUser.name,
        fromEmail: currentUser.email,
        message: messageText,
        type: 'message',
        read: false,
        createdAt: new Date().toISOString()
    };
    
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    messages.push(message);
    localStorage.setItem('nestify_messages', JSON.stringify(messages));
    
    showToast('Message sent!', 'success');
    document.getElementById('landlord-quick-message').value = '';
}

document.getElementById('messageForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const message = {
        id: Date.now(),
        propertyId: currentProperty.id,
        landlordId: currentProperty.landlordId,
        fromUserId: currentUser.userId,
        fromName: document.getElementById('message-name').value,
        fromEmail: document.getElementById('message-email').value,
        message: document.getElementById('message-text').value,
        type: 'message',
        read: false,
        createdAt: new Date().toISOString()
    };
    
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    messages.push(message);
    localStorage.setItem('nestify_messages', JSON.stringify(messages));
    
    showToast('Message sent successfully!', 'success');
    closeMessageModal();
    document.getElementById('messageForm').reset();
});

// Rental Booking Form
document.getElementById('rentalBookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        openAuthModal('signin');
        return;
    }
    
    const booking = {
        id: Date.now(),
        propertyId: currentProperty.id,
        landlordId: currentProperty.landlordId,
        tenantId: currentUser.userId,
        tenantName: currentUser.name,
        tenantEmail: currentUser.email,
        tenantPhone: document.getElementById('rental-phone').value,
        checkIn: document.getElementById('check-in-date').value,
        checkOut: document.getElementById('check-out-date').value,
        guests: document.getElementById('guests-count').value,
        notes: document.getElementById('rental-notes').value,
        type: 'rental',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('nestify_bookings', JSON.stringify(bookings));
    
    showToast('Booking request sent! The landlord will review and confirm.', 'success');
    document.getElementById('rentalBookingForm').reset();
});

// Purchase Booking Form
document.getElementById('purchaseBookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        openAuthModal('signin');
        return;
    }
    
    const booking = {
        id: Date.now(),
        propertyId: currentProperty.id,
        landlordId: currentProperty.landlordId,
        buyerId: currentUser.userId,
        buyerName: document.getElementById('buyer-name').value,
        buyerEmail: document.getElementById('buyer-email').value,
        buyerPhone: document.getElementById('buyer-phone').value,
        message: document.getElementById('buyer-message').value,
        type: 'purchase',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('nestify_bookings', JSON.stringify(bookings));
    
    showToast('Purchase request sent! The landlord will contact you.', 'success');
    document.getElementById('purchaseBookingForm').reset();
});

// Close message modal on overlay click
document.getElementById('messageModal').addEventListener('click', function(e) {
    if (e.target === this) closeMessageModal();
});

// Create property card HTML (reused from properties.js)
function createPropertyCard(property) {
    const price = property.type === 'rent' 
        ? `$${property.price.toLocaleString()}/${property.pricePeriod || 'month'}` 
        : `$${property.price.toLocaleString()}`;
    
    const badgeLabel = property.type === 'rent' ? 'For Rent' : 'For Sale';
    
    const image = property.images && property.images.length > 0 
        ? property.images[0] 
        : (property.image || 'https://via.placeholder.com/400x300?text=No+Image');
    
    // Check if favorited
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    let favoriteBtn = '';
    
    if (session) {
        const favorites = JSON.parse(localStorage.getItem('nestify_favorites') || '[]');
        const isFavorited = favorites.some(f => f.userId === session.userId && f.propertyId === property.id);
        
        favoriteBtn = `
            <button class="property-favorite-btn ${isFavorited ? 'active' : ''}" 
                    onclick="toggleFavorite(${property.id}, event)" 
                    title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="fas fa-heart"></i>
            </button>
        `;
    }
    
    return `
        <div class="property-card" onclick="window.location.href='property-detail.html?id=${property.id}'">
            ${favoriteBtn}
            <div class="property-image">
                <img src="${image}" alt="${property.title}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
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

// Toggle favorite (same as properties.js)
function toggleFavorite(propertyId, event) {
    event.stopPropagation();
    event.preventDefault();
    
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    
    if (!session) {
        openAuthModal('signin');
        return;
    }
    
    const favorites = JSON.parse(localStorage.getItem('nestify_favorites') || '[]');
    const existingIndex = favorites.findIndex(f => f.userId === session.userId && f.propertyId === propertyId);
    
    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push({
            userId: session.userId,
            propertyId: propertyId,
            savedAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('nestify_favorites', JSON.stringify(favorites));
    
    // Reload to update button state
    location.reload();
}

// Owner actions
function editThisProperty() {
    window.location.href = 'dashboard.html';
}

function togglePropertyStatus() {
    if (!currentProperty) return;
    
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const index = properties.findIndex(p => p.id === currentProperty.id);
    
    if (index !== -1) {
        properties[index].status = properties[index].status === 'inactive' ? 'active' : 'inactive';
        localStorage.setItem('nestify_properties', JSON.stringify(properties));
        
        showToast(`Property marked as ${properties[index].status}`, 'success');
        location.reload();
    }
}

function deleteThisProperty() {
    if (!currentProperty) return;
    
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        return;
    }
    
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const filtered = properties.filter(p => p.id !== currentProperty.id);
    localStorage.setItem('nestify_properties', JSON.stringify(filtered));
    
    showToast('Property deleted successfully!', 'success');
    window.location.href = 'dashboard.html';
}

// Contact Modal
function openContactModal() {
    if (!currentUser) {
        openAuthModal('signin');
        return;
    }
    document.getElementById('contactModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const message = {
        id: Date.now(),
        propertyId: currentProperty.id,
        landlordId: currentProperty.landlordId,
        fromUserId: currentUser.userId,
        fromName: document.getElementById('contact-name').value,
        fromEmail: document.getElementById('contact-email').value,
        fromPhone: document.getElementById('contact-phone').value,
        message: document.getElementById('contact-message').value,
        type: 'contact',
        read: false,
        createdAt: new Date().toISOString()
    };
    
    // Save message
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    messages.push(message);
    localStorage.setItem('nestify_messages', JSON.stringify(messages));
    
    showToast('Message sent! The landlord will contact you soon.', 'success');
    closeContactModal();
    document.getElementById('contactForm').reset();
});

// Booking Modal
function openBookingModal() {
    if (!currentUser) {
        openAuthModal('signin');
        return;
    }
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('booking-date').min = today;
    
    document.getElementById('bookingModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const booking = {
        id: Date.now(),
        propertyId: currentProperty.id,
        landlordId: currentProperty.landlordId,
        tenantId: currentUser.userId,
        tenantName: document.getElementById('booking-name').value,
        tenantEmail: document.getElementById('booking-email').value,
        tenantPhone: document.getElementById('booking-phone').value,
        scheduledDate: document.getElementById('booking-date').value,
        notes: document.getElementById('booking-notes').value,
        type: 'viewing',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // Save booking
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('nestify_bookings', JSON.stringify(bookings));
    
    showToast('Viewing request sent! The landlord will confirm soon.', 'success');
    closeBookingModal();
    document.getElementById('bookingForm').reset();
});

// Close modals on overlay click
document.getElementById('contactModal').addEventListener('click', function(e) {
    if (e.target === this) closeContactModal();
});

document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) closeBookingModal();
});

// Auth modal function (called from auth.js)
function openAuthModal(tab) {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Switch to specified tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.form-content').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`.tab[data-tab="${tab}"]`)?.classList.add('active');
        document.getElementById(tab)?.classList.add('active');
    }
}
