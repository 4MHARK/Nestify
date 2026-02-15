
        // Get Elements
        const modal = document.getElementById('authModal');
        const openBtn = document.querySelector('.btn-login');
        const closeBtn = document.getElementById('closeModal');
        const tabs = document.querySelectorAll('.tab');
        const formContents = document.querySelectorAll('.form-content');

        // Open Modal
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        });

        // Close Modal
        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }

        closeBtn.addEventListener('click', closeModal);

        // Close modal when clicking outside the card
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        // Tab Switching
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Remove active class from all tabs and forms
                tabs.forEach(t => t.classList.remove('active'));
                formContents.forEach(fc => fc.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding form
                tab.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });

        // Form Submission Handlers (Demo - prevent actual submission)
        document.getElementById('signinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;
            
            console.log('Sign In:', { email, password });
            alert('Sign In Submitted! (Check console for data)');
            
            // Here you would typically send data to your backend
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const role = document.querySelector('input[name="role"]:checked').value;
            
            console.log('Register:', { name, email, password, role });
            alert('Registration Submitted! (Check console for data)');
            
            // Here you would typically send data to your backend
        });