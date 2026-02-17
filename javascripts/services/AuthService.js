class AuthService {
    static ROLES = {
        TENANT: 'tenant',
        LANDLORD: 'landlord'
    };

    static DASHBOARD_ROUTES = {
        tenant: 'property-listings.html',
        landlord: 'admin-dashboard.html'
    };

    static register(userData) {
        const { username, email, password, phone, role } = userData;

        if (!username || !email || !password || !role) {
            return { success: false, error: 'All fields are required' };
        }

        if (StorageService.findUserByEmail(email)) {
            return { success: false, error: 'Email already registered' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        const user = {
            id: StorageService.generateId(),
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            phone: phone || '',
            role: role,
            createdAt: new Date().toISOString()
        };

        if (!StorageService.saveUser(user)) {
            return { success: false, error: 'Failed to save user' };
        }

        const { password: _, ...safeUser } = user;
        
        localStorage.setItem('nestify_currentUser', JSON.stringify(safeUser));

        return { success: true, user: safeUser, redirect: AuthService.DASHBOARD_ROUTES[role] };
    }

    static login(email, password) {
        if (!email || !password) {
            return { success: false, error: 'Email and password are required' };
        }

        const user = StorageService.findUserByEmail(email);
        
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.password !== password) {
            return { success: false, error: 'Invalid password' };
        }

        const { password: _, ...safeUser } = user;
        
        localStorage.setItem('nestify_currentUser', JSON.stringify(safeUser));

        return { success: true, user: safeUser, redirect: AuthService.DASHBOARD_ROUTES[user.role] };
    }

    static logout() {
        localStorage.removeItem('nestify_currentUser');
        window.location.href = 'index.html';
    }

    static getCurrentUser() {
        try {
            const currentUser = localStorage.getItem('nestify_currentUser');
            return currentUser ? JSON.parse(currentUser) : null;
        } catch (error) {
            return null;
        }
    }

    static isAuthenticated() {
        return !!AuthService.getCurrentUser();
    }

    static hasRole(role) {
        const user = AuthService.getCurrentUser();
        return user && user.role === role;
    }

    static redirectByRole() {
        const user = AuthService.getCurrentUser();
        if (!user) return null;
        
        const redirect = AuthService.DASHBOARD_ROUTES[user.role];
        if (redirect && window.location.href.includes(redirect)) {
            return null;
        }
        
        return redirect;
    }
}
