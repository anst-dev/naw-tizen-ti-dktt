/**
 * Router.js - Simple router cho Single Page Application
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.beforeRouteChange = null;
        this.afterRouteChange = null;
    }

    /**
     * Đăng ký một route
     * @param {string} path - Route path
     * @param {Function} handler - Route handler
     */
    register(path, handler) {
        this.routes.set(path, handler);
        Config.log('debug', `Registered route: ${path}`);
    }

    /**
     * Navigate to route
     * @param {string} path - Route path
     * @param {Object} params - Route parameters
     */
    navigate(path, params = {}) {
        // Call before hook
        if (this.beforeRouteChange) {
            const canNavigate = this.beforeRouteChange(this.currentRoute, path, params);
            if (!canNavigate) {
                Config.log('info', `Navigation to ${path} cancelled`);
                return false;
            }
        }

        // Get route handler
        const handler = this.routes.get(path);
        if (!handler) {
            Config.log('error', `Route not found: ${path}`);
            return false;
        }

        // Add to history
        if (this.currentRoute) {
            this.history.push(this.currentRoute);
            if (this.history.length > 20) {
                this.history.shift();
            }
        }

        // Update current route
        const previousRoute = this.currentRoute;
        this.currentRoute = {
            path,
            params,
            timestamp: Date.now()
        };

        Config.log('info', `Navigating to: ${path}`, params);

        // Execute handler
        try {
            handler(params);
            
            // Call after hook
            if (this.afterRouteChange) {
                this.afterRouteChange(previousRoute, this.currentRoute);
            }

            // Dispatch navigation event
            window.dispatchEvent(new CustomEvent('routeChanged', {
                detail: {
                    from: previousRoute,
                    to: this.currentRoute
                }
            }));

            return true;
        } catch (error) {
            Config.log('error', `Error in route handler for ${path}:`, error);
            return false;
        }
    }

    /**
     * Go back to previous route
     */
    back() {
        if (this.history.length === 0) {
            Config.log('info', 'No history to go back');
            return false;
        }

        const previousRoute = this.history.pop();
        return this.navigate(previousRoute.path, previousRoute.params);
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Get history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Set before route change hook
     * @param {Function} hook - Hook function(from, to, params) => boolean
     */
    setBeforeRouteChange(hook) {
        this.beforeRouteChange = hook;
    }

    /**
     * Set after route change hook
     * @param {Function} hook - Hook function(from, to)
     */
    setAfterRouteChange(hook) {
        this.afterRouteChange = hook;
    }

    /**
     * Clear all routes
     */
    clear() {
        this.routes.clear();
        this.currentRoute = null;
        this.history = [];
        Config.log('info', 'Router cleared');
    }
}

// Export cho các module khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
} else {
    window.Router = Router;
}
