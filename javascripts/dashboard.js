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
                    <span>/ ${property.type}</span>
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

// Add new property
async function addProperty(e) {
    e.preventDefault();
    
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    
    // Get selected amenities
    const amenities = [];
    document.querySelectorAll('input[name="amenities"]:checked').forEach(checkbox => {
        amenities.push(checkbox.value);
    });
    
    // Handle image upload with compression
    const imageFiles = document.getElementById('property-images').files;
    
    if (imageFiles.length < 2) {
        alert('Please upload at least 2 images');
        return;
    }
    
    if (imageFiles.length > 5) {
        alert('Maximum 5 images allowed');
        return;
    }
    
    // Compress all images
    const images = [];
    for (let file of imageFiles) {
        const compressed = await compressImage(file);
        images.push(compressed);
    }
    
    // Check existing properties to determine if this should be featured
    const existingProperties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const landlordProperties = existingProperties.filter(p => p.landlordId === session.userId);
    const shouldFeature = landlordProperties.length < 4; // First 4 properties are featured
    
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
        images: images,
        amenities: amenities,
        featured: shouldFeature,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    properties.push(property);
    localStorage.setItem('nestify_properties', JSON.stringify(properties));
    
    // Close modal and reload
    closePropertyModal();
    document.getElementById('addPropertyForm').reset();
    loadLandlordProperties();
    renderFinance();
    
    alert('Property added successfully!' + (shouldFeature ? ' (Featured)' : ''));
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

// Edit property (placeholder)
function editProperty(id) {
    alert('Edit functionality coming soon!');
}

// Navigation between sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.properties-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show/hide dashboard overview based on section
    const dashboardOverview = document.getElementById('dashboard-overview');
    if (sectionId === 'dashboard') {
        dashboardOverview.style.display = 'block';
        // Also show properties section when on dashboard
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

// Render Bookings Section
function renderBookings() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter bookings for this landlord's properties
    const myPropertyIds = properties.filter(p => p.landlordId === session.userId).map(p => p.id);
    const myBookings = bookings.filter(b => myPropertyIds.includes(b.propertyId));
    
    const container = document.getElementById('bookings-list');
    
    if (myBookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No Bookings Yet</h3>
                <p>When tenants book your properties, they will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myBookings.map(booking => {
        const property = properties.find(p => p.id === booking.propertyId);
        return `
            <div class="booking-item">
                <div class="booking-property">
                    <h4>${property ? property.title : 'Unknown Property'}</h4>
                    <p>${property ? property.location : ''}</p>
                </div>
                <div class="booking-dates">
                    ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}
                </div>
                <span class="booking-status ${booking.status}">${booking.status}</span>
            </div>
        `;
    }).join('');
}

// Render Messages Section
function renderMessages() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    const messages = JSON.parse(localStorage.getItem('nestify_messages') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter messages for this landlord's properties
    const myPropertyIds = properties.filter(p => p.landlordId === session.userId).map(p => p.id);
    const myMessages = messages.filter(m => myPropertyIds.includes(m.propertyId));
    
    const container = document.getElementById('messages-list');
    
    if (myMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope"></i>
                <h3>No Messages Yet</h3>
                <p>When tenants or buyers contact you, messages will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myMessages.map(message => `
        <div class="message-item ${message.read ? '' : 'unread'}">
            <div class="message-avatar">${message.fromName.charAt(0)}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-name">${message.fromName}</span>
                    <span class="message-date">${new Date(message.createdAt).toLocaleDateString()}</span>
                </div>
                <p class="message-preview">${message.message}</p>
            </div>
        </div>
    `).join('');
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
    const session = checkDashboardAuth();
    if (!session) return;
    
    updateDashboardUI(session);
    loadLandlordProperties();
    
    // Set dashboard as active by default
    showSection('dashboard');
    
    // Render other sections
    renderBookings();
    renderMessages();
    renderTenants();
    renderFinance();
    
    // Nav link click handlers
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const sectionId = href.replace('#', '');
            showSection(sectionId);
        });
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
