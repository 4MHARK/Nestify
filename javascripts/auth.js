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

// Modal Elements - with null checks
const authModal = document.getElementById('authModal');
const closeModalBtn = document.getElementById('closeModal');
const tabs = document.querySelectorAll('.tab');
const formContents = document.querySelectorAll('.form-content');
const roleOptions = document.querySelectorAll('.role-option input[name="role"]');
const landlordUpload = document.getElementById('landlord-upload');

// Open Modal Function
function openAuthModal(tab = 'signin') {
    if (!authModal) return;
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
}

// Close Modal Function
function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Tab Switching
function switchTab(tabName) {
    if (!tabs || !formContents) return;
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    formContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Event Listeners - only if elements exist
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeAuthModal);
}

if (authModal) {
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });
}

if (tabs) {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

// Role Selection - Show/Hide Landlord Upload - only if elements exist
if (roleOptions) {
    roleOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            const isLandlord = e.target.value === 'landlord';
            document.querySelectorAll('.role-option').forEach(opt => {
                opt.classList.toggle('active', opt.querySelector('input').checked);
            });
            if (landlordUpload) {
                landlordUpload.classList.toggle('hidden', !isLandlord);
            }
            
            // Update required attribute on file input
            const idUpload = document.getElementById('id-upload');
            if (idUpload) {
                idUpload.required = isLandlord;
            }
        });
    });
}

// File upload visual feedback - only if element exists
const idUploadInput = document.getElementById('id-upload');
if (idUploadInput) {
    // Make clicking on the box trigger file input
    const fileBox = idUploadInput.closest('.file-upload-box');
    if (fileBox) {
        fileBox.addEventListener('click', function(e) {
            // Don't trigger click if already clicking on the input
            if (e.target !== idUploadInput) {
                idUploadInput.click();
            }
        });
    }
    
    idUploadInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            // Keep the input but add visual feedback
            fileBox.classList.add('file-selected');
            // Create feedback elements without removing the input
            const existingFeedback = fileBox.querySelector('.file-feedback');
            if (!existingFeedback) {
                const feedback = document.createElement('div');
                feedback.className = 'file-feedback';
                feedback.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <p>${this.files[0].name}</p>
                    <small>Click to change file</small>
                `;
                fileBox.appendChild(feedback);
            } else {
                existingFeedback.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <p>${this.files[0].name}</p>
                    <small>Click to change file</small>
                `;
            }
        }
    });
}

// Close Modal Function
function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Tab Switching
function switchTab(tabName) {
    if (!tabs || !formContents) return;
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

if (tabs) {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

// Role Selection - Show/Hide Landlord Upload
if (roleOptions) {
    roleOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            const isLandlord = e.target.value === 'landlord';
            document.querySelectorAll('.role-option').forEach(opt => {
                opt.classList.toggle('active', opt.querySelector('input').checked);
            });
            if (landlordUpload) {
                landlordUpload.classList.toggle('hidden', !isLandlord);
                // Force show the upload box
                landlordUpload.style.display = isLandlord ? 'block' : 'none';
            }
            
            // Update required attribute on file input
            const idUpload = document.getElementById('id-upload');
            if (idUpload) {
                idUpload.required = isLandlord;
            }
        });
    });
}

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
        showToast('Welcome back, ' + user.name + '!', 'success');
        
        // Redirect based on role
        if (user.role === 'landlord') {
            window.location.href = 'pages/dashboard.html';
        } else if (user.role === 'tenant') {
            window.location.href = 'pages/tenant-dashboard.html';
        }
    } else {
        showToast('Invalid email or password', 'error');
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
    const idUpload = document.getElementById('id-upload');
    
    // Require ID upload for landlords
    if (role === 'landlord') {
        // Check multiple ways to ensure file is uploaded
        const hasFile = idUpload && idUpload.files && idUpload.files.length > 0;
        if (!hasFile) {
            showToast('Please upload your ID or Business License to register as a landlord.', 'warning');
            return;
        }
    }
    
    const users = JSON.parse(localStorage.getItem('nestify_users') || '[]');
    
    // Check if email exists
    if (users.find(u => u.email === email)) {
        showToast('Email already registered', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password,
        role,
        idFile: idUpload && idUpload.files.length > 0 ? idUpload.files[0].name : null,
        idVerified: false,
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
    showToast('Account created successfully!', 'success');
    
    // Redirect based on role
    if (newUser.role === 'landlord') {
        window.location.href = 'pages/dashboard.html';
    } else if (newUser.role === 'tenant') {
        window.location.href = 'pages/tenant-dashboard.html';
    }
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
        
        // Update dashboard link based on role
        const dashboardLinks = document.querySelectorAll('a[href*="dashboard.html"]');
        dashboardLinks.forEach(link => {
            if (session.role === 'tenant') {
                link.href = 'pages/tenant-dashboard.html';
            } else {
                link.href = 'pages/dashboard.html';
            }
        });
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
        
        // Determine redirect path based on current location
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/pages/')) {
            // We're in pages folder - go up one level to index.html
            window.location.href = '../index.html';
        } else {
            // We're in root folder
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

// Forgot Password Functions
function showResetPassword() {
    switchTab('forgotpassword');
}

function switchTab(tabName) {
    if (!tabs || !formContents) return;
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    formContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Handle Forgot Password
document.getElementById('forgotPasswordForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    const users = JSON.parse(localStorage.getItem('nestify_users') || '[]');
    const user = users.find(u => u.email === email);
    
    if (!user) {
        // Don't reveal if email exists
        showToast('If an account exists with this email, you will receive a password reset link.', 'info');
        document.getElementById('forgotPasswordForm').reset();
        return;
    }
    
    // In a real app, this would send an email
    // For demo, we'll just show success
    showToast('Password reset link sent!', 'success');
    document.getElementById('forgotPasswordForm').reset();
    switchTab('signin');
});
