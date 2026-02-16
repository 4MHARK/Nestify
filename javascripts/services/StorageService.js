const STORAGE_KEYS = {
    USERS: 'nestify_users',
    PROPERTIES: 'nestify_properties',
    BOOKINGS: 'nestify_bookings',
    MESSAGES: 'nestify_messages',
    CURRENT_USER: 'nestify_currentUser'
};

class StorageService {
    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading from localStorage: ${key}`, error);
            return null;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage: ${key}`, error);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage: ${key}`, error);
            return false;
        }
    }

    static getUsers() {
        return StorageService.get(STORAGE_KEYS.USERS) || [];
    }

    static saveUser(user) {
        const users = StorageService.getUsers();
        const existingIndex = users.findIndex(u => u.id === user.id);
        
        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        
        return StorageService.set(STORAGE_KEYS.USERS, users);
    }

    static findUserByEmail(email) {
        const users = StorageService.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    static getProperties() {
        return StorageService.get(STORAGE_KEYS.PROPERTIES) || [];
    }

    static getPropertiesByOwner(ownerId) {
        const properties = StorageService.getProperties();
        return properties.filter(p => p.ownerId === ownerId);
    }

    static saveProperty(property) {
        const properties = StorageService.getProperties();
        const existingIndex = properties.findIndex(p => p.id === property.id);
        
        if (existingIndex >= 0) {
            properties[existingIndex] = property;
        } else {
            properties.push(property);
        }
        
        return StorageService.set(STORAGE_KEYS.PROPERTIES, properties);
    }

    static getBookings() {
        return StorageService.get(STORAGE_KEYS.BOOKINGS) || [];
    }

    static getBookingsByTenant(tenantId) {
        const bookings = StorageService.getBookings();
        return bookings.filter(b => b.tenantId === tenantId);
    }

    static getBookingsByPropertyOwner(ownerId) {
        const properties = StorageService.getPropertiesByOwner(ownerId);
        const propertyIds = properties.map(p => p.id);
        const bookings = StorageService.getBookings();
        return bookings.filter(b => propertyIds.includes(b.propertyId));
    }

    static saveBooking(booking) {
        const bookings = StorageService.getBookings();
        const existingIndex = bookings.findIndex(b => b.id === booking.id);
        
        if (existingIndex >= 0) {
            bookings[existingIndex] = booking;
        } else {
            bookings.push(booking);
        }
        
        return StorageService.set(STORAGE_KEYS.BOOKINGS, bookings);
    }

    static getMessages() {
        return StorageService.get(STORAGE_KEYS.MESSAGES) || [];
    }

    static getMessagesForUser(userId) {
        const messages = StorageService.getMessages();
        return messages.filter(m => m.senderId === userId || m.receiverId === userId);
    }

    static getConversation(userId, otherUserId) {
        const messages = StorageService.getMessages();
        return messages.filter(m => 
            (m.senderId === userId && m.receiverId === otherUserId) ||
            (m.senderId === otherUserId && m.receiverId === userId)
        ).sort((a, b) => a.timestamp - b.timestamp);
    }

    static saveMessage(message) {
        const messages = StorageService.getMessages();
        messages.push(message);
        return StorageService.set(STORAGE_KEYS.MESSAGES, messages);
    }

    static getCurrentUser() {
        return StorageService.get(STORAGE_KEYS.CURRENT_USER);
    }

    static setCurrentUser(user) {
        if (user) {
            return StorageService.set(STORAGE_KEYS.CURRENT_USER, user);
        }
        return StorageService.remove(STORAGE_KEYS.CURRENT_USER);
    }

    static clearCurrentUser() {
        return StorageService.remove(STORAGE_KEYS.CURRENT_USER);
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static initializeSeedData() {
        if (StorageService.getUsers().length === 0) {
            const seedUsers = [
                {
                    id: 'seed_landlord_1',
                    username: 'John Landlord',
                    email: 'landlord@demo.com',
                    password: 'demo123',
                    phone: '555-0100',
                    role: 'landlord',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'seed_tenant_1',
                    username: 'Jane Tenant',
                    email: 'tenant@demo.com',
                    password: 'demo123',
                    phone: '555-0101',
                    role: 'tenant',
                    createdAt: new Date().toISOString()
                }
            ];

            const seedProperties = [
                {
                    id: 'prop_1',
                    ownerId: 'seed_landlord_1',
                    title: 'Modern Downtown Apartment',
                    description: 'Beautiful 2BR apartment in the heart of downtown',
                    price: 250000,
                    type: 'apartment',
                    bedrooms: 2,
                    bathrooms: 2,
                    sqft: 1200,
                    address: '123 Main St, City, State 12345',
                    status: 'available',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'prop_2',
                    ownerId: 'seed_landlord_1',
                    title: 'Cozy Suburban House',
                    description: 'Perfect family home with spacious backyard',
                    price: 450000,
                    type: 'house',
                    bedrooms: 4,
                    bathrooms: 3,
                    sqft: 2400,
                    address: '456 Oak Ave, Suburb, State 12345',
                    status: 'available',
                    createdAt: new Date().toISOString()
                }
            ];

            const seedBookings = [
                {
                    id: 'book_1',
                    propertyId: 'prop_1',
                    tenantId: 'seed_tenant_1',
                    status: 'pending',
                    message: 'Interested in scheduling a viewing',
                    createdAt: new Date().toISOString()
                }
            ];

            const seedMessages = [
                {
                    id: 'msg_1',
                    senderId: 'seed_tenant_1',
                    receiverId: 'seed_landlord_1',
                    content: 'Hi, I am interested in your property.',
                    timestamp: new Date().toISOString(),
                    read: false
                },
                {
                    id: 'msg_2',
                    senderId: 'seed_landlord_1',
                    receiverId: 'seed_tenant_1',
                    content: 'Thank you! Would you like to schedule a viewing?',
                    timestamp: new Date().toISOString(),
                    read: false
                }
            ];

            StorageService.set(STORAGE_KEYS.USERS, seedUsers);
            StorageService.set(STORAGE_KEYS.PROPERTIES, seedProperties);
            StorageService.set(STORAGE_KEYS.BOOKINGS, seedBookings);
            StorageService.set(STORAGE_KEYS.MESSAGES, seedMessages);
            
            console.log('Seed data initialized');
        }
    }
}
