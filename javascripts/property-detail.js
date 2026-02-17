document.addEventListener('DOMContentLoaded', function() {
    StorageService.initializeSeedData();
    
    const user = AuthService.getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
    
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        AuthService.logout();
    });
    
    document.getElementById('userAvatar').addEventListener('click', () => {
        document.getElementById('userDropdown').classList.toggle('show');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#userProfile')) {
            document.getElementById('userDropdown').classList.remove('show');
        }
    });
    
    // Get property ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (!propertyId) {
        window.location.href = 'property-listings.html';
        return;
    }
    
    const property = PropertyService.getPropertyById(propertyId);
    
    if (!property) {
        window.location.href = 'property-listings.html';
        return;
    }
    
    // Increment view count
    PropertyService.updateProperty(propertyId, { views: (property.views || 0) + 1 }, false);
    
    // Populate property details
    populatePropertyDetails(property);
    
    // Check if favorite
    updateFavoriteButton(propertyId);
    
    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkInDate').min = today;
    document.getElementById('checkOutDate').min = today;
    
    // Check-in date change
    document.getElementById('checkInDate').addEventListener('change', function() {
        const checkOut = document.getElementById('checkOutDate');
        checkOut.min = this.value;
        if (checkOut.value && checkOut.value < this.value) {
            checkOut.value = this.value;
        }
    });
    
    // Request to Book
    document.getElementById('requestBookBtn').addEventListener('click', function() {
        const checkIn = document.getElementById('checkInDate').value;
        const checkOut = document.getElementById('checkOutDate').value;
        
        if (!checkIn || !checkOut) {
            alert('Please select check-in and check-out dates');
            return;
        }
        
        const bookingData = {
            propertyId: propertyId,
            checkIn: checkIn,
            checkOut: checkOut,
            guests: document.getElementById('guestCount').value,
            message: 'Booking request from tenant'
        };
        
        const result = BookingService.createBooking(bookingData);
        
        if (result.success) {
            showSuccessModal();
        } else {
            alert(result.error || 'Failed to create booking');
        }
    });
    
    // Send Message
    document.getElementById('messageLandlordBtn').addEventListener('click', function() {
        document.getElementById('messageModal').classList.add('show');
    });
    
    document.getElementById('closeMessageModal').addEventListener('click', function() {
        document.getElementById('messageModal').classList.remove('show');
    });
    
    document.getElementById('messageForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = {
            id: StorageService.generateId(),
            senderId: user.id,
            receiverId: property.ownerId,
            propertyId: propertyId,
            content: document.getElementById('messageText').value,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        const messages = StorageService.getMessages();
        messages.push(message);
        StorageService.set('nestify_messages', messages);
        
        document.getElementById('messageModal').classList.remove('show');
        document.getElementById('messageText').value = '';
        alert('Message sent to landlord!');
    });
    
    // Favorite button
    document.getElementById('favoriteBtn').addEventListener('click', function() {
        toggleFavorite(propertyId);
    });
});

function populatePropertyDetails(property) {
    // Title and breadcrumb
    document.getElementById('breadcrumbTitle').textContent = property.title;
    document.getElementById('propertyTitle').textContent = property.title;
    document.title = `${property.title} - Nestify`;
    
    // Address
    document.getElementById('propertyAddress').innerHTML = `
        <span class="material-symbols-outlined">location_on</span>
        <span>${property.address || 'Location not specified'}</span>
    `;
    
    // Price
    const price = property.price || 0;
    document.getElementById('propertyPrice').innerHTML = `$${formatPrice(price)}<span>/mo</span>`;
    document.getElementById('sidebarPrice').textContent = `$${formatPrice(price)}`;
    
    // Status
    document.getElementById('propertyStatus').textContent = property.status === 'available' ? 'For Sale' : 'Sold';
    
    // Added date
    const createdDate = new Date(property.createdAt);
    const daysAgo = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
    document.getElementById('addedDate').textContent = daysAgo === 0 ? 'Added today' : `Added ${daysAgo} days ago`;
    
    // Details
    document.getElementById('bedroomCount').textContent = property.bedrooms || 0;
    document.getElementById('bathroomCount').textContent = property.bathrooms || 0;
    document.getElementById('sqftCount').textContent = property.sqft || 0;
    
    // Description
    document.getElementById('propertyDescription').textContent = 
        property.description || 'No description available for this property.';
    
    // Images
    const images = property.images && property.images.length > 0 
        ? property.images 
        : ['./img/card1.jpg', './img/card1.jpg', './img/card1.jpg', './img/card1.jpg'];
    
    document.getElementById('mainImageSrc').src = images[0];
    
    const thumbnailGrid = document.getElementById('thumbnailGrid');
    thumbnailGrid.innerHTML = images.map((img, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeImage('${img}', this)">
            <img src="${img}" alt="Thumbnail ${index + 1}">
        </div>
    `).join('');
    
    // Landlord info
    const landlord = StorageService.getUsers().find(u => u.id === property.ownerId);
    if (landlord) {
        document.getElementById('landlordName').textContent = landlord.username;
        document.getElementById('landlordAvatar').textContent = landlord.username.charAt(0).toUpperCase();
    }
}

function changeImage(src, thumbnail) {
    document.getElementById('mainImageSrc').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}

function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
        return (price / 1000).toFixed(0) + 'k';
    }
    return price.toString();
}

function showSuccessModal() {
    document.getElementById('successModal').classList.add('show');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('show');
    window.location.href = 'tenant-profile.html';
}

function updateFavoriteButton(propertyId) {
    const favorites = JSON.parse(localStorage.getItem('nestify_favorites')) || [];
    const btn = document.getElementById('favoriteBtn');
    
    if (favorites.includes(propertyId)) {
        btn.classList.add('active');
    }
}

function toggleFavorite(propertyId) {
    let favorites = JSON.parse(localStorage.getItem('nestify_favorites')) || [];
    const btn = document.getElementById('favoriteBtn');
    
    const index = favorites.indexOf(propertyId);
    if (index > -1) {
        favorites.splice(index, 1);
        btn.classList.remove('active');
    } else {
        favorites.push(propertyId);
        btn.classList.add('active');
    }
    
    localStorage.setItem('nestify_favorites', JSON.stringify(favorites));
}
