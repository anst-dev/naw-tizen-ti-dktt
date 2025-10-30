/**
 * App.js - Main application entry point
 */

class App {
    constructor() {
        // Services
        this.apiService = null;
        this.screenManager = null;
        this.navigationManager = null;
        this.router = null;

        // Components
        this.mapFullscreen = null;
        this.dashboardGrid = null;
        
        // State
        this.isInitialized = false;
        this.currentView = 'loading';
    }

    /**
     * Initialize application
     */
    async init() {
        try {
            Config.log('info', '🚀 Initializing Tizen Control Room Application');

            // Show loading
            this.showLoading();

            // Initialize services
            await this.initServices();

            // Initialize components
            await this.initComponents();

            // Setup routes
            this.setupRoutes();

            // Bind events
            this.bindEvents();

            // Start application
            await this.start();

            this.isInitialized = true;
            Config.log('info', '✅ Application initialized successfully');

        } catch (error) {
            Config.log('error', '❌ Failed to initialize application:', error);
            this.showError('Không thể khởi động ứng dụng. Vui lòng thử lại.');
        }
    }

    /**
     * Initialize services
     */
    async initServices() {
        Config.log('info', 'Initializing services...');

        // API Service
        this.apiService = new ApiService();

        // Screen Manager
        this.screenManager = new ScreenManager();
        this.screenManager.init();

        // Navigation Manager
        this.navigationManager = new NavigationManager();
        this.navigationManager.init();

        // Router
        this.router = new Router();
    }

    /**
     * Initialize components
     */
    async initComponents() {
        Config.log('info', 'Initializing components...');

        // Map Fullscreen Component
        this.mapFullscreen = new MapFullscreen();
        this.mapFullscreen.init();

        // Dashboard Grid Component
        this.dashboardGrid = new DashboardGrid();
        this.dashboardGrid.init();
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        // Map route (fullscreen map)
        this.router.register('/map', () => {
            this.showMapView();
        });

        // Dashboard route
        this.router.register('/dashboard', (params) => {
            this.showDashboardView(params.screens);
        });

        // Detail route
        this.router.register('/detail', (params) => {
            this.showDetailView(params.screen);
        });

        // Set route change hooks
        this.router.setBeforeRouteChange((from, to, params) => {
            Config.log('debug', `Route changing from ${from?.path} to ${to}`);
            return true;
        });

        this.router.setAfterRouteChange((from, to) => {
            this.currentView = to.path.replace('/', '');
        });
    }

    /**
     * Bind application events
     */
    bindEvents() {
        // API data updates
        this.apiService.onDataUpdate((screens) => {
            this.handleAPIUpdate(screens);
        });

        // View change events
        window.addEventListener('viewChange', (e) => {
            this.handleViewChange(e.detail);
        });

        // Open detail event
        window.addEventListener('openScreenDetail', (e) => {
            this.handleOpenDetail(e.detail);
        });

        // Navigate back event
        window.addEventListener('navigateBack', (e) => {
            this.handleNavigateBack(e.detail);
        });

        // Handle Tizen hardware keys
        if (Config.isTizen()) {
            document.addEventListener('tizenhwkey', (e) => {
                this.handleTizenKey(e);
            });
        }
    }

    /**
     * Start application
     */
    async start() {
        Config.log('info', 'Starting application...');

        // Step 1: Show map fullscreen immediately
        this.router.navigate('/map');

        // Step 2: Start API polling after delay
        setTimeout(() => {
            this.apiService.startPolling(Config.API.POLLING_INTERVAL);
        }, 2000);
        
        // For testing: check URL hash
        if (window.location.hash === '#dashboard') {
            setTimeout(() => {
                // Force show dashboard with mock data
                const mockScreens = [
                    {STT: 0, TenManHinh: "M0: Màn hình Bản đồ", isActive: true, LoaiManHinh: "map"},
                    {STT: 4, TenManHinh: "M4: Màn hình bản đồ đường ống", isActive: true},
                    {STT: 5, TenManHinh: "M5: Màn hình thông tin điểm chảy", isActive: true},
                    {STT: 6, TenManHinh: "M6: Màn hình lắp đặt mới", isActive: true},
                    {STT: 8, TenManHinh: "M8: Màn hình chỉ số đồng hồ", isActive: true},
                    {STT: 9, TenManHinh: "M9: Màn hình công nợ", isActive: true}
                ];
                this.handleAPIUpdate(mockScreens);
            }, 1500);
        }
    }

    /**
     * Handle API update
     */
    handleAPIUpdate(screens) {
        Config.log('info', `API Update: ${screens.length} active screens`);
        console.log('🔄 === API UPDATE RECEIVED ===');
        console.log('📊 Screens count:', screens.length);
        console.log('📍 Current view:', this.currentView);
        console.log('🎯 Screens data:', screens);

        // Add M0 (map screen) to the beginning if there are active screens
        if (screens.length > 0) {
            const m0Screen = {
                STT: 0,
                TenManHinh: "Màn hình Bản đồ",
                isActive: true,
                MaManHinh: "M0",
                LoaiManHinh: "map",
                Data: {},
                Layout: null,
                Theme: null
            };
            
            // Check if M0 already exists
            const hasM0 = screens.some(s => s.STT === 0);
            if (!hasM0) {
                screens.unshift(m0Screen); // Add M0 to the beginning
                Config.log('info', 'Added M0 (map screen) to active screens');
            }
        }

        // Update screen manager
        this.screenManager.updateActiveScreens(screens);

        // Decision logic
        const shouldSwitchToDashboard = screens.length > 0 && this.currentView === 'map';
        console.log('❓ Should switch to dashboard?', shouldSwitchToDashboard);
        console.log('   - Has screens?', screens.length > 0);
        console.log('   - Is on map?', this.currentView === 'map');

        // Auto switch view based on screens
        if (shouldSwitchToDashboard) {
            // Have active screens, switch to dashboard
            console.log('✅ SWITCHING TO DASHBOARD VIEW...');
            setTimeout(() => {
                console.log('🚀 Navigating to dashboard now!');
                this.router.navigate('/dashboard', { screens });
            }, Config.LAYOUT.TRANSITION_DURATION);
        } else if (screens.length === 0 && this.currentView === 'dashboard') {
            // No active screens, switch back to map
            this.router.navigate('/map');
        } else if (this.currentView === 'dashboard') {
            // Update dashboard with new screens
            console.log('Updating dashboard with new screens...');
            this.dashboardGrid.render(screens);
        }
    }

    /**
     * Handle view change
     */
    handleViewChange(detail) {
        const { view } = detail;
        Config.log('info', `View change requested: ${view}`);

        switch (view) {
            case 'map':
                this.router.navigate('/map');
                break;
            case 'dashboard':
                this.router.navigate('/dashboard', { 
                    screens: detail.screens || this.screenManager.getActiveScreens() 
                });
                break;
            case 'detail':
                if (detail.screen) {
                    this.router.navigate('/detail', { screen: detail.screen });
                }
                break;
        }
    }

    /**
     * Handle open detail
     */
    handleOpenDetail(detail) {
        Config.log('info', 'Opening screen detail:', detail);

        if (detail.screen) {
            this.router.navigate('/detail', { screen: detail.screen });
        } else if (detail.stt) {
            // Find screen by STT
            const screen = this.screenManager.getActiveScreens()
                .find(s => s.STT === detail.stt);
            if (screen) {
                this.router.navigate('/detail', { screen });
            }
        }
    }

    /**
     * Handle navigate back
     */
    handleNavigateBack(detail) {
        Config.log('info', 'Navigate back:', detail);

        if (detail.to === 'dashboard') {
            this.router.navigate('/dashboard', {
                screens: this.screenManager.getActiveScreens()
            });
        } else if (detail.to === 'map') {
            this.router.navigate('/map');
        } else {
            this.router.back();
        }
    }

    /**
     * Handle Tizen hardware keys
     */
    handleTizenKey(event) {
        switch (event.keyName) {
            case 'back':
                if (this.currentView === 'detail') {
                    this.handleNavigateBack({ to: 'dashboard' });
                } else if (this.currentView === 'dashboard') {
                    this.handleNavigateBack({ to: 'map' });
                } else {
                    // Exit app
                    try {
                        window.tizen.application.getCurrentApplication().exit();
                    } catch (e) {
                        Config.log('error', 'Failed to exit app:', e);
                    }
                }
                break;
            case 'menu':
                Config.log('info', 'Menu key pressed');
                // Handle menu key if needed
                break;
        }
    }

    /**
     * Show map view
     */
    showMapView() {
        this.hideLoading();
        
        // Hide dashboard container
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
            dashboardContainer.classList.remove('active');
        }
        
        // Show map container
        const mapContainer = document.getElementById('map-fullscreen-container');
        if (mapContainer) {
            mapContainer.style.display = 'block';
            mapContainer.classList.add('active');
        }
        
        this.dashboardGrid.hide();
        this.mapFullscreen.show();
        this.navigationManager.currentView = 'map';
        this.currentView = 'map';
        Config.log('info', '📍 Showing map view');
    }

    /**
     * Show dashboard view
     */
    showDashboardView(screens) {
        console.log('showDashboardView called with screens:', screens);
        
        // Don't redirect to map if M0 is with other screens
        // Only redirect if ONLY M0 exists and no other screens
        const nonM0Screens = screens ? screens.filter(s => s.STT !== 0) : [];
        if (screens && screens.length === 1 && screens[0].STT === 0 && nonM0Screens.length === 0) {
            Config.log('info', 'Only M0 active - showing map view instead of dashboard');
            this.showMapView();
            return;
        }
        
        this.hideLoading();
        this.mapFullscreen.hide();
        
        // Ensure dashboard container is visible
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'block';
            dashboardContainer.classList.add('active');
        }
        
        this.dashboardGrid.show();
        this.dashboardGrid.render(screens || []);
        this.navigationManager.currentView = 'dashboard';
        this.currentView = 'dashboard';
        Config.log('info', '📊 Showing dashboard view');
        console.log('Dashboard view should be visible now');
    }

    /**
     * Show detail view
     */
    showDetailView(screen) {
        // TODO: Implement detail view
        Config.log('info', '📋 Showing detail view for screen:', screen);
        this.navigationManager.currentView = 'detail';
        this.currentView = 'detail';
    }

    /**
     * Show loading screen
     */
    showLoading() {
        const loadingEl = document.getElementById('app-loading');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingEl = document.getElementById('app-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = document.getElementById('app-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Destroy application
     */
    destroy() {
        Config.log('info', 'Destroying application...');

        // Stop services
        this.apiService?.stopPolling();
        this.apiService?.reset();

        // Destroy components
        this.mapFullscreen?.destroy();
        this.dashboardGrid?.destroy();

        // Reset managers
        this.screenManager?.reset();
        this.navigationManager?.destroy();
        
        // Clear router
        this.router?.clear();

        this.isInitialized = false;
        Config.log('info', 'Application destroyed');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new App();
    
    // Initialize application
    window.app.init().catch(error => {
        console.error('Failed to initialize app:', error);
    });
});

// Export cho các module khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.App = App;
}
