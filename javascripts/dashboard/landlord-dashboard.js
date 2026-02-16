document.addEventListener('DOMContentLoaded', function() {
    StorageService.initializeSeedData();

    if (!RouteGuard.requireLandlord()) {
        return;
    }

    const user = RouteGuard.getCurrentUser();
    if (!user) {
        RouteGuard.redirectToHome();
        return;
    }

    document.getElementById('welcomeName').textContent = user.username;
    document.getElementById('username').textContent = user.username;

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.dashboard-section');

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

    function loadProperties() {
        const properties = PropertyService.getMyProperties(user.id);
        const container = document.getElementById('propertiesList');
        document.getElementById('propertyCount').textContent = properties.length;
        
        if (properties.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">home_work</span><p>No properties yet. Add your first property!</p></div>';
            return;
        }

        container.innerHTML = properties.map(property => `
            <div class="property-card">
                <div class="property-image">
                    <span class="material-symbols-outlined">home</span>
                </div>
                <div class="property-info">
                    <h3>${property.title}</h3>
                    <p class="property-address">${property.address || 'No address'}</p>
                    <p class="property-price">$${property.price.toLocaleString()}</p>
                    <div class="property-details">
                        <span>${property.bedrooms} Beds</span>
                        <span>${property.bathrooms} Baths</span>
                        <span>${property.sqft} sqft</span>
                    </div>
                    <span class="property-status status-${property.status}">${property.status}</span>
                </div>
                <div class="property-actions">
                    <button class="btn-icon" onclick="editProperty('${property.id}')" title="Edit">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteProperty('${property.id}')" title="Delete">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function loadBookings() {
        const bookings = BookingService.getMyBookings();
        const container = document.getElementById('bookingsList');
        const pendingCount = bookings.filter(b => b.status === 'pending').length;
        document.getElementById('bookingCount').textContent = pendingCount;

        if (bookings.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">event_busy</span><p>No booking requests yet.</p></div>';
            return;
        }

        const bookingsWithDetails = bookings.map(booking => {
            const property = PropertyService.getPropertyById(booking.propertyId);
            const tenant = StorageService.getUsers().find(u => u.id === booking.tenantId);
            return { ...booking, property, tenant };
        });

        container.innerHTML = bookingsWithDetails.map(booking => `
            <div class="booking-card">
                <div class="booking-info">
                    <h3>${booking.property?.title || 'Unknown Property'}</h3>
                    <p class="tenant-name"><span class="material-symbols-outlined">person</span> ${booking.tenant?.username || 'Unknown'}</p>
                    <p class="booking-message">${booking.message || 'No message'}</p>
                    <span class="booking-status status-${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-actions">
                    ${booking.status === 'pending' ? `
                        <button class="btn-accept" onclick="updateBooking('${booking.id}', 'approved')">Accept</button>
                        <button class="btn-reject" onclick="updateBooking('${booking.id}', 'rejected')">Reject</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

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

    window.editProperty = function(id) {
        const property = PropertyService.getPropertyById(id);
        if (!property) return;

        document.getElementById('propertyId').value = property.id;
        document.getElementById('propertyTitle').value = property.title;
        document.getElementById('propertyDescription').value = property.description;
        document.getElementById('propertyPrice').value = property.price;
        document.getElementById('propertyType').value = property.type;
        document.getElementById('propertyBedrooms').value = property.bedrooms;
        document.getElementById('propertyBathrooms').value = property.bathrooms;
        document.getElementById('propertySqft').value = property.sqft;
        document.getElementById('propertyAddress').value = property.address;
        
        document.getElementById('propertyModalTitle').textContent = 'Edit Property';
        document.getElementById('propertyModal').classList.add('active');
    };

    window.deleteProperty = function(id) {
        if (confirm('Are you sure you want to delete this property?')) {
            PropertyService.deleteProperty(id);
            loadProperties();
        }
    };

    window.updateBooking = function(bookingId, status) {
        BookingService.updateBookingStatus(bookingId, status);
        loadBookings();
    };

    document.getElementById('addPropertyBtn').addEventListener('click', () => {
        document.getElementById('propertyId').value = '';
        document.getElementById('propertyForm').reset();
        document.getElementById('propertyModalTitle').textContent = 'Add New Property';
        document.getElementById('propertyModal').classList.add('active');
    });

    document.getElementById('closePropertyModal').addEventListener('click', () => {
        document.getElementById('propertyModal').classList.remove('active');
    });

    document.getElementById('propertyModal').addEventListener('click', (e) => {
        if (e.target.id === 'propertyModal') {
            document.getElementById('propertyModal').classList.remove('active');
        }
    });

    document.getElementById('propertyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const propertyId = document.getElementById('propertyId').value;
        const propertyData = {
            title: document.getElementById('propertyTitle').value,
            description: document.getElementById('propertyDescription').value,
            price: document.getElementById('propertyPrice').value,
            type: document.getElementById('propertyType').value,
            bedrooms: document.getElementById('propertyBedrooms').value,
            bathrooms: document.getElementById('propertyBathrooms').value,
            sqft: document.getElementById('propertySqft').value,
            address: document.getElementById('propertyAddress').value
        };

        let result;
        if (propertyId) {
            result = PropertyService.updateProperty(propertyId, propertyData);
        } else {
            result = PropertyService.createProperty(propertyData);
        }

        if (result.success) {
            document.getElementById('propertyModal').classList.remove('active');
            loadProperties();
        } else {
            alert(result.error);
        }
    });

    loadProperties();
    loadBookings();
    loadMessages();
});
