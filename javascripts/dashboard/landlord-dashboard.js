document.addEventListener('DOMContentLoaded', function() {
    // Test that script loads
    console.log('Landlord dashboard script loaded');
    
    StorageService.initializeSeedData();

    if (!RouteGuard.requireLandlord()) {
        return;
    }

    const user = RouteGuard.getCurrentUser();
    if (!user) {
        RouteGuard.redirectToHome();
        return;
    }

    console.log('Landlord logged in:', user.username);
    
    // Ensure sample data exists for this landlord
    const myProperties = PropertyService.getMyProperties(user.id);
    console.log('Properties for this landlord:', myProperties.length);
    
    // If no properties, create sample
    if (myProperties.length === 0) {
        const sampleProperty = {
            ownerId: user.id,
            title: 'Modern Downtown Apartment',
            description: 'Beautiful 2BR apartment in the heart of downtown',
            price: 250000,
            type: 'apartment',
            bedrooms: 2,
            bathrooms: 2,
            sqft: 1200,
            address: '123 Main St, City, State 12345',
            status: 'available',
            images: ['./img/card1.jpg'],
            amenities: ['wifi', 'parking']
        };
        const result = PropertyService.createProperty(sampleProperty);
        console.log('Created sample property, result:', result);
        
        // Create sample booking
        const users = StorageService.getUsers();
        const tenant = users.find(u => u.role === 'tenant');
        if (tenant && result.success && result.property) {
            const sampleBooking = {
                id: 'book_' + Date.now(),
                propertyId: result.property.id,
                tenantId: tenant.id,
                status: 'pending',
                message: 'I would love to schedule a viewing for this property. Please let me know your availability.',
                createdAt: new Date().toISOString()
            };
            StorageService.saveBooking(sampleBooking);
            console.log('Created sample booking for property:', result.property.id);
        }
    }

    document.getElementById('welcomeName').textContent = user.username;
    document.getElementById('username').textContent = user.username;
    if (document.getElementById('userAvatar')) {
        document.getElementById('userAvatar').innerHTML = '<span class="material-symbols-outlined">person</span>';
    }

    // Load notification badges
    loadNotificationBadges();

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            menuItems.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection + 'Section') {
                    section.classList.add('active');
                }
            });

            // Load section-specific data
            if (targetSection === 'dashboard') loadDashboardOverview();
            if (targetSection === 'properties') loadProperties();
            if (targetSection === 'bookings') loadBookings('pending');
            if (targetSection === 'tenants') loadTenants();
            if (targetSection === 'finance') loadFinance();
        });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            AuthService.logout();
        });
    }

    // Booking tabs
    const bookingTabs = document.querySelectorAll('.booking-tab');
    bookingTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            bookingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadBookings(tab.getAttribute('data-status'));
        });
    });

    // === IMAGE UPLOAD HANDLING - Defined FIRST ===
    let uploadedImages = [];
    
    function handleImageUpload(event) {
        const files = event.target.files;
        const previewGrid = document.getElementById('imagePreviewGrid');
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadedImages.push(e.target.result);
                    renderImagePreviews();
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    function renderImagePreviews() {
        const previewGrid = document.getElementById('imagePreviewGrid');
        if (!previewGrid) return;
        
        previewGrid.innerHTML = uploadedImages.map((img, index) => `
            <div class="image-preview-item">
                <img src="${img}" alt="Preview ${index + 1}">
                <button type="button" class="remove-image" onclick="removeUploadedImage(${index})">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        `).join('');
    }
    
    window.removeUploadedImage = function(index) {
        uploadedImages.splice(index, 1);
        renderImagePreviews();
    };

    // Now attach event listener AFTER function is defined
    const imageInput = document.getElementById('propertyImages');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }

    function loadNotificationBadges() {
        const bookings = BookingService.getMyBookings();
        const pendingCount = bookings.filter(b => b.status === 'pending').length;
        
        const bookingBadge = document.getElementById('bookingBadge');
        if (bookingBadge) {
            if (pendingCount > 0) {
                bookingBadge.textContent = pendingCount;
                bookingBadge.style.display = 'inline-flex';
            } else {
                bookingBadge.style.display = 'none';
            }
        }

        const contacts = MessageService.getContacts();
        const unreadMessages = contacts.reduce((count, contact) => count + (contact.unread || 0), 0);
        
        const messageBadge = document.getElementById('messageBadge');
        if (messageBadge) {
            if (unreadMessages > 0) {
                messageBadge.textContent = unreadMessages;
                messageBadge.style.display = 'inline-flex';
            } else {
                messageBadge.style.display = 'none';
            }
        }
    }

    function loadDashboardOverview() {
        const properties = PropertyService.getMyProperties(user.id);
        const bookings = BookingService.getMyBookings();
        
        // Properties Overview
        const propertiesOverview = document.getElementById('propertiesOverview');
        if (propertiesOverview) {
            const activeProperties = properties.filter(p => p.status === 'available').length;
            propertiesOverview.innerHTML = `
                <div class="overview-stat">
                    <span class="overview-value">${properties.length}</span>
                    <span class="overview-label">Total Properties</span>
                </div>
                <div class="overview-stat">
                    <span class="overview-value">${activeProperties}</span>
                    <span class="overview-label">Active Listings</span>
                </div>
            `;
        }

        // Bookings Overview
        const bookingsOverview = document.getElementById('bookingsOverview');
        if (bookingsOverview) {
            const pending = bookings.filter(b => b.status === 'pending').length;
            const approved = bookings.filter(b => b.status === 'approved').length;
            const completed = bookings.filter(b => b.status === 'completed').length;
            bookingsOverview.innerHTML = `
                <div class="overview-stat">
                    <span class="overview-value">${pending}</span>
                    <span class="overview-label">Pending</span>
                </div>
                <div class="overview-stat">
                    <span class="overview-value">${approved}</span>
                    <span class="overview-label">Approved</span>
                </div>
                <div class="overview-stat">
                    <span class="overview-value">${completed}</span>
                    <span class="overview-label">Completed</span>
                </div>
            `;
        }

        // Revenue Overview
        const revenueOverview = document.getElementById('revenueOverview');
        if (revenueOverview) {
            const completedBookings = bookings.filter(b => b.status === 'completed' && b.paymentStatus === 'paid');
            let totalRevenue = 0;
            completedBookings.forEach(booking => {
                const property = PropertyService.getPropertyById(booking.propertyId);
                if (property) totalRevenue += property.price || 0;
            });
            revenueOverview.innerHTML = `
                <div class="overview-stat">
                    <span class="overview-value">$${totalRevenue.toLocaleString()}</span>
                    <span class="overview-label">Total Revenue</span>
                </div>
                <div class="overview-stat">
                    <span class="overview-value">${completedBookings.length}</span>
                    <span class="overview-label">Completed Payments</span>
                </div>
            `;
        }

        // Recent Messages
        const recentMessages = document.getElementById('recentMessages');
        if (recentMessages) {
            const allMessages = StorageService.getMessages()
                .filter(m => m.receiverId === user.id)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 3);
            
            if (allMessages.length === 0) {
                recentMessages.innerHTML = '<p class="no-messages">No messages yet</p>';
            } else {
                recentMessages.innerHTML = allMessages.map(msg => {
                    const sender = StorageService.getUsers().find(u => u.id === msg.senderId);
                    return `
                        <div class="recent-message">
                            <div class="message-avatar">${sender?.username?.charAt(0) || '?'}</div>
                            <div class="message-info">
                                <strong>${sender?.username || 'Unknown'}</strong>
                                <p>${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}</p>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Update stat cards
        document.getElementById('propertyCount').textContent = properties.length;
        document.getElementById('bookingCount').textContent = bookings.filter(b => b.status === 'approved').length;
        
        let totalRevenue = 0;
        bookings.filter(b => b.status === 'completed' && b.paymentStatus === 'paid').forEach(booking => {
            const property = PropertyService.getPropertyById(booking.propertyId);
            if (property) totalRevenue += property.price || 0;
        });
        document.getElementById('revenueCount').textContent = `$${totalRevenue.toLocaleString()}`;

        const tenants = new Set(bookings.map(b => b.tenantId));
        document.getElementById('tenantCount').textContent = tenants.size;
    }

    function loadProperties() {
        const properties = PropertyService.getMyProperties(user.id);
        console.log('Loading properties for user:', user.id, 'Count:', properties.length);
        const container = document.getElementById('propertiesList');
        document.getElementById('propertyCount').textContent = properties.length;
        
        if (properties.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">home_work</span><p>No properties yet. Add your first property!</p></div>';
            return;
        }

        container.innerHTML = properties.map(property => `
            <div class="property-card">
                <div class="property-image">
                    <img src="${property.images?.[0] || './img/card1.jpg'}" alt="${property.title}">
                    <span class="property-status status-${property.status}">${property.status}</span>
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
                    ${property.amenities && property.amenities.length > 0 ? `
                        <div class="property-amenities">
                            ${property.amenities.slice(0, 4).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="property-actions">
                    <button class="btn-icon" onclick="editProperty('${property.id}')" title="Edit">
                        <span class="material-symbols-outlined">edit</span> Edit
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteProperty('${property.id}')" title="Delete">
                        <span class="material-symbols-outlined">delete</span> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    function loadBookings(status = 'pending') {
        const bookings = BookingService.getMyBookings();
        console.log('Loading bookings for status:', status, 'Total bookings:', bookings.length);
        const container = document.getElementById('bookingsList');
        
        const filteredBookings = bookings.filter(b => b.status === status);
        console.log('Filtered bookings:', filteredBookings.length);
        
        if (filteredBookings.length === 0) {
            const statusMessages = {
                pending: 'No pending booking requests.',
                approved: 'No approved bookings.',
                completed: 'No completed bookings yet.'
            };
            container.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">event_busy</span><p>${statusMessages[status]}</p></div>`;
            return;
        }

        const bookingsWithDetails = filteredBookings.map(booking => {
            const property = PropertyService.getPropertyById(booking.propertyId);
            const tenant = StorageService.getUsers().find(u => u.id === booking.tenantId);
            return { ...booking, property, tenant };
        });

        container.innerHTML = bookingsWithDetails.map(booking => `
            <div class="booking-card">
                <div class="booking-property">
                    <img src="${booking.property?.images?.[0] || './img/card1.jpg'}" alt="${booking.property?.title}">
                    <div class="booking-info">
                        <h3>${booking.property?.title || 'Unknown Property'}</h3>
                        <p class="property-address">${booking.property?.address || ''}</p>
                    </div>
                </div>
                <div class="booking-tenant">
                    <div class="tenant-avatar">${booking.tenant?.username?.charAt(0) || '?'}</div>
                    <div class="tenant-info">
                        <h4>${booking.tenant?.username || 'Unknown'}</h4>
                        <p>${booking.tenant?.email || ''}</p>
                    </div>
                </div>
                <div class="booking-dates">
                    <p><strong>Check-In:</strong> ${booking.checkIn || 'Not specified'}</p>
                    <p><strong>Check-Out:</strong> ${booking.checkOut || 'Not specified'}</p>
                    <p><strong>Guests:</strong> ${booking.guests || 1}</p>
                </div>
                <div class="booking-message-box">
                    <h4>Message from tenant:</h4>
                    <p>${booking.message || 'No message'}</p>
                </div>
                <div class="booking-status">
                    <span class="booking-status-badge status-${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-actions">
                    ${booking.status === 'pending' ? `
                        <button type="button" class="btn-accept" data-id="${booking.id}" data-action="approved">Accept</button>
                        <button type="button" class="btn-reject" data-id="${booking.id}" data-action="rejected">Decline</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        // Add click handlers for Accept/Decline buttons
        container.querySelectorAll('.btn-accept, .btn-reject').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const action = this.getAttribute('data-action');
                processBooking(id, action);
            });
        });
    }

    function processBooking(bookingId, status) {
        // Simple direct processing
        var bookings = localStorage.getItem('nestify_bookings');
        if (bookings) {
            var bookingsArray = JSON.parse(bookings);
            for (var i = 0; i < bookingsArray.length; i++) {
                if (bookingsArray[i].id === bookingId) {
                    bookingsArray[i].status = status;
                    localStorage.setItem('nestify_bookings', JSON.stringify(bookingsArray));
                    if (status === 'approved') {
                        alert('Booking APPROVED! Tenant can now pay.');
                    } else {
                        alert('Booking DECLINED.');
                    }
                    loadBookings('pending');
                    return;
                }
            }
        }
        alert('Booking not found!');
    }

    function loadTenants() {
        const bookings = BookingService.getMyBookings();
        const container = document.getElementById('tenantsList');
        
        const tenantsMap = new Map();
        bookings.forEach(booking => {
            if (!tenantsMap.has(booking.tenantId)) {
                const tenant = StorageService.getUsers().find(u => u.id === booking.tenantId);
                const property = PropertyService.getPropertyById(booking.propertyId);
                if (tenant) {
                    tenantsMap.set(booking.tenantId, {
                        tenant,
                        bookings: [],
                        property
                    });
                }
            }
            if (tenantsMap.has(booking.tenantId)) {
                tenantsMap.get(booking.tenantId).bookings.push(booking);
            }
        });

        const tenants = Array.from(tenantsMap.values());

        if (tenants.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">people</span><p>No tenants yet.</p></div>';
            return;
        }

        container.innerHTML = tenants.map(({ tenant, bookings, property }) => `
            <div class="tenant-card">
                <div class="tenant-header">
                    <div class="tenant-avatar-large">${tenant.username.charAt(0)}</div>
                    <div class="tenant-header-info">
                        <h3>${tenant.username}</h3>
                        <p>${tenant.email}</p>
                        <p>${tenant.phone || ''}</p>
                    </div>
                </div>
                <div class="tenant-details">
                    <div class="tenant-booking-count">
                        <span class="count">${bookings.length}</span>
                        <span class="label">Total Bookings</span>
                    </div>
                    <div class="tenant-completed-count">
                        <span class="count">${bookings.filter(b => b.status === 'completed').length}</span>
                        <span class="label">Completed</span>
                    </div>
                    <div class="tenant-property">
                        <strong>Current/Rental Property:</strong>
                        <p>${property?.title || 'N/A'}</p>
                    </div>
                </div>
                <div class="tenant-history">
                    <h4>Booking History</h4>
                    ${bookings.map(b => `
                        <div class="history-item">
                            <span class="history-property">${PropertyService.getPropertyById(b.propertyId)?.title || 'Unknown'}</span>
                            <span class="history-status status-${b.status}">${b.status}</span>
                            <span class="history-date">${new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    function loadFinance() {
        const bookings = BookingService.getMyBookings();
        const container = document.getElementById('financeSummary');
        const paymentContainer = document.getElementById('paymentHistory');

        const completedBookings = bookings.filter(b => b.status === 'completed' && b.paymentStatus === 'paid');
        
        let totalRevenue = 0;
        let totalBookings = completedBookings.length;
        
        completedBookings.forEach(booking => {
            const property = PropertyService.getPropertyById(booking.propertyId);
            if (property) totalRevenue += property.price || 0;
        });

        const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        if (container) {
            container.innerHTML = `
                <div class="finance-card">
                    <div class="finance-icon">
                        <span class="material-symbols-outlined">account_balance</span>
                    </div>
                    <div class="finance-info">
                        <h3>$${totalRevenue.toLocaleString()}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                <div class="finance-card">
                    <div class="finance-icon">
                        <span class="material-symbols-outlined">receipt_long</span>
                    </div>
                    <div class="finance-info">
                        <h3>${totalBookings}</h3>
                        <p>Completed Transactions</p>
                    </div>
                </div>
                <div class="finance-card">
                    <div class="finance-icon">
                        <span class="material-symbols-outlined">trending_up</span>
                    </div>
                    <div class="finance-info">
                        <h3>$${averageBookingValue.toLocaleString()}</h3>
                        <p>Average Booking Value</p>
                    </div>
                </div>
            `;
        }

        if (paymentContainer) {
            if (completedBookings.length === 0) {
                paymentContainer.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">receipt</span><p>No payment history yet.</p></div>';
            } else {
                paymentContainer.innerHTML = `
                    <h3>Payment History</h3>
                    <table class="payment-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Property</th>
                                <th>Tenant</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${completedBookings.map(booking => {
                                const property = PropertyService.getPropertyById(booking.propertyId);
                                const tenant = StorageService.getUsers().find(u => u.id === booking.tenantId);
                                return `
                                    <tr>
                                        <td>${new Date(booking.paidAt || booking.updatedAt).toLocaleDateString()}</td>
                                        <td>${property?.title || 'Unknown'}</td>
                                        <td>${tenant?.username || 'Unknown'}</td>
                                        <td>$${(property?.price || 0).toLocaleString()}</td>
                                        <td><span class="status-paid">Paid</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            }
        }
    }

    function loadMessages() {
        const contacts = MessageService.getContacts();
        const container = document.getElementById('messagesList');
        console.log('Loading messages, contacts:', contacts);

        if (contacts.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">mail_outline</span><p>No messages yet. Messages from tenants will appear here.</p></div>';
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

        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const receiverId = document.getElementById('receiverId').value;
                const content = document.getElementById('messageContent').value;
                
                const result = MessageService.sendMessage(receiverId, content);
                if (result.success) {
                    openConversation(contactId);
                    loadNotificationBadges();
                }
            });
        }
    };

    window.loadMessages = loadMessages;

    window.editProperty = function(id) {
        console.log('Editing property:', id);
        const property = PropertyService.getPropertyById(id);
        if (!property) {
            console.error('Property not found:', id);
            alert('Property not found');
            return;
        }

        document.getElementById('propertyId').value = property.id;
        document.getElementById('propertyTitle').value = property.title;
        document.getElementById('propertyDescription').value = property.description;
        document.getElementById('propertyPrice').value = property.price;
        document.getElementById('propertyType').value = property.type;
        document.getElementById('propertyBedrooms').value = property.bedrooms;
        document.getElementById('propertyBathrooms').value = property.bathrooms;
        document.getElementById('propertySqft').value = property.sqft;
        document.getElementById('propertyAddress').value = property.address;

        // Set amenities checkboxes
        if (property.amenities) {
            document.querySelectorAll('input[name="amenities"]').forEach(checkbox => {
                checkbox.checked = property.amenities.includes(checkbox.value);
            });
        }

        // Show existing images
        if (property.images && property.images.length > 0) {
            const previewGrid = document.getElementById('imagePreviewGrid');
            previewGrid.innerHTML = property.images.map((img, index) => `
                <div class="image-preview-item">
                    <img src="${img}" alt="Property image ${index + 1}">
                    <button type="button" class="remove-image" onclick="removeUploadedImage(${index})">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `).join('');
        }

        document.getElementById('propertyModalTitle').textContent = 'Edit Property';
        document.getElementById('propertyModal').classList.add('active');
    };

    window.deleteProperty = function(id) {
        if (confirm('Are you sure you want to delete this property?')) {
            PropertyService.deleteProperty(id);
            loadProperties();
        }
    };

    function handleBookingAction(bookingId, status) {
        console.log('handleBookingAction called:', bookingId, status);
        
        // Get all bookings
        const bookings = StorageService.getBookings();
        console.log('All bookings:', bookings);
        
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        console.log('Booking index:', bookingIndex);
        
        if (bookingIndex === -1) {
            alert('Booking not found!');
            return;
        }
        
        // Update booking status
        bookings[bookingIndex].status = status;
        bookings[bookingIndex].updatedAt = new Date().toISOString();
        
        // Save
        StorageService.set('nestify_bookings', bookings);
        
        console.log('Booking updated:', bookings[bookingIndex]);
        
        // Show success message
        if (status === 'approved') {
            alert('Booking APPROVED! Tenant can now proceed to payment.');
        } else {
            alert('Booking DECLINED.');
        }
        
        // Reload bookings
        loadBookings('pending');
        
        // If approved, create notification for tenant
        if (status === 'approved') {
            const notification = {
                id: 'notif_' + Date.now(),
                type: 'booking_approved',
                bookingId: bookingId,
                message: 'Your booking has been approved! Please proceed to checkout.',
                createdAt: new Date().toISOString(),
                read: false
            };
            const notifications = StorageService.get('nestify_notifications') || [];
            notifications.push(notification);
            StorageService.set('nestify_notifications', notifications);
        }
    }
    
    // Make function globally accessible
    window.handleBookingAction = handleBookingAction;

    // Add Property button
    const addPropertyBtn = document.getElementById('addPropertyBtn');
    if (addPropertyBtn) {
        addPropertyBtn.addEventListener('click', () => {
        console.log('Add Property button clicked');
        document.getElementById('propertyId').value = '';
        document.getElementById('propertyForm').reset();
        uploadedImages = [];
        renderImagePreviews();
        
        // Uncheck all amenities
        document.querySelectorAll('input[name="amenities"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.getElementById('propertyModalTitle').textContent = 'Add New Property';
        document.getElementById('propertyModal').classList.add('active');
        console.log('Modal should be visible now');
    });
    }

    // Close modal button
    const closeModalBtn = document.getElementById('closePropertyModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('propertyModal');
            if (modal) modal.classList.remove('active');
        });
    }

    // Modal overlay click to close
    const propertyModal = document.getElementById('propertyModal');
    if (propertyModal) {
        propertyModal.addEventListener('click', (e) => {
            if (e.target.id === 'propertyModal') {
                propertyModal.classList.remove('active');
            }
        });
    }

    // Property form submit
    const propertyForm = document.getElementById('propertyForm');
    if (propertyForm) {
        propertyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const propertyId = document.getElementById('propertyId').value;
        
        // Get selected amenities
        const amenities = [];
        document.querySelectorAll('input[name="amenities"]:checked').forEach(checkbox => {
            amenities.push(checkbox.value);
        });

        // For new properties, generate unique images if none uploaded
        let propertyImages = uploadedImages.length > 0 ? uploadedImages : null;

        const propertyData = {
            title: document.getElementById('propertyTitle').value,
            description: document.getElementById('propertyDescription').value,
            price: parseFloat(document.getElementById('propertyPrice').value) || 0,
            type: document.getElementById('propertyType').value,
            bedrooms: parseInt(document.getElementById('propertyBedrooms').value) || 0,
            bathrooms: parseInt(document.getElementById('propertyBathrooms').value) || 0,
            sqft: parseInt(document.getElementById('propertySqft').value) || 0,
            address: document.getElementById('propertyAddress').value,
            amenities: amenities
        };

        // Add images to property data
        if (propertyImages) {
            propertyData.images = propertyImages;
        } else if (!propertyId) {
            // For new properties without uploaded images, use placeholder
            propertyData.images = ['./img/card1.jpg'];
        }

        let result;
        if (propertyId) {
            result = PropertyService.updateProperty(propertyId, propertyData);
        } else {
            result = PropertyService.createProperty(propertyData);
        }

        if (result.success) {
            document.getElementById('propertyModal').classList.remove('active');
            loadProperties();
            loadDashboardOverview();
        } else {
            alert(result.error);
        }
    });

    // Initial load - ensure properties section is visible
    loadProperties();
    loadBookings('pending');
    loadMessages();
}});

