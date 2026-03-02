// ========================
// INITIALIZE STORAGE
// ========================
function initStorage() {
    if (!localStorage.getItem('nestify_users')) {
        localStorage.setItem('nestify_users', JSON.stringify([]));
    }
    if (!localStorage.getItem('nestify_properties')) {
        localStorage.setItem('nestify_properties', JSON.stringify([]));
    }
}

initStorage();

// ========================
// AUTHENTICATION SYSTEM
// ========================

// Modal Elements
const authModal = document.getElementById('authModal');
const closeModalBtn = document.getElementById('closeModal');
const tabs = document.querySelectorAll('.tab');
const formContents = document.querySelectorAll('.form-content');
const roleOptions = document.querySelectorAll('.role-option input[name="role"]');
const landlordUpload = document.getElementById('landlord-upload');

// Open Modal Function
function openAuthModal(tab = 'signin') {
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
}

// Close Modal Function
function closeAuthModal() {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Tab Switching
function switchTab(tabName) {
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    formContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Event Listeners
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeAuthModal);
}

if (authModal) {
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// Role Selection - Show/Hide Landlord Upload
roleOptions.forEach(option => {
    option.addEventListener('change', (e) => {
        const isLandlord = e.target.value === 'landlord';
        document.querySelectorAll('.role-option').forEach(opt => {
            opt.classList.toggle('active', opt.querySelector('input').checked);
        });
        if (landlordUpload) {
            landlordUpload.classList.toggle('hidden', !isLandlord);
        }
    });
});

// Handle Sign In
document.getElementById('signinForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    const users = JSON.parse(localStorage.getItem('nestify_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        const session = {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        localStorage.setItem('nestify_session', JSON.stringify(session));
        closeAuthModal();
        updateUIForLoggedInUser(session);
        alert('Welcome back, ' + user.name + '!');
    } else {
        alert('Invalid email or password');
    }
});

// Handle Register
document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
    const users = JSON.parse(localStorage.getItem('nestify_users') || '[]');
    
    // Check if email exists
    if (users.find(u => u.email === email)) {
        alert('Email already registered');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password,
        role,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('nestify_users', JSON.stringify(users));
    
    // Auto login
    const session = {
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
    };
    localStorage.setItem('nestify_session', JSON.stringify(session));
    
    closeAuthModal();
    updateUIForLoggedInUser(session);
    alert('Account created successfully!');
});

// Update UI for Logged In User
function updateUIForLoggedInUser(session) {
    const navAuth = document.getElementById('nav-auth');
    const userMenu = document.getElementById('user-menu');
    
    if (navAuth && userMenu) {
        navAuth.style.display = 'none';
        userMenu.style.display = 'block';
        
        document.getElementById('user-avatar').textContent = session.name.charAt(0).toUpperCase();
        document.getElementById('user-name').textContent = session.name;
        document.getElementById('dropdown-name').textContent = session.name;
        document.getElementById('dropdown-email').textContent = session.email;
    }
}

// Logout Function
const Auth = {
    logout: function() {
        localStorage.removeItem('nestify_session');
        
        const navAuth = document.getElementById('nav-auth');
        const userMenu = document.getElementById('user-menu');
        
        if (navAuth && userMenu) {
            navAuth.style.display = 'flex';
            userMenu.style.display = 'none';
        }
        
        // Redirect based on current page location
        if (window.location.href.includes('pages/dashboard.html')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    }
};

// Check Session on Page Load
function checkAuth() {
    const session = JSON.parse(localStorage.getItem('nestify_session'));
    if (session) {
        updateUIForLoggedInUser(session);
    }
}

// User Menu Dropdown Toggle
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const userBtn = document.querySelector('.user-btn');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });

        document.addEventListener('click', function() {
            userDropdown.classList.remove('active');
        });
    }
});

// Quick Filter Function
function quickFilter(value) {
    const url = new URL(window.location.href);
    if (value === 'price-low') {
        url.searchParams.set('sort', 'price-asc');
    } else if (value === 'sale' || value === 'rent') {
        url.searchParams.set('listingType', value);
    } else {
        url.searchParams.set('type', value);
    }
    window.location.href = url.toString();
}

// Open modal on login link click
document.querySelectorAll('a[href="login.html"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        openAuthModal('signin');
    });
});

// Open modal on .open-auth-modal click
document.querySelectorAll('.open-auth-modal').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const tab = this.getAttribute('data-tab') || 'signin';
        openAuthModal(tab);
    });
});
