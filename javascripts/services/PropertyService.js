class PropertyService {
    static getAllProperties() {
        return StorageService.getProperties();
    }

    static getAvailableProperties() {
        return StorageService.getProperties().filter(p => p.status === 'available');
    }

    static getPropertyById(id) {
        const properties = StorageService.getProperties();
        return properties.find(p => p.id === id);
    }

    static getMyProperties(ownerId) {
        return StorageService.getPropertiesByOwner(ownerId);
    }

    static createProperty(propertyData) {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'landlord') {
            return { success: false, error: 'Only landlords can create properties' };
        }

        const property = {
            id: StorageService.generateId(),
            ownerId: user.id,
            title: propertyData.title,
            description: propertyData.description || '',
            price: parseFloat(propertyData.price),
            type: propertyData.type || 'apartment',
            bedrooms: parseInt(propertyData.bedrooms) || 0,
            bathrooms: parseInt(propertyData.bathrooms) || 0,
            sqft: parseInt(propertyData.sqft) || 0,
            address: propertyData.address || '',
            status: 'available',
            createdAt: new Date().toISOString()
        };

        if (!StorageService.saveProperty(property)) {
            return { success: false, error: 'Failed to save property' };
        }

        return { success: true, property };
    }

    static updateProperty(id, updates, requireOwnership = true) {
        const property = PropertyService.getPropertyById(id);
        if (!property) {
            return { success: false, error: 'Property not found' };
        }

        if (requireOwnership) {
            const user = AuthService.getCurrentUser();
            if (property.ownerId !== user.id) {
                return { success: false, error: 'Unauthorized' };
            }
        }

        const updatedProperty = { ...property, ...updates, updatedAt: new Date().toISOString() };
        
        if (!StorageService.saveProperty(updatedProperty)) {
            return { success: false, error: 'Failed to update property' };
        }

        return { success: true, property: updatedProperty };
    }

    static deleteProperty(id) {
        const property = PropertyService.getPropertyById(id);
        if (!property) {
            return { success: false, error: 'Property not found' };
        }

        const user = AuthService.getCurrentUser();
        if (property.ownerId !== user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const properties = StorageService.getProperties();
        const filtered = properties.filter(p => p.id !== id);
        StorageService.set(STORAGE_KEYS.PROPERTIES, filtered);

        return { success: true };
    }
}
