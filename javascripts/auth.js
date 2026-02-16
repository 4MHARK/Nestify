const modal = document.getElementById('authModal');
const openBtn = document.querySelector('.btn-login');
const closeBtn = document.getElementById('closeModal');
const tabs = document.querySelectorAll('.tab');
const formcontents = document.querySelectorAll('.form-content');
const roleRadio = document.querySelectorAll('input[name="role"]');
const uploadSection = document.getElementById('landlord-upload');
const uploadFile = document.getElementById('id-upload');

openBtn.addEventListener('click', () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');
        formcontents.forEach(f => f.classList.remove('active'));
        document.getElementById(target).classList.add('active');
    });
});

roleRadio.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'landlord') {
            uploadSection.classList.remove('hidden');
            uploadSection.classList.add('visible');
            uploadFile.setAttribute('required', 'true');
        } else {
            uploadSection.classList.add('hidden');
            uploadSection.classList.remove('visible');
            uploadFile.removeAttribute('required');
        }
    });
});

document.getElementById('signinform').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    const result = AuthService.login(email, password);

     StorageService.initializeSeedData();

 if (AuthService.isAuthenticated()) {
     const redirect = AuthService.redirectByRole();
    if (redirect) {
         window.location.href = redirect;
     }
 }
    
    if (result.success) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('signinform').reset();
        window.location.href = result.redirect;
    } else {
        alert(result.error);
    }
});

document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-number').value;
    const password = document.getElementById('register-password').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
    const result = AuthService.register({ username, email, phone, password, role });
    
    if (result.success) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('register-form').reset();
        window.location.href = result.redirect;
    } else {
        alert(result.error);
    }
});
