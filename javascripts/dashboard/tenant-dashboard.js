document.addEventListener('DOMContentLoaded', function() {
    StorageService.initializeSeedData();

    if (!RouteGuard.requireTenant()) {
        return;
    }

    const user = RouteGuard.getCurrentUser();
    if (!user) {
        RouteGuard.redirectToHome();
        return;
    }

    document.getElementById('welcomeName').textContent = user.username;
    document.getElementById('username').textContent = user.username;

    // Navigation
    const navLinks = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection + 'Section') {
                    section.classList.add('active');
                }
            });
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        AuthService.logout();
    });

    // Filters
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const priceFilter = document.getElementById('priceFilter');

    function getFilteredProperties() {
        let properties = PropertyService.getAvailableProperties();
        properties = properties.filter(p => p.ownerId !== user.id);

        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            properties = properties.filter(p => 
                p.title.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.address.toLowerCase().includes(searchTerm)
            );
        }

        const type = typeFilter.value;
        if (type) {
            properties = properties.filter(p => p.type === type);
        }

        const priceRange = priceFilter.value;
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(v => v.replace('+', ''));
            if (max) {
                properties = properties.filter(p => p.price >= parseInt(min) && p.price <= parseInt(max));
            } else {
                properties = properties.filter(p => p.price >= parseInt(min));
            }
        }

        return properties;
    }

    function loadProperties() {
        const properties = getFilteredProperties();
        const container = document.getElementById('propertiesList');

        if (properties.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">home_work</span><p>No properties match your criteria.</p></div>';
            return;
        }

        container.innerHTML = properties.map(property => `
            <div class="property-card">
                <div class="property-image">
                    <span class="material-symbols-outlined">home</span>
                    <span class="property-status-badge status-${property.status}">${property.status}</span>
                </div>
                <div class="property-info">
                    <h3>${property.title}</h3>
                    <p class="property-address">
                        <span class="material-symbols-outlined">location_on</span>
                        ${property.address || 'No address'}
                    </p>
                    <p class="property-price">$${property.price.toLocaleString()}</p>
                    <div class="property-details">
                        <span><span class="material-symbols-outlined">bed</span> ${property.bedrooms} Beds</span>
                        <span><span class="material-symbols-outlined">bathtub</span> ${property.bathrooms} Baths</span>
                        <span><span class="material-symbols-outlined">square_foot</span> ${property.sqft} sqft</span>
                    </div>
                </div>
                <div class="property-actions" style="padding: 0 20px 20px;">
                    <button class="btn-add-property" style="flex:1" onclick="requestBooking('${property.id}')">
                        <span class="material-symbols-outlined">event</span>
                        Book Now
                    </button>
                    <button class="btn-icon" onclick="messageOwner('${property.ownerId}')" title="Message Owner">
                        <span class="material-symbols-outlined">chat</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    searchInput.addEventListener('input', loadProperties);
    typeFilter.addEventListener('change', loadProperties);
    priceFilter.addEventListener('change', loadProperties);

    // Booking Modal
    window.requestBooking = function(propertyId) {
        const property = PropertyService.getPropertyById(propertyId);
        if (!property) return;

        document.getElementById('bookingPropertyId').value = propertyId;
        document.getElementById('bookingPropertyInfo').innerHTML = `
            <div style="padding: 20px; background: var(--light-bg); border-radius: var(--radius-md); margin-bottom: 20px;">
                <h3 style="margin-bottom: 8px;">${property.title}</h3>
                <p style="font-size: 1.25rem; font-weight: 700; color: var(--primary-blue);">$${property.price.toLocaleString()}</p>
                <p style="color: var(--text-gray); font-size: 0.9rem; margin-top: 8px;">
                    ${property.bedrooms} beds • ${property.bathrooms} baths • ${property.sqft} sqft
                </p>
            </div>
        `;
        
        document.getElementById('bookingModal').classList.add('active');
    };

    document.getElementById('closeBookingModal').addEventListener('click', () => {
        document.getElementById('bookingModal').classList.remove('active');
    });

    document.getElementById('cancelBookingBtn').addEventListener('click', () => {
        document.getElementById('bookingModal').classList.remove('active');
    });

    document.getElementById('bookingModal').addEventListener('click', (e) => {
        if (e.target.id === 'bookingModal') {
            document.getElementById('bookingModal').classList.remove('active');
        }
    });

    document.getElementById('bookingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const propertyId = document.getElementById('bookingPropertyId').value;
        const message = document.getElementById('bookingMessage').value;
        
        const result = BookingService.createBooking({ propertyId, message });
        
        if (result.success) {
            document.getElementById('bookingModal').classList.remove('active');
            document.getElementById('bookingForm').reset();
            alert('Booking request sent successfully!');
            loadBookings();
        } else {
            alert(result.error);
        }
    });

    function loadBookings() {
        const bookings = BookingService.getMyBookings();
        const container = document.getElementById('bookingsList');

        if (bookings.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">event_busy</span><p>No bookings yet. Browse properties to make a booking!</p></div>';
            return;
        }

        const bookingsWithDetails = bookings.map(booking => {
            const property = PropertyService.getPropertyById(booking.propertyId);
            const owner = property ? StorageService.getUsers().find(u => u.id === property.ownerId) : null;
            return { ...booking, property, owner };
        });

        container.innerHTML = bookingsWithDetails.map(booking => `
            <div class="booking-card">
                <div class="booking-info">
                    <h3>${booking.property?.title || 'Unknown Property'}</h3>
                    <p class="tenant-name">
                        <span class="material-symbols-outlined">person</span>
                        Owner: ${booking.owner?.username || 'Unknown'}
                    </p>
                    <p class="booking-message">${booking.message || 'No message'}</p>
                    <span class="booking-status status-${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-actions">
                    ${booking.status === 'pending' ? `
                        <button class="btn-reject" onclick="cancelBooking('${booking.id}')">Cancel</button>
                    ` : ''}
                    ${booking.status === 'approved' ? `
                        <button class="btn-add-property" onclick="messageOwner('${booking.property?.ownerId}')">
                            <span class="material-symbols-outlined">chat</span>
                            Contact Owner
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    window.cancelBooking = function(bookingId) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            BookingService.cancelBooking(bookingId);
            loadBookings();
        }
    };

    function loadMessages() {
        const contacts = MessageService.getContacts();
        const container = document.getElementById('messagesList');

        if (contacts.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">mail_outline</span><p>No messages yet.</p></div>';
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="message-thread" onclick="openConversation('${contact.id}')">
                <div class="message-avatar">
                    <span class="material-symbols-outlined">person</span>
                </div>
                <div class="message-preview">
                    <h4>${contact.username}</h4>
                    <p>Click to view conversation</p>
                </div>
            </div>
        `).join('');
    }

    window.messageOwner = function(ownerId) {
        document.querySelectorAll('.menu-item').forEach(l => l.classList.remove('active'));
        document.querySelector('[data-section="messages"]').classList.add('active');
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById('messagesSection').classList.add('active');
        
        setTimeout(() => openConversation(ownerId), 100);
    };

    window.openConversation = function(contactId) {
        const messages = MessageService.getConversation(contactId);
        const contact = StorageService.getUsers().find(u => u.id === contactId);
        const container = document.getElementById('messagesList');
        
        container.style.display = 'block';
        
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 20px;">
                <button onclick="loadMessages()" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--light-bg); border: none; border-radius: var(--radius-sm); cursor: pointer; margin-bottom: 20px; color: var(--primary-blue); font-weight: 500;">
                    <span class="material-symbols-outlined">arrow_back</span>
                    Back to Messages
                </button>
                <h3 style="margin-bottom: 20px;">Conversation with ${contact?.username}</h3>
                <div style="max-height: 350px; overflow-y: auto; background: var(--light-bg); padding: 20px; border-radius: var(--radius-md); margin-bottom: 20px;">
                    ${messages.length === 0 ? '<p style="text-align: center; color: var(--text-gray);">No messages yet. Start the conversation!</p>' : ''}
                    ${messages.map(msg => `
                        <div style="max-width: 70%; padding: 12px 16px; border-radius: 12px; margin-bottom: 10px; ${msg.senderId === user.id ? 'background: var(--primary-blue); color: white; margin-left: auto; border-bottom-right-radius: 2px;' : 'background: white; color: var(--text-dark); border-bottom-left-radius: 2px; box-shadow: var(--shadow-sm);'}">
                            <p style="margin: 0;">${msg.content}</p>
                            <span style="font-size: 0.7rem; opacity: 0.7; display: block; margin-top: 5px;">${new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <form id="messageForm" style="display: flex; gap: 12px;">
                    <input type="hidden" id="receiverId" value="${contactId}" style="flex: 1; padding: 12px 16px; border: 2px solid var(--border-color); border-radius: var(--radius-sm); outline: none;">
                    <input type="text" id="messageContent" placeholder="Type a message..." required style="flex: 1; padding: 12px 16px; border: 2px solid var(--border-color); border-radius: var(--radius-sm); outline: none;">
                    <button type="submit" class="btn-add-property">
                        <span class="material-symbols-outlined">send</span>
                    </button>
                </form>
            </div>
        `;

        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const receiverId = document.getElementById('receiverId').value;
            const content = document.getElementById('messageContent').value;
            
            const result = MessageService.sendMessage(receiverId, content);
            if (result.success) {
                openConversation(contactId);
            }
        });
    };

    window.loadMessages = loadMessages;

    loadProperties();
    loadBookings();
    loadMessages();
});
