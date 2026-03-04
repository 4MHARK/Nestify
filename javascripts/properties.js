// ========================
// PROPERTY RENDERING
// ========================

// Load properties and render on home page
function loadHomePageProperties() {
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Filter to only show active properties (or properties with no status = active)
    const activeProperties = properties.filter(p => p.status === 'active' || !p.status);
    
    if (activeProperties.length === 0) {
        // No properties yet - show empty state
        renderEmptyState();
        return;
    }
    
    // Sort by date (newest first)
    const sortedProperties = [...activeProperties].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Get featured properties (newest 4)
    const featured = sortedProperties.slice(0, 4);
    
    // Get properties for sale
    const forSale = sortedProperties.filter(p => p.type === 'sale');
    
    // Get properties for rent
    const forRent = sortedProperties.filter(p => p.type === 'rent');
    
    // Render each section
    renderPropertyGrid('featured-properties', featured);
    renderPropertyGrid('sale-properties', forSale.slice(0, 4));
    renderPropertyGrid('rent-properties', forRent.slice(0, 4));
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
        ? `$${property.price.toLocaleString()}/${property.pricePeriod || 'month'}` 
        : `$${property.price.toLocaleString()}`;
    
    const badgeLabel = property.type === 'rent' ? 'For Rent' : 'For Sale';
    
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
        <div class="property-card" onclick="handlePropertyClick(${property.id})">
            ${favoriteBtn}
            <div class="property-image">
                <img src="${property.images ? property.images[0] : property.image}" alt="${property.title}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
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

// Toggle favorite
function toggleFavorite(propertyId, event) {
    event.stopPropagation();
    
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
    
    // Reload the page to update the button state
    location.reload();
}

// Handle property card click
function handlePropertyClick(propertyId) {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    
    if (!session) {
        // Not logged in - open auth modal
        openAuthModal('signin');
    } else {
        // Logged in - go to property detail
        window.location.href = `pages/property-detail.html?id=${propertyId}`;
    }
}

// ========================
// PROPERTIES PAGE FUNCTIONS
// ========================

// Load all properties with filters (for properties.html)
function loadPropertiesPage() {
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Only show active properties (or properties with no status set - treat as active)
    const activeProperties = properties.filter(p => p.status === 'active' || !p.status);
    
    renderPropertiesPage(activeProperties);
}

// Render properties on properties page
function renderPropertiesPage(properties) {
    const container = document.getElementById('properties-grid');
    const noResults = document.getElementById('no-results');
    const resultsCount = document.getElementById('results-count');
    
    if (!container) return;
    
    // Update results count
    if (resultsCount) {
        resultsCount.textContent = `Showing ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`;
    }
    
    if (properties.length === 0) {
        container.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    if (noResults) noResults.style.display = 'none';
    
    container.innerHTML = properties.map(property => createPropertyCard(property)).join('');
}

// Apply filters
function applyFilters() {
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    // Only active properties (or properties with no status set - treat as active)
    let filtered = properties.filter(p => p.status === 'active' || !p.status);
    
    // Get filter values
    const searchLocation = document.getElementById('search-location')?.value.toLowerCase() || '';
    const filterType = document.getElementById('filter-type')?.value || '';
    const filterBedrooms = document.getElementById('filter-bedrooms')?.value || '';
    const filterMinPrice = parseInt(document.getElementById('filter-min-price')?.value) || 0;
    const filterMaxPrice = parseInt(document.getElementById('filter-max-price')?.value) || Infinity;
    const sortBy = document.getElementById('sort-by')?.value || 'newest';
    
    // Apply search filter
    if (searchLocation) {
        filtered = filtered.filter(p => 
            p.location.toLowerCase().includes(searchLocation) ||
            p.title.toLowerCase().includes(searchLocation)
        );
    }
    
    // Apply type filter
    if (filterType) {
        filtered = filtered.filter(p => p.type === filterType);
    }
    
    // Apply bedrooms filter
    if (filterBedrooms) {
        const minBeds = parseInt(filterBedrooms);
        filtered = filtered.filter(p => p.bedrooms >= minBeds);
    }
    
    // Apply price filter
    filtered = filtered.filter(p => 
        p.price >= filterMinPrice && p.price <= filterMaxPrice
    );
    
    // Apply sorting
    switch (sortBy) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
        default:
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    renderPropertiesPage(filtered);
}

// Clear all filters
function clearFilters() {
    document.getElementById('search-location').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-bedrooms').value = '';
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    document.getElementById('sort-by').value = 'newest';
    
    loadPropertiesPage();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on
    const propertiesGrid = document.getElementById('properties-grid');
    
    if (propertiesGrid) {
        // We're on properties.html
        loadPropertiesPage();
    } else {
        // We're on index.html
        loadHomePageProperties();
    }
});
