document.addEventListener('DOMContentLoaded', function() {
    // Initialize seed data
    StorageService.initializeSeedData();
    
    // Check authentication
    const user = AuthService.getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set up user info
    document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
    
    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        AuthService.logout();
    });
    
    // User dropdown toggle
    document.getElementById('userAvatar').addEventListener('click', () => {
        document.getElementById('userDropdown').classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#userProfile')) {
            document.getElementById('userDropdown').classList.remove('show');
        }
    });
    
    // State
    let properties = [];
    let filteredProperties = [];
    let currentPage = 1;
    const itemsPerPage = 9;
    
    // Load properties
    loadProperties();
    
    // Filter handlers
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('sortSelect').addEventListener('change', sortProperties);
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    
    // Price presets
    document.querySelectorAll('.price-presets button').forEach(btn => {
        btn.addEventListener('click', () => {
            const min = btn.dataset.min;
            const max = btn.dataset.max;
            document.getElementById('priceMin').value = min || '';
            document.getElementById('priceMax').value = max || '';
            applyFilters();
        });
    });
    
    function loadProperties() {
        properties = PropertyService.getAllProperties();
        applyFilters();
    }
    
    function applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const priceMin = parseFloat(document.getElementById('priceMin').value) || 0;
        const priceMax = parseFloat(document.getElementById('priceMax').value) || Infinity;
        const propertyType = document.querySelector('input[name="propertyType"]:checked').value;
        const bedrooms = parseInt(document.querySelector('input[name="bedrooms"]:checked').value) || 0;
        
        filteredProperties = properties.filter(property => {
            // Search filter
            if (searchTerm && !property.title.toLowerCase().includes(searchTerm) && 
                !property.address?.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Price filter
            if (property.price < priceMin || property.price > priceMax) {
                return false;
            }
            
            // Property type filter
            if (propertyType && property.type !== propertyType) {
                return false;
            }
            
            // Bedrooms filter
            if (bedrooms && property.bedrooms < bedrooms) {
                return false;
            }
            
            return true;
        });
        
        sortProperties();
    }
    
    function sortProperties() {
        const sortBy = document.getElementById('sortSelect').value;
        
        switch(sortBy) {
            case 'price-low':
                filteredProperties.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProperties.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
            default:
                filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        currentPage = 1;
        renderProperties();
        renderPagination();
    }
    
    function resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('priceMin').value = '';
        document.getElementById('priceMax').value = '';
        document.querySelector('input[name="propertyType"][value=""]').checked = true;
        document.querySelector('input[name="bedrooms"][value=""]').checked = true;
        
        applyFilters();
    }
    
    function renderProperties() {
        const grid = document.getElementById('propertiesGrid');
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageProperties = filteredProperties.slice(start, end);
        
        document.getElementById('resultsCount').textContent = 
            `Showing ${filteredProperties.length} properties`;
        
        if (pageProperties.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <span class="material-symbols-outlined">home_work</span>
                    <p>No properties found. Try adjusting your filters.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = pageProperties.map(property => `
            <div class="property-card" data-id="${property.id}">
                <div class="property-image">
                    <img src="${property.images?.[0] || './img/card1.jpg'}" alt="${property.title}">
                    ${property.status === 'available' ? '<span class="property-badge">Featured</span>' : ''}
                    <button class="favorite-btn ${isFavorite(property.id) ? 'active' : ''}" data-id="${property.id}">
                        <span class="material-symbols-outlined">favorite</span>
                    </button>
                    <span class="property-price">$${formatPrice(property.price)}</span>
                </div>
                <div class="property-details">
                    <h3 class="property-title">${property.title}</h3>
                    <p class="property-location">
                        <span class="material-symbols-outlined">location_on</span>
                        ${property.address || 'Location not specified'}
                    </p>
                    <div class="property-features">
                        <span><span class="material-symbols-outlined">bed</span> ${property.bedrooms || 0}</span>
                        <span><span class="material-symbols-outlined">bathtub</span> ${property.bathrooms || 0}</span>
                        <span><span class="material-symbols-outlined">square_foot</span> ${property.sqft || 0}</span>
                    </div>
                    <button class="view-details-btn" onclick="viewPropertyDetails('${property.id}')">View Details</button>
                </div>
            </div>
        `).join('');
        
        // Favorite button handlers
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(btn.dataset.id, btn);
            });
        });
    }
    
    function renderPagination() {
        const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Previous button
        html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += '<span>...</span>';
            }
        }
        
        // Next button
        html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <span class="material-symbols-outlined">chevron_right</span>
        </button>`;
        
        pagination.innerHTML = html;
    }
    
    window.changePage = function(page) {
        currentPage = page;
        renderProperties();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    window.viewPropertyDetails = function(propertyId) {
        window.location.href = `property-detail.html?id=${propertyId}`;
    };
    
    function formatPrice(price) {
        if (price >= 1000000) {
            return (price / 1000000).toFixed(1) + 'M';
        } else if (price >= 1000) {
            return (price / 1000).toFixed(0) + 'k';
        }
        return price.toString();
    }
    
    // Favorites management
    function getFavorites() {
        return JSON.parse(localStorage.getItem('nestify_favorites')) || [];
    }
    
    function saveFavorites(favorites) {
        localStorage.setItem('nestify_favorites', JSON.stringify(favorites));
    }
    
    function isFavorite(propertyId) {
        return getFavorites().includes(propertyId);
    }
    
    function toggleFavorite(propertyId, btn) {
        let favorites = getFavorites();
        const index = favorites.indexOf(propertyId);
        
        if (index > -1) {
            favorites.splice(index, 1);
            btn.classList.remove('active');
        } else {
            favorites.push(propertyId);
            btn.classList.add('active');
        }
        
        saveFavorites(favorites);
    }
    
    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
});
