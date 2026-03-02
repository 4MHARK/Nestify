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
    document.getElementById('active-bookings').textContent = '0'; // Placeholder
    document.getElementById('total-revenue').textContent = '$0'; // Placeholder
    document.getElementById('total-tenants').textContent = '0'; // Placeholder
    
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
                <img src="${property.image}" alt="${property.title}">
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

// Add new property
function addProperty(e) {
    e.preventDefault();
    
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    
    // Get selected amenities
    const amenities = [];
    document.querySelectorAll('input[name="amenities"]:checked').forEach(checkbox => {
        amenities.push(checkbox.value);
    });
    
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
        image: document.getElementById('property-image').value,
        amenities: amenities,
        featured: false,
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
    
    alert('Property added successfully!');
}

// Delete property
function deleteProperty(id) {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    const filtered = properties.filter(p => p.id !== id);
    localStorage.setItem('nestify_properties', JSON.stringify(filtered));
    
    loadLandlordProperties();
    alert('Property deleted!');
}

// Edit property (placeholder)
function editProperty(id) {
    alert('Edit functionality coming soon!');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    const session = checkDashboardAuth();
    if (!session) return;
    
    updateDashboardUI(session);
    loadLandlordProperties();
    
    // Modal event listeners
    document.getElementById('add-property-btn')?.addEventListener('click', openPropertyModal);
    document.getElementById('closePropertyModal')?.addEventListener('click', closePropertyModal);
    document.getElementById('propertyModal')?.addEventListener('click', function(e) {
        if (e.target === this) closePropertyModal();
    });
    
    // Form submission
    document.getElementById('addPropertyForm')?.addEventListener('submit', addProperty);
});
