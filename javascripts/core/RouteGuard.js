class RouteGuard {
    static REQUIRED_ROLE = {
        TENANT: 'tenant',
        LANDLORD: 'landlord'
    };

    static init(requiredRole) {
        try {
            const currentUser = localStorage.getItem('nestify_currentUser');
            
            if (!currentUser) {
                RouteGuard.redirectToHome();
                return false;
            }

            const user = JSON.parse(currentUser);

            if (!user || !user.id) {
                RouteGuard.redirectToHome();
                return false;
            }

            if (requiredRole && user.role !== requiredRole) {
                RouteGuard.redirectToHome();
                return false;
            }

            return true;
        } catch (error) {
            console.error('RouteGuard error:', error);
            RouteGuard.redirectToHome();
            return false;
        }
    }

    static redirectToHome() {
        window.location.href = 'index.html';
    }

    static requireAuth() {
        return RouteGuard.init(null);
    }

    static requireTenant() {
        return RouteGuard.init(RouteGuard.REQUIRED_ROLE.TENANT);
    }

    static requireLandlord() {
        return RouteGuard.init(RouteGuard.REQUIRED_ROLE.LANDLORD);
    }

    static getCurrentUser() {
        try {
            const currentUser = localStorage.getItem('nestify_currentUser');
            return currentUser ? JSON.parse(currentUser) : null;
        } catch (error) {
            return null;
        }
    }
}
