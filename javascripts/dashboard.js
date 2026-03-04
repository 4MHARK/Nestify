// ========================
// LANDLORD DASHBOARD
// ========================

// Check if user is logged in and is landlord
function checkDashboardAuth() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    
    if (!session) {
        window.location.href = '../index.html';
        return null;
    }
    
    if (session.role !== 'landlord') {
        alert('Access denied. Landlord account required.');
        window.location.href = '../index.html';
        return null;
    }
    
    return session;
}

// Update dashboard with user info
function updateDashboardUI(session) {
    const firstName = session.name.split(' ')[0];
    document.getElementById('welcome-name').textContent = firstName;
    document.getElementById('user-name').textContent = session.name;
    document.getElementById('user-avatar').textContent = session.name.charAt(0).toUpperCase();
}

// Load and landlord properties
function loadLandlordProperties() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter properties for this landlord
    const myProperties = properties.filter(p => p.landlordId === session.userId);
    
    // Update stats
    document.getElementById('total-properties').textContent = myProperties.length;
    
    // Get bookings count
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    const myPropertyIds = myProperties.map(p => p.id);
    const activeBookings = bookings.filter(b => myPropertyIds.includes(b.propertyId) && b.status === 'confirmed').length;
    document.getElementById('active-bookings').textContent = activeBookings;
    
    // Calculate total revenue (portfolio value)
    const totalValue = myProperties.reduce((sum, p) => sum + p.price, 0);
    document.getElementById('total-revenue').textContent = '$' + totalValue.toLocaleString();
    
    // Get tenants count
    const tenants = JSON.parse(localStorage.getItem('nestify_tenants') || '[]');
    const activeTenants = tenants.filter(t => myPropertyIds.includes(t.propertyId)).length;
    document.getElementById('total-tenants').textContent = activeTenants;
    
    // Render properties
    const container = document.getElementById('my-properties');
    
    if (myProperties.length === 0) {
        container.innerHTML = `
            <div class="no-properties">
                <i class="fas fa-building"></i>
                <h3>No Properties Yet</h3>
                <p>Click "Add Property" to list your first property</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myProperties.map(property => `
        <div class="property-card" data-id="${property.id}">
            <div class="property-image">
                <img src="${property.images ? property.images[0] : property.image}" alt="${property.title}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                <span class="property-badge badge-${property.type}">
                    ${property.type === 'sale' ? 'For Sale' : 'For Rent'}
                </span>
            </div>
            <div class="property-content">
                <div class="property-price">
                    $${property.price.toLocaleString()}
                    <span>/ ${property.type === 'rent' ? (property.pricePeriod || 'month') : property.type}</span>
                </div>
                <h3 class="property-title">${property.title}</h3>
                <p class="property-location">
                    <i class="fas fa-map-marker-alt"></i> ${property.location}
                </p>
                <div class="property-details">
                    <span><i class="fas fa-bed"></i> ${property.bedrooms} Beds</span>
                    <span><i class="fas fa-bath"></i> ${property.bathrooms} Baths</span>
                    <span><i class="fas fa-ruler-combined"></i> ${property.sqft || 'N/A'} sqft</span>
                </div>
                <div class="property-card-actions">
                    <button class="edit-btn" onclick="editProperty(${property.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteProperty(${property.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Add Property Modal Functions
function openPropertyModal() {
    document.getElementById('propertyModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePropertyModal() {
    document.getElementById('propertyModal').classList.remove('active');
    document.body.style.overflow = '';
    resetPropertyModal();
}

// Compress image to base64
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// Add new property (also handles edit)
async function addProperty(e) {
    e.preventDefault();
    
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const propertyId = document.getElementById('property-id').value;
    const isEditing = propertyId !== '';
    
    // Get selected amenities
    const amenities = [];
    document.querySelectorAll('input[name="amenities"]:checked').forEach(checkbox => {
        amenities.push(checkbox.value);
    });
    
    // Handle image upload
    const imageFiles = document.getElementById('property-images').files;
    let finalImages = [];
    
    if (isEditing) {
        // When editing: combine kept current images + new uploads
        finalImages = [...currentEditingImages];
        
        // Add new images if any uploaded
        if (imageFiles.length > 0) {
            for (let file of imageFiles) {
                const compressed = await compressImage(file);
                finalImages.push(compressed);
            }
        }
        
        // Validate total images
        if (finalImages.length < 2) {
            alert('Please have at least 2 images total');
            return;
        }
        
        if (finalImages.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }
    } else {
        // When adding new: require 2-5 images
        if (imageFiles.length < 2) {
            alert('Please upload at least 2 images');
            return;
        }
        
        if (imageFiles.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }
        
        // Compress all images for new property
        for (let file of imageFiles) {
            const compressed = await compressImage(file);
            finalImages.push(compressed);
        }
    }
    
    // Get existing properties
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    if (isEditing) {
        // Update existing property - only editable fields
        const propertyIndex = properties.findIndex(p => p.id === parseInt(propertyId));
        if (propertyIndex !== -1) {
            properties[propertyIndex].title = document.getElementById('property-title').value;
            properties[propertyIndex].price = parseInt(document.getElementById('property-price').value);
            properties[propertyIndex].bedrooms = parseInt(document.getElementById('property-bedrooms').value);
            properties[propertyIndex].bathrooms = parseInt(document.getElementById('property-bathrooms').value);
            properties[propertyIndex].images = finalImages;
            properties[propertyIndex].amenities = amenities;
            properties[propertyIndex].pricePeriod = document.getElementById('property-type').value === 'rent' 
                ? document.getElementById('price-period').value 
                : 'month';
        }
    } else {
        // Create new property
        const landlordProperties = properties.filter(p => p.landlordId === session.userId);
        const shouldFeature = landlordProperties.length < 4;
        
        const property = {
            id: Date.now(),
            landlordId: session.userId,
            title: document.getElementById('property-title').value,
            type: document.getElementById('property-type').value,
            price: parseInt(document.getElementById('property-price').value),
            location: document.getElementById('property-location').value,
            bedrooms: parseInt(document.getElementById('property-bedrooms').value),
            bathrooms: parseInt(document.getElementById('property-bathrooms').value),
            sqft: parseInt(document.getElementById('property-sqft').value) || 0,
            images: finalImages,
            amenities: amenities,
            pricePeriod: document.getElementById('property-type').value === 'rent' 
                ? document.getElementById('price-period').value 
                : 'month',
            featured: shouldFeature,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        properties.push(property);
    }
    
    // Save to localStorage
    localStorage.setItem('nestify_properties', JSON.stringify(properties));
    
    // Close modal and reload
    closePropertyModal();
    resetPropertyModal();
    document.getElementById('addPropertyForm').reset();
    loadLandlordProperties();
    renderFinance();
    
    if (isEditing) {
        alert('Property updated successfully!');
    } else {
        alert('Property added successfully!');
    }
}

// Delete property
function deleteProperty(id) {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const filtered = properties.filter(p => p.id !== id);
    localStorage.setItem('nestify_properties', JSON.stringify(filtered));
    
    loadLandlordProperties();
    renderFinance();
    alert('Property deleted!');
}

// Track current images when editing
let currentEditingImages = [];

// Edit property
function editProperty(id) {
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const property = properties.find(p => p.id === id);
    
    if (!property) return;
    
    // Set property ID for editing
    document.getElementById('property-id').value = id;
    
    // Populate form fields (all fields for display, editable ones for editing)
    document.getElementById('property-title').value = property.title;
    document.getElementById('property-type').value = property.type;
    document.getElementById('property-price').value = property.price;
    document.getElementById('property-location').value = property.location;
    document.getElementById('property-bedrooms').value = property.bedrooms;
    document.getElementById('property-bathrooms').value = property.bathrooms;
    document.getElementById('property-sqft').value = property.sqft || '';
    
    // Handle price period
    const pricePeriodGroup = document.getElementById('price-period-group');
    if (property.type === 'rent') {
        pricePeriodGroup.style.display = 'block';
        document.getElementById('price-period').value = property.pricePeriod || 'month';
    } else {
        pricePeriodGroup.style.display = 'none';
    }
    
    // Make non-editable fields readonly/disabled when editing
    document.getElementById('property-title').setAttribute('readonly', 'readonly');
    document.getElementById('property-title').classList.add('readonly-field');
    document.getElementById('property-type').setAttribute('disabled', 'disabled');
    document.getElementById('property-location').setAttribute('readonly', 'readonly');
    document.getElementById('property-location').classList.add('readonly-field');
    document.getElementById('property-sqft').setAttribute('readonly', 'readonly');
    document.getElementById('property-sqft').classList.add('readonly-field');
    
    // Store current images (handle both old single image and new array format)
    if (property.images && Array.isArray(property.images)) {
        currentEditingImages = [...property.images];
    } else if (property.image) {
        currentEditingImages = [property.image];
    } else {
        currentEditingImages = [];
    }
    
    // Show current images
    showCurrentImages();
    
    // Set amenities checkboxes
    document.querySelectorAll('input[name="amenities"]').forEach(checkbox => {
        checkbox.checked = property.amenities && property.amenities.includes(checkbox.value);
    });
    
    // Update modal for editing mode
    document.querySelector('.form-title').textContent = 'Edit Property';
    document.querySelector('.btn-submit').textContent = 'Update Property';
    
    // Make file input not required when editing
    document.getElementById('property-images').removeAttribute('required');
    
    // Open modal
    openPropertyModal();
}

// Show current images in the modal
function showCurrentImages() {
    const container = document.getElementById('current-images');
    container.innerHTML = currentEditingImages.map((img, index) => `
        <div class="current-image-item">
            <img src="${img}" alt="Property image ${index + 1}">
            <button type="button" class="remove-image" onclick="removeCurrentImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Remove current image
function removeCurrentImage(index) {
    currentEditingImages.splice(index, 1);
    showCurrentImages();
}

// Reset property modal
function resetPropertyModal() {
    document.getElementById('property-id').value = '';
    document.getElementById('addPropertyForm').reset();
    document.getElementById('current-images').innerHTML = '';
    currentEditingImages = [];
    document.querySelector('.form-title').textContent = 'Add New Property';
    document.querySelector('.btn-submit').textContent = 'Add Property';
    document.getElementById('property-images').setAttribute('required', 'required');
    
    // Remove readonly/disabled from fields
    document.getElementById('property-title').removeAttribute('readonly');
    document.getElementById('property-title').classList.remove('readonly-field');
    document.getElementById('property-type').removeAttribute('disabled');
    document.getElementById('property-location').removeAttribute('readonly');
    document.getElementById('property-location').classList.remove('readonly-field');
    document.getElementById('property-sqft').removeAttribute('readonly');
    document.getElementById('property-sqft').classList.remove('readonly-field');
    
    // Hide price period
    document.getElementById('price-period-group').style.display = 'none';
}

// Navigation between sections
function showSection(sectionId) {
    // Save to localStorage
    localStorage.setItem('dashboard_active_section', sectionId);
    
    // Hide all sections with fade out
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
        section.style.opacity = '0';
    });
    document.querySelectorAll('.properties-section').forEach(section => {
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
            document.getElementById('properties-section')?.classList.add('active');
        } else {
            dashboardOverview.style.display = 'none';
        }
        
        // Show selected section (except for dashboard which handled above)
        if (sectionId !== 'dashboard') {
            const section = document.getElementById(sectionId + '-section');
            if (section) {
                section.classList.add('active');
            }
        }
        
        // Fade in
        dashboardOverview.style.transition = 'opacity 0.3s ease';
        dashboardOverview.style.opacity = '1';
        
        document.querySelectorAll('.dashboard-section.active, .properties-section.active').forEach(section => {
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

// Track current booking filter
let currentBookingFilter = 'all';

// Render Bookings Section
function renderBookings(filter = 'all') {
    currentBookingFilter = filter;
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter bookings for this landlord's properties
    const myPropertyIds = properties.filter(p => p.landlordId === session.userId).map(p => p.id);
    let myBookings = bookings.filter(b => myPropertyIds.includes(b.propertyId));
    
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
                <p>${filter === 'all' ? 'When tenants schedule viewings, they will appear here' : 'No bookings with this status'}</p>
            </div>
        `;
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
        
        const tenantName = booking.tenantName || booking.buyerName || 'Unknown';
        const tenantEmail = booking.tenantEmail || booking.buyerEmail || 'N/A';
        const tenantPhone = booking.tenantPhone || booking.buyerPhone || '';
        
        let actionButtons = '';
        if (booking.status === 'pending') {
            actionButtons = `
                <div class="booking-actions">
                    <button class="btn btn-confirm" onclick="confirmBooking(${booking.id})">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn btn-decline" onclick="declineBooking(${booking.id})">
                        <i class="fas fa-times"></i> Decline
                    </button>
                </div>
            `;
        } else if (booking.status === 'confirmed' && booking.type === 'rental') {
            actionButtons = `
                <div class="booking-actions">
                    <button class="btn btn-complete" onclick="completeBooking(${booking.id})">
                        <i class="fas fa-check-double"></i> Mark Completed
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="booking-item">
                <div class="booking-property">
                    <h4>${property ? property.title : 'Unknown Property'}</h4>
                    <p>${property ? property.location : ''}</p>
                    <span class="booking-type-badge">${booking.type === 'rental' ? 'Rental Request' : (booking.type === 'purchase' ? 'Purchase Request' : 'Viewing Request')}</span>
                    <div class="booking-tenant-info">
                        <p><strong>From:</strong> ${tenantName}</p>
                        <p><i class="fas fa-envelope"></i> ${tenantEmail}</p>
                        ${tenantPhone ? `<p><i class="fas fa-phone"></i> ${tenantPhone}</p>` : ''}
                        ${booking.guests ? `<p><i class="fas fa-users"></i> ${booking.guests} Guests</p>` : ''}
                    </div>
                    ${actionButtons}
                </div>
                <div class="booking-info">
                    <div class="booking-date">
                        <i class="fas fa-calendar"></i> ${formattedDate}
                    </div>
                    <span class="booking-status ${booking.status}">${booking.status}</span>
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

// Filter bookings
function filterBookings(filter) {
    renderBookings(filter);
}

// Booking actions
function confirmBooking(bookingId) {
    updateBookingStatus(bookingId, 'confirmed');
    alert('Booking accepted! The tenant has been notified and can now proceed to payment.');
}

function declineBooking(bookingId) {
    if (confirm('Are you sure you want to decline this booking?')) {
        updateBookingStatus(bookingId, 'declined');
    }
}

function completeBooking(bookingId) {
    updateBookingStatus(bookingId, 'completed');
}

function updateBookingStatus(bookingId, status) {
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    const index = bookings.findIndex(b => b.id === bookingId);
    
    if (index !== -1) {
        bookings[index].status = status;
        bookings[index].updatedAt = new Date().toISOString();
        localStorage.setItem('nestify_bookings', JSON.stringify(bookings));
        
        renderBookings(currentBookingFilter);
        loadLandlordProperties(); // Update stats
    }
}

// Render Messages Section
function renderMessages() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter messages for this landlord's properties
    const myPropertyIds = properties.filter(p => p.landlordId === session.userId).map(p => p.id);
    let myMessages = messages.filter(m => myPropertyIds.includes(m.propertyId));
    
    // Sort by date (newest first)
    myMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const container = document.getElementById('messages-list');
    
    if (myMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope"></i>
                <h3>No Messages Yet</h3>
                <p>When tenants contact you, messages will appear here</p>
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
                <div class="message-avatar">${message.fromName.charAt(0)}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-name">${message.fromName}</span>
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

// Update notification badges
function updateNotificationBadges() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    if (!session) return;
    
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    
    // Count unread messages for this landlord
    const myPropertyIds = properties.filter(p => p.landlordId === session.userId).map(p => p.id);
    const unreadMessages = messages.filter(m => myPropertyIds.includes(m.propertyId) && !m.read).length;
    
    // Count pending bookings for this landlord
    const pendingBookings = bookings.filter(b => myPropertyIds.includes(b.propertyId) && b.status === 'pending').length;
    
    // Update message badge
    const messagesBadge = document.getElementById('messages-badge');
    if (messagesBadge) {
        if (unreadMessages > 0) {
            messagesBadge.textContent = unreadMessages > 9 ? '9+' : unreadMessages;
            messagesBadge.style.display = 'inline-flex';
        } else {
            messagesBadge.style.display = 'none';
        }
    }
    
    // Update bookings badge
    const bookingsBadge = document.getElementById('bookings-badge');
    if (bookingsBadge) {
        if (pendingBookings > 0) {
            bookingsBadge.textContent = pendingBookings > 9 ? '9+' : pendingBookings;
            bookingsBadge.style.display = 'inline-flex';
        } else {
            bookingsBadge.style.display = 'none';
        }
    }
}

// View message detail
let currentMessageId = null;

function viewMessage(messageId) {
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    const message = messages.find(m => m.id === messageId);
    
    if (!message) return;
    
    currentMessageId = messageId;
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const property = properties.find(p => p.id === message.propertyId);
    
    document.getElementById('message-sender-avatar').textContent = message.fromName.charAt(0);
    document.getElementById('message-sender-name').textContent = message.fromName;
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
    
    // Show/hide mark as read button
    const markReadBtn = document.getElementById('mark-read-btn');
    if (message.read) {
        markReadBtn.style.display = 'none';
    } else {
        markReadBtn.style.display = 'block';
    }
    
    document.getElementById('messageDetailModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Mark as read automatically when viewing
    if (!message.read) {
        markMessageAsRead();
    }
}

function closeMessageModal() {
    document.getElementById('messageDetailModal').classList.remove('active');
    document.body.style.overflow = '';
    currentMessageId = null;
}

function markMessageAsRead() {
    if (!currentMessageId) return;
    
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    const index = messages.findIndex(m => m.id === currentMessageId);
    
    if (index !== -1 && !messages[index].read) {
        messages[index].read = true;
        localStorage.setItem('nestify_messages', JSON.stringify(messages));
        
        document.getElementById('mark-read-btn').style.display = 'none';
        renderMessages();
        updateNotificationBadges();
    }
}

function sendReply() {
    if (!currentMessageId) return;
    
    const replyText = document.getElementById('reply-message').value.trim();
    if (!replyText) {
        alert('Please enter a reply message');
        return;
    }
    
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    const messageIndex = messages.findIndex(m => m.id === currentMessageId);
    
    if (messageIndex === -1) return;
    
    const originalMessage = messages[messageIndex];
    
    // Create reply message
    const replyMessage = {
        id: Date.now(),
        propertyId: originalMessage.propertyId,
        landlordId: session.userId,
        toUserId: originalMessage.fromUserId,
        fromUserId: session.userId,
        fromName: session.name,
        fromEmail: session.email,
        message: replyText,
        type: 'reply',
        replyTo: originalMessage.id,
        read: false,
        createdAt: new Date().toISOString()
    };
    
    messages.push(replyMessage);
    localStorage.setItem('nestify_messages', JSON.stringify(messages));
    
    alert('Reply sent successfully!');
    document.getElementById('reply-message').value = '';
    closeMessageModal();
    renderMessages();
}

// Render Tenants Section
function renderTenants() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const tenants = JSON.parse(localStorage.getItem('nestify_tenants') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter tenants for this landlord's properties
    const myPropertyIds = properties.filter(p => p.landlordId === session.userId).map(p => p.id);
    const myTenants = tenants.filter(t => myPropertyIds.includes(t.propertyId));
    
    const container = document.getElementById('tenants-list');
    
    if (myTenants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Tenants Yet</h3>
                <p>Your tenants will appear here once they rent your properties</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myTenants.map(tenant => {
        const property = properties.find(p => p.id === tenant.propertyId);
        return `
            <div class="tenant-item">
                <div class="tenant-avatar">${tenant.tenantName.charAt(0)}</div>
                <div class="tenant-info">
                    <h4>${tenant.tenantName}</h4>
                    <p>${property ? property.title : 'Unknown Property'}</p>
                </div>
                <div class="tenant-lease">
                    <div class="lease-dates">
                        ${new Date(tenant.leaseStart).toLocaleDateString()} - ${new Date(tenant.leaseEnd).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Finance Section
function renderFinance() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter properties for this landlord
    const myProperties = properties.filter(p => p.landlordId === session.userId);
    
    // Calculate stats
    const forSale = myProperties.filter(p => p.type === 'sale');
    const forRent = myProperties.filter(p => p.type === 'rent');
    
    const totalSaleValue = forSale.reduce((sum, p) => sum + p.price, 0);
    const totalRentValue = forRent.reduce((sum, p) => sum + (p.price || 0), 0);
    const portfolioValue = totalSaleValue + totalRentValue;
    
    const container = document.getElementById('finance-stats');
    
    container.innerHTML = `
        <div class="finance-card">
            <div class="finance-icon">
                <i class="fas fa-building"></i>
            </div>
            <div class="finance-value">${myProperties.length}</div>
            <div class="finance-label">Total Properties</div>
        </div>
        <div class="finance-card">
            <div class="finance-icon">
                <i class="fas fa-sale"></i>
            </div>
            <div class="finance-value">${forSale.length}</div>
            <div class="finance-label">Properties for Sale</div>
        </div>
        <div class="finance-card">
            <div class="finance-icon">
                <i class="fas fa-key"></i>
            </div>
            <div class="finance-value">${forRent.length}</div>
            <div class="finance-label">Properties for Rent</div>
        </div>
        <div class="finance-card">
            <div class="finance-icon">
                <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="finance-value">$${portfolioValue.toLocaleString()}</div>
            <div class="finance-label">Portfolio Value</div>
        </div>
    `;
    
    // Update stats in header
    document.getElementById('total-revenue').textContent = '$' + portfolioValue.toLocaleString();
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initializing...');
    
    const session = checkDashboardAuth();
    console.log('Session:', session);
    if (!session) return;
    
    updateDashboardUI(session);
    loadLandlordProperties();
    
    updateDashboardUI(session);
    loadLandlordProperties();
    
    // Load saved section or default to dashboard
    const savedSection = localStorage.getItem('dashboard_active_section') || 'dashboard';
    showSection(savedSection);
    
    // Render other sections
    renderBookings();
    renderMessages();
    renderTenants();
    renderFinance();
    updateNotificationBadges();
    
    // Nav link click handlers
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const sectionId = href.replace('#', '');
            showSection(sectionId);
        });
    });
    
    // Property type change - show/hide price period
    document.getElementById('property-type')?.addEventListener('change', function() {
        const pricePeriodGroup = document.getElementById('price-period-group');
        if (this.value === 'rent') {
            pricePeriodGroup.style.display = 'block';
        } else {
            pricePeriodGroup.style.display = 'none';
        }
    });
    
    // Modal event listeners
    document.getElementById('add-property-btn')?.addEventListener('click', openPropertyModal);
    document.getElementById('closePropertyModal')?.addEventListener('click', closePropertyModal);
    document.getElementById('propertyModal')?.addEventListener('click', function(e) {
        if (e.target === this) closePropertyModal();
    });
    
    // Form submission
    document.getElementById('addPropertyForm')?.addEventListener('submit', addProperty);
    
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
