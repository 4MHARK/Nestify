// ========================
// CHECKOUT PAGE
// ========================

let currentBooking = null;
let currentProperty = null;
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initCheckout();
});

function initCheckout() {
    // Check authentication
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    if (!session) {
        window.location.href = '../index.html';
        return;
    }
    currentUser = session;
    
    // Check if tenant
    if (session.role !== 'tenant') {
        alert('Access denied. Tenant account required.');
        window.location.href = '../index.html';
        return;
    }
    
    updateNavUI(session);
    
    // Get booking ID from sessionStorage
    const bookingId = parseInt(sessionStorage.getItem('checkout_booking_id'));
    if (!bookingId) {
        alert('No booking found');
        window.location.href = 'tenant-dashboard.html';
        return;
    }
    
    loadBooking(bookingId);
    setupCardInputFormatting();
}

function updateNavUI(session) {
    const navAuth = document.getElementById('nav-auth');
    const userMenu = document.getElementById('user-menu');
    
    if (session) {
        navAuth.style.display = 'none';
        userMenu.style.display = 'block';
        document.getElementById('user-avatar').textContent = session.name.charAt(0).toUpperCase();
        document.getElementById('user-name').textContent = session.name;
        document.getElementById('dropdown-name').textContent = session.name;
        document.getElementById('dropdown-email').textContent = session.email;
    }
}

function loadBooking(bookingId) {
    const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
    const properties = JSON.parse(localStorage.getItem('nestify_properties') || '[]');
    
    currentBooking = bookings.find(b => b.id === bookingId);
    
    if (!currentBooking) {
        alert('Booking not found');
        window.location.href = 'tenant-dashboard.html';
        return;
    }
    
    // Verify booking belongs to current user
    if (currentBooking.tenantId !== currentUser.userId && currentBooking.buyerId !== currentUser.userId) {
        alert('Access denied');
        window.location.href = 'tenant-dashboard.html';
        return;
    }
    
    // Check if already paid
    if (currentBooking.status === 'completed' || currentBooking.paidAt) {
        alert('This booking has already been paid');
        window.location.href = 'tenant-dashboard.html';
        return;
    }
    
    currentProperty = properties.find(p => p.id === currentBooking.propertyId);
    
    if (!currentProperty) {
        alert('Property not found');
        return;
    }
    
    displayBookingDetails();
}

function displayBookingDetails() {
    // Property details
    const propertyDetails = document.getElementById('property-details');
    const image = currentProperty.images && currentProperty.images.length > 0 
        ? currentProperty.images[0] 
        : 'https://via.placeholder.com/400x300?text=No+Image';
    
    propertyDetails.innerHTML = `
        <img src="${image}" alt="${currentProperty.title}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <h4>${currentProperty.title}</h4>
        <p><i class="fas fa-map-marker-alt"></i> ${currentProperty.location}</p>
    `;
    
    // Summary
    document.getElementById('summary-property').textContent = currentProperty.title;
    document.getElementById('summary-type').textContent = currentBooking.type === 'rental' ? 'Rental' : 'Purchase';
    
    // Dates
    let datesText = '';
    if (currentBooking.type === 'rental' && currentBooking.checkIn && currentBooking.checkOut) {
        datesText = `${formatDate(currentBooking.checkIn)} - ${formatDate(currentBooking.checkOut)}`;
    } else if (currentBooking.scheduledDate) {
        datesText = formatDate(currentBooking.scheduledDate);
    } else {
        datesText = 'N/A';
    }
    document.getElementById('summary-dates').textContent = datesText;
    
    // Price
    const price = currentProperty.price;
    const priceText = currentBooking.type === 'rental' 
        ? `$${price.toLocaleString()}/month`
        : `$${price.toLocaleString()}`;
    document.getElementById('summary-total').textContent = priceText;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format card number input
function setupCardInputFormatting() {
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCvv = document.getElementById('card-cvv');
    
    // Format card number with spaces
    cardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = value;
    });
    
    // Format expiry as MM/YY
    cardExpiry.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
    
    // Only numbers for CVV
    cardCvv.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

// Luhn Algorithm for card validation
function luhnCheck(cardNumber) {
    // Remove spaces
    const digits = cardNumber.replace(/\s/g, '');
    
    if (!/^\d+$/.test(digits) || digits.length < 13 || digits.length > 19) {
        return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Validate expiry date
function validateExpiry(expiry) {
    const parts = expiry.split('/');
    if (parts.length !== 2) return false;
    
    const month = parseInt(parts[0], 10);
    const year = parseInt('20' + parts[1], 10);
    
    if (month < 1 || month > 12) return false;
    
    const now = new Date();
    const expDate = new Date(year, month);
    
    return expDate > now;
}

// Handle form submission
document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cardName = document.getElementById('card-name').value.trim();
    const cardNumber = document.getElementById('card-number').value.trim();
    const cardExpiry = document.getElementById('card-expiry').value.trim();
    const cardCvv = document.getElementById('card-cvv').value.trim();
    
    // Clear previous errors
    document.querySelectorAll('.form-group input').forEach(input => {
        input.classList.remove('error');
    });
    
    // Validate card name
    if (!cardName) {
        document.getElementById('card-name').classList.add('error');
        alert('Please enter cardholder name');
        return;
    }
    
    // Validate card number with Luhn
    if (!luhnCheck(cardNumber)) {
        document.getElementById('card-number').classList.add('error');
        alert('Invalid card number. Please check and try again.');
        return;
    }
    
    // Validate expiry
    if (!validateExpiry(cardExpiry)) {
        document.getElementById('card-expiry').classList.add('error');
        alert('Invalid or expired card. Please check the expiry date.');
        return;
    }
    
    // Validate CVV
    if (!cardCvv || cardCvv.length < 3) {
        document.getElementById('card-cvv').classList.add('error');
        alert('Please enter a valid CVV');
        return;
    }
    
    // Process payment
    processPayment();
});

function processPayment() {
    const paymentModal = document.getElementById('paymentModal');
    const paymentStatus = document.getElementById('payment-status');
    const paymentSuccess = document.getElementById('payment-success');
    const paymentError = document.getElementById('payment-error');
    
    // Show processing modal
    paymentModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    paymentStatus.style.display = 'block';
    paymentSuccess.style.display = 'none';
    paymentError.style.display = 'none';
    
    // Simulate payment processing (2-3 seconds)
    setTimeout(function() {
        // Update booking status
        const bookings = JSON.parse(localStorage.getItem('nestify_bookings') || '[]');
        const index = bookings.findIndex(b => b.id === currentBooking.id);
        
        if (index !== -1) {
            bookings[index].status = 'completed';
            bookings[index].paidAt = new Date().toISOString();
            bookings[index].paymentMethod = 'card';
            bookings[index].transactionId = 'TXN' + Date.now();
            localStorage.setItem('nestify_bookings', JSON.stringify(bookings));
        }
        
        // Show success
        paymentStatus.style.display = 'none';
        paymentSuccess.style.display = 'block';
        
        // Generate receipt
        generateReceipt();
        
        // After 2 seconds, show receipt modal
        setTimeout(function() {
            paymentModal.classList.remove('active');
            document.getElementById('receiptModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 2000);
        
    }, 2500);
}

function generateReceipt() {
    const receipt = document.getElementById('receipt');
    const transactionId = 'TXN' + Date.now();
    const amount = currentProperty.price;
    const amountText = currentBooking.type === 'rental' 
        ? `$${amount.toLocaleString()}/month`
        : `$${amount.toLocaleString()}`;
    
    receipt.innerHTML = `
        <div class="receipt-header">
            <h2><i class="fas fa-home"></i> Nestify</h2>
            <p>Payment Receipt</p>
        </div>
        <div class="receipt-row">
            <span>Transaction ID</span>
            <span>${transactionId}</span>
        </div>
        <div class="receipt-row">
            <span>Date</span>
            <span>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div class="receipt-row">
            <span>Property</span>
            <span>${currentProperty.title}</span>
        </div>
        <div class="receipt-row">
            <span>Type</span>
            <span>${currentBooking.type === 'rental' ? 'Rental' : 'Purchase'}</span>
        </div>
        <div class="receipt-row">
            <span>Card</span>
            <span>**** **** **** ${document.getElementById('card-number').value.slice(-4)}</span>
        </div>
        <div class="receipt-row total">
            <span>Amount Paid</span>
            <span>${amountText}</span>
        </div>
        <div class="receipt-footer">
            <p>Thank you for your payment!</p>
            <p>Keep this receipt for your records</p>
        </div>
    `;
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('active');
    document.body.style.overflow = '';
    // Redirect to dashboard
    window.location.href = 'tenant-dashboard.html';
}

function printReceipt() {
    const receiptContent = document.getElementById('receipt').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Receipt - Nestify</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt-header { text-align: center; padding-bottom: 16px; border-bottom: 2px dashed #ccc; margin-bottom: 16px; }
                .receipt-header h2 { color: #1d4ed8; margin: 0; }
                .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; }
                .receipt-row.total { border-top: 2px solid #ccc; margin-top: 8px; padding-top: 16px; font-weight: bold; }
                .receipt-footer { text-align: center; padding-top: 16px; border-top: 1px solid #ccc; margin-top: 16px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            ${receiptContent}
            <script>window.print(); window.close();<\/script>
        </body>
        </html>
    `);
}

// Close modals on overlay click
document.getElementById('receiptModal').addEventListener('click', function(e) {
    if (e.target === this) closeReceiptModal();
});
