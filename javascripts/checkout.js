document.addEventListener('DOMContentLoaded', function() {
    StorageService.initializeSeedData();
    
    const user = AuthService.getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get booking ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    
    if (!bookingId) {
        window.location.href = 'tenant-profile.html';
        return;
    }
    
    // Load booking details
    const bookings = StorageService.getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking || booking.status !== 'approved') {
        window.location.href = 'tenant-profile.html';
        return;
    }
    
    const property = PropertyService.getPropertyById(booking.propertyId);
    if (!property) {
        window.location.href = 'tenant-profile.html';
        return;
    }
    
    // Populate property info
    document.getElementById('propertyImage').src = property.images?.[0] || './img/card1.jpg';
    document.getElementById('propertyTitle').textContent = property.title;
    document.getElementById('propertyAddress').textContent = property.address || 'Location not specified';
    document.getElementById('checkInDate').textContent = booking.checkIn || '-';
    document.getElementById('checkOutDate').textContent = booking.checkOut || '-';
    document.getElementById('guestCount').textContent = booking.guests || '1';
    
    // Price
    const propertyPrice = property.price || 0;
    const securityDeposit = 1000;
    const serviceFee = 0;
    const total = propertyPrice + securityDeposit + serviceFee;
    
    document.getElementById('propertyPrice').textContent = `$${propertyPrice.toLocaleString()}`;
    document.getElementById('totalPrice').textContent = `$${total.toLocaleString()}`;
    
    // Format card number input
    const cardNumberInput = document.getElementById('cardNumber');
    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
        let formatted = value.match(/.{1,4}/g)?.join(' ') || '';
        e.target.value = formatted;
    });
    
    // Format expiry date input
    const expiryInput = document.getElementById('expiryDate');
    expiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        e.target.value = value;
    });
    
    // Format CVV input
    const cvvInput = document.getElementById('cvv');
    cvvInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
    
    // Form submission
    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        
        // Validate
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        const expiry = expiryInput.value;
        const cvv = cvvInput.value;
        const cardName = document.getElementById('cardName').value.trim();
        
        let isValid = true;
        
        // Validate card number (Luhn algorithm)
        if (!validateCardNumber(cardNumber)) {
            showError('cardNumberError', 'Please enter a valid card number');
            cardNumberInput.classList.add('error');
            isValid = false;
        }
        
        // Validate expiry date
        if (!validateExpiry(expiry)) {
            showError('expiryError', 'Invalid or expired date');
            expiryInput.classList.add('error');
            isValid = false;
        }
        
        // Validate CVV
        if (!validateCVV(cvv)) {
            showError('cvvError', 'Enter 3-4 digits');
            cvvInput.classList.add('error');
            isValid = false;
        }
        
        // Validate cardholder name
        if (cardName.length < 2) {
            showError('cardNameError', 'Enter cardholder name');
            document.getElementById('cardName').classList.add('error');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Process payment
        processPayment(booking, property);
    });
});

function validateCardNumber(number) {
    if (!/^\d{13,19}$/.test(number)) return false;
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

function validateExpiry(expiry) {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    
    const [month, year] = expiry.split('/').map(Number);
    
    if (month < 1 || month > 12) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false;
    }
    
    return true;
}

function validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
}

function processPayment(booking, property) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('show');
    
    // Generate transaction ID
    const transactionId = 'TXN-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // 5 second delay
    setTimeout(() => {
        // Update booking status
        const bookings = StorageService.getBookings();
        const bookingIndex = bookings.findIndex(b => b.id === booking.id);
        
        if (bookingIndex > -1) {
            bookings[bookingIndex].status = 'completed';
            bookings[bookingIndex].paymentStatus = 'paid';
            bookings[bookingIndex].paidAt = new Date().toISOString();
            bookings[bookingIndex].transactionId = transactionId;
            StorageService.set('nestify_bookings', bookings);
        }
        
        // Populate receipt data
        populateReceipt(booking, property, transactionId);
        
        // Hide loading, show success
        loadingOverlay.classList.remove('show');
        
        const successModal = document.getElementById('successModal');
        successModal.classList.add('show');
        
        // Handle receipt modal
        document.getElementById('viewReceiptBtn').addEventListener('click', () => {
            successModal.classList.remove('show');
            document.getElementById('receiptModal').classList.add('show');
        });
        
        document.getElementById('closeReceipt').addEventListener('click', () => {
            document.getElementById('receiptModal').classList.remove('show');
            window.location.href = 'tenant-profile.html';
        });
        
        document.getElementById('downloadReceiptBtn').addEventListener('click', () => {
            downloadReceipt(booking, property, transactionId);
        });
        
        document.getElementById('goToProfileBtn').addEventListener('click', () => {
            window.location.href = 'tenant-profile.html';
        });
    }, 5000);
}

function populateReceipt(booking, property, transactionId) {
    const propertyPrice = property.price || 0;
    const securityDeposit = 1000;
    const serviceFee = 0;
    const total = propertyPrice + securityDeposit + serviceFee;
    const paidAt = new Date();
    
    document.getElementById('receiptBookingId').textContent = booking.id;
    document.getElementById('receiptTransactionId').textContent = transactionId;
    document.getElementById('receiptDate').textContent = paidAt.toLocaleDateString() + ' ' + paidAt.toLocaleTimeString();
    document.getElementById('receiptPropertyImage').src = property.images?.[0] || './img/card1.jpg';
    document.getElementById('receiptPropertyTitle').textContent = property.title;
    document.getElementById('receiptPropertyAddress').textContent = property.address || 'Location not specified';
    document.getElementById('receiptCheckIn').textContent = booking.checkIn || '-';
    document.getElementById('receiptCheckOut').textContent = booking.checkOut || '-';
    document.getElementById('receiptGuests').textContent = booking.guests || '1';
    document.getElementById('receiptPropertyPrice').textContent = '$' + propertyPrice.toLocaleString();
    document.getElementById('receiptTotal').textContent = '$' + total.toLocaleString();
}

function downloadReceipt(booking, property, transactionId) {
    const propertyPrice = property.price || 0;
    const securityDeposit = 1000;
    const serviceFee = 0;
    const total = propertyPrice + securityDeposit + serviceFee;
    const paidAt = new Date();
    
    const receiptContent = `
NESTIFY - PAYMENT RECEIPT
========================

BOOKING CONFIRMATION
--------------------
Confirmation ID: ${booking.id}
Transaction ID: ${transactionId}
Date: ${paidAt.toLocaleDateString()} ${paidAt.toLocaleTimeString()}
Status: PAID

PROPERTY DETAILS
----------------
Property: ${property.title}
Address: ${property.address || 'Location not specified'}

BOOKING DETAILS
---------------
Check-In: ${booking.checkIn || '-'}
Check-Out: ${booking.checkOut || '-'}
Guests: ${booking.guests || '1'}

PAYMENT BREAKDOWN
-----------------
Property Price:    $${propertyPrice.toLocaleString()}
Security Deposit:  $1,000
Service Fee:       $0
--------------------
TOTAL PAID:        $${total.toLocaleString()}

========================
Thank you for choosing Nestify!
========================
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nestify-Receipt-${booking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
