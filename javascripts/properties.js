// ========================
// PROPERTY RENDERING
// ========================

// Load properties and render on home page
function loadHomePageProperties() {
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    if (properties.length === 0) {
        // No properties yet - show empty state
        renderEmptyState();
        return;
    }
    
    // Sort by date (newest first)
    const sortedProperties = [...properties].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Get featured properties (newest 3)
    const featured = sortedProperties.slice(0, 3);
    
    // Get properties for sale
    const forSale = sortedProperties.filter(p => p.type === 'sale');
    
    // Get properties for rent
    const forRent = sortedProperties.filter(p => p.type === 'rent');
    
    // Render each section
    renderPropertyGrid('featured-properties', featured);
    renderPropertyGrid('sale-properties', forSale.slice(0, 3));
    renderPropertyGrid('rent-properties', forRent.slice(0, 3));
}

// Render empty state
function renderEmptyState() {
    const containers = ['featured-properties', 'sale-properties', 'rent-properties'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div class="no-properties" style="grid-column: 1 / -1;">
                    <i class="fas fa-building"></i>
                    <h3>No Properties Available</h3>
                    <p>Check back soon for new listings</p>
                </div>
            `;
        }
    });
}

// Render property cards
function renderPropertyGrid(containerId, properties) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div class="no-properties">
                <i class="fas fa-building"></i>
                <h3>No Properties</h3>
                <p>No properties in this category yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = properties.map(property => createPropertyCard(property)).join('');
}

// Create property card HTML
function createPropertyCard(property) {
    const price = property.type === 'rent' 
        ? `$${property.price.toLocaleString()}/mo` 
        : `$${property.price.toLocaleString()}`;
    
    const badgeLabel = property.type === 'rent' ? 'For Rent' : 'For Sale';
    
    return `
        <div class="property-card" onclick="handlePropertyClick(${property.id})">
            <div class="property-image">
                <img src="${property.image}" alt="${property.title}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
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

// Handle property card click
function handlePropertyClick(propertyId) {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    
    if (!session) {
        // Not logged in - open auth modal
        openAuthModal('signin');
    } else {
        // Logged in - go to property detail (for now, just alert)
        window.location.href = `property-detail.html?id=${propertyId}`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadHomePageProperties();
});
