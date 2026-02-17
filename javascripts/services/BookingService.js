class BookingService {
    static getMyBookings() {
        const user = AuthService.getCurrentUser();
        if (!user) return [];

        if (user.role === 'tenant') {
            return StorageService.getBookingsByTenant(user.id);
        } else {
            return StorageService.getBookingsByPropertyOwner(user.id);
        }
    }

    static createBooking(bookingData) {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'tenant') {
            return { success: false, error: 'Only tenants can create bookings' };
        }

        const property = PropertyService.getPropertyById(bookingData.propertyId);
        if (!property) {
            return { success: false, error: 'Property not found' };
        }

        if (property.ownerId === user.id) {
            return { success: false, error: 'Cannot book your own property' };
        }

        const booking = {
            id: StorageService.generateId(),
            propertyId: bookingData.propertyId,
            tenantId: user.id,
            checkIn: bookingData.checkIn || null,
            checkOut: bookingData.checkOut || null,
            guests: bookingData.guests || 1,
            status: 'pending',
            message: bookingData.message || '',
            createdAt: new Date().toISOString()
        };

        if (!StorageService.saveBooking(booking)) {
            return { success: false, error: 'Failed to create booking' };
        }

        return { success: true, booking };
    }

    static updateBookingStatus(bookingId, status) {
        const bookings = StorageService.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        const property = PropertyService.getPropertyById(booking.propertyId);
        const user = AuthService.getCurrentUser();
        
        if (property.ownerId !== user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        booking.status = status;
        booking.updatedAt = new Date().toISOString();
        
        if (!StorageService.saveBooking(booking)) {
            return { success: false, error: 'Failed to update booking' };
        }

        return { success: true, booking };
    }

    static cancelBooking(bookingId) {
        const bookings = StorageService.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        const user = AuthService.getCurrentUser();
        
        if (booking.tenantId !== user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        booking.status = 'cancelled';
        booking.updatedAt = new Date().toISOString();
        
        if (!StorageService.saveBooking(booking)) {
            return { success: false, error: 'Failed to cancel booking' };
        }

        return { success: true, booking };
    }
}
