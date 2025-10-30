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
        this.routes = null; // New simplified routing system

        // Components
        this.mapFullscreen = null;
        this.dashboardGrid = null;
        
        // State
        this.isInitialized = false;
        this.currentView = 'loading';
        this.isMapViewLocked = false;
    }

    /**
     * Initialize application
     */
    async init() {
        try {
            Config.log('info', 'ðŸš€ Initializing Tizen Control Room Application');

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
            Config.log('info', 'âœ… Application initialized successfully');

        } catch (error) {
            Config.log('error', 'âŒ Failed to initialize application:', error);
            this.showError('KhÃ´ng thá»ƒ khá»Ÿi Ä‘á»™ng á»©ng dá»¥ng. Vui lÃ²ng thá»­ láº¡i.');
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

        // Router (keep for compatibility)
        this.router = new Router();
        
        // New simplified Routes system
        this.routes = new Routes();
        this.routes.init();
        
        // Setup protection against unwanted content injection
        this.setupWidgetProtection();
    }

    /**
     * Setup protection against unwanted content injection
     */
    setupWidgetProtection() {
        // Monitor for any changes to widget content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.target.classList && mutation.target.classList.contains('widget-content')) {
                    // If content contains suspicious text, clear it
                    const content = mutation.target.textContent || '';
                    if (content.includes('Opus') || content.includes('48gh') || content.includes('Claude')) {
                        mutation.target.innerHTML = '';
                        mutation.target.textContent = '';
                        Config.log('warn', 'Cleared unwanted widget content:', content);
                    }
                }
            });
        });

        // Start observing all widget contents
        setTimeout(() => {
            const widgets = document.querySelectorAll('.widget-content');
            widgets.forEach(widget => {
                observer.observe(widget, { 
                    childList: true, 
                    characterData: true,
                    subtree: true 
                });
            });
        }, 1000);
    }

    lockMapView() {
        this.isMapViewLocked = true;
        Config.log('debug', 'Map view locked by user request');
    }

    unlockMapView() {
        if (this.isMapViewLocked) {
            Config.log('debug', 'Map view lock cleared');
        }
        this.isMapViewLocked = false;
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
            this.showDetailView(params || {});
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
        console.log('ðŸ”„ === API UPDATE RECEIVED ===');
        console.log('ðŸ“Š Screens count:', screens.length);
        console.log('ðŸ“ Current view:', this.currentView);
        console.log('ðŸŽ¯ Screens data:', screens);

        // Add M0 (map screen) to the beginning if there are active screens
        if (screens.length > 0) {
            const m0Screen = {
                STT: 0,
                TenManHinh: "MÃ n hÃ¬nh Báº£n Ä‘á»“",
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
        const shouldSwitchToDashboard = screens.length > 0 && this.currentView === 'map' && !this.isMapViewLocked;
        console.log('â“ Should switch to dashboard?', shouldSwitchToDashboard);
        console.log('   - Has screens?', screens.length > 0);
        console.log('   - Is on map?', this.currentView === 'map');
        console.log('   - Map locked?', this.isMapViewLocked);

        // Auto switch view based on screens
        if (shouldSwitchToDashboard) {
            // Have active screens, switch to dashboard
            console.log('âœ… SWITCHING TO DASHBOARD VIEW...');
            this.unlockMapView();
            setTimeout(() => {
                console.log('ðŸš€ Navigating to dashboard now!');
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
                this.unlockMapView();
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
     * Handle open detail - Simplified version using Routes
     */
    handleOpenDetail(detail) {
        Config.log('info', 'Opening screen detail:', detail);

        const providedScreen = detail?.screen;
        const sttValue = Number(detail?.stt ?? providedScreen?.STT);

        // Kiểm tra xem màn hình có tồn tại trong Routes không
        if (this.routes.hasScreen(sttValue)) {
            // Sử dụng hệ thống Routes mới đơn giản
            this.routes.navigate(sttValue, { screen: providedScreen });
            this.currentView = 'detail';
        } else {
            // Fallback to old system for screens not in Routes
            let targetScreen = providedScreen;
            if (!targetScreen && !Number.isNaN(sttValue)) {
                targetScreen = this.screenManager.getActiveScreens()
                    .find(s => Number(s.STT) === sttValue);
            }

            if (!targetScreen) {
                Config.log('warn', 'No screen data found for detail view');
                return;
            }

            const isChiTietDiemChay = Number(targetScreen.STT) === 5;
            this.router.navigate('/detail', {
                screen: targetScreen,
                view: isChiTietDiemChay ? 'chiTietDiemChay' : 'defaultDetail'
            });
        }
    }

    /**
     * Handle navigate back - Simplified version
     */
    handleNavigateBack(detail) {
        Config.log('info', 'Navigate back:', detail);

        // Ưu tiên sử dụng Routes mới nếu đang trong detail view
        if (this.routes.getCurrentScreen()) {
            this.routes.back();
            this.unlockMapView();
            // Luôn quay về dashboard với hệ thống 2 cấp mới
            this.currentView = 'dashboard';
        } else {
            // Fallback to old system
            if (detail.to === 'dashboard') {
                this.unlockMapView();
                this.router.navigate('/dashboard', {
                    screens: this.screenManager.getActiveScreens()
                });
            } else if (detail.to === 'map') {
                this.lockMapView();
                this.router.navigate('/map');
            } else {
                this.router.back();
            }
        }
    }

    /**
     * Handle Tizen hardware keys - Simplified
     */
    handleTizenKey(event) {
        switch (event.keyName) {
            case 'back':
                // Kiểm tra nếu đang dùng Routes system
                if (this.routes.getCurrentScreen()) {
                    this.routes.back();
                } else if (this.currentView === 'detail') {
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

        // Hide detail container
        this.hideDetailView(true);
        
        // Show map container
        const mapContainer = document.getElementById('map-fullscreen-container');
        if (mapContainer) {
            mapContainer.style.display = 'block';
            // Force reflow for smooth transition
            mapContainer.offsetHeight;
            mapContainer.classList.add('active');
        }
        
        this.dashboardGrid.hide();
        this.mapFullscreen.show();
        this.navigationManager.currentView = 'map';
        this.currentView = 'map';
        Config.log('info', 'ðŸ“ Showing map view');
    }

    /**
     * Show dashboard view
     */
    showDashboardView(screens) {
        console.log('showDashboardView called with screens:', screens);
        this.unlockMapView();
        
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
        this.hideDetailView(true);
        
        // Ensure dashboard container is visible
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'block';
            // Force reflow for smooth transition
            dashboardContainer.offsetHeight;
            dashboardContainer.classList.add('active');
        }
        
        this.dashboardGrid.show();
        this.dashboardGrid.render(screens || []);
        this.navigationManager.currentView = 'dashboard';
        this.currentView = 'dashboard';
        Config.log('info', 'ðŸ“Š Showing dashboard view');
        console.log('Dashboard view should be visible now');
    }

    /**
     * Show detail view
     * @param {Object} params
     * @param {Object} params.screen
     * @param {string} params.view
     */
    showDetailView(params = {}) {
        const { screen = null, view = 'defaultDetail' } = params;
        Config.log('info', 'Showing detail view:', params);
        this.unlockMapView();

        this.hideLoading();
        this.mapFullscreen.hide();
        this.dashboardGrid.hide();

        const detailContainer = document.getElementById('detail-container');
        if (!detailContainer) {
            Config.log('error', 'Detail container not found');
            return;
        }

        // Clear all widget contents first
        const widgets = detailContainer.querySelectorAll('.widget-content');
        widgets.forEach(widget => {
            widget.innerHTML = '';
            widget.textContent = '';
        });

        detailContainer.style.display = 'block';
        // Force reflow for smooth transition
        detailContainer.offsetHeight;
        detailContainer.classList.add('active');

        const titleElement = detailContainer.querySelector('#detail-title');
        if (titleElement) {
            titleElement.textContent = screen?.TenManHinh || 'Chi tiet man hinh';
        }

        if (view === 'chiTietDiemChay' || Number(screen?.STT) === 5) {
            this.renderChiTietDiemChayView(detailContainer);
        } else {
            this.renderDefaultDetailView(detailContainer, screen);
        }

        this.navigationManager.currentView = 'detail';
        this.currentView = 'detail';
    }

    /**
     * Hide detail view
     * @param {boolean} immediate
     */
    hideDetailView(immediate = false) {
        const detailContainer = document.getElementById('detail-container');
        if (!detailContainer) {
            return;
        }

        const detailContent = detailContainer.querySelector('.detail-content');
        if (detailContent) {
            const customView = detailContent.querySelector('#chi-tiet-diem-chay-view');
            if (customView) {
                customView.style.display = 'none';
            }

            const widgetGrid = detailContent.querySelector('.widget-grid');
            if (widgetGrid) {
                // Clear all widget contents when hiding
                const widgets = widgetGrid.querySelectorAll('.widget-content');
                widgets.forEach(widget => {
                    widget.innerHTML = '';
                    widget.textContent = '';
                });
                widgetGrid.style.display = 'grid';
            }
        }

        detailContainer.classList.remove('active');
        if (immediate) {
            detailContainer.style.display = 'none';
            return;
        }

        const transition = Config?.LAYOUT?.TRANSITION_DURATION ?? 0;
        setTimeout(() => {
            detailContainer.style.display = 'none';
        }, transition);
    }

    /**
     * Render ChiTietDiemChay view
     * @param {HTMLElement} detailContainer
     */
    renderChiTietDiemChayView(detailContainer) {
        const detailContent = detailContainer.querySelector('.detail-content');
        if (!detailContent) {
            return;
        }

        const widgetGrid = detailContent.querySelector('.widget-grid');
        if (widgetGrid) {
            // Clear all widget contents before hiding
            const widgets = widgetGrid.querySelectorAll('.widget-content');
            widgets.forEach(widget => {
                widget.innerHTML = '';
                widget.textContent = '';
            });
            widgetGrid.style.display = 'none';
        }

        let customView = detailContent.querySelector('#chi-tiet-diem-chay-view');
        if (!customView) {
            customView = document.createElement('div');
            customView.id = 'chi-tiet-diem-chay-view';
            customView.className = 'detail-custom-view';
            detailContent.appendChild(customView);
        }

        customView.style.display = 'block';

        let iframe = customView.querySelector('iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.className = 'detail-iframe';
            iframe.title = 'Chi tiet diem chay';
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', 'true');
            customView.appendChild(iframe);
        }

        iframe.src = 'ChiTietDiemChay.html';
    }

    /**
     * Render default detail view
     * @param {HTMLElement} detailContainer
     * @param {Object} screen
     */
    renderDefaultDetailView(detailContainer, screen) {
        const detailContent = detailContainer.querySelector('.detail-content');
        if (!detailContent) {
            return;
        }

        const widgetGrid = detailContent.querySelector('.widget-grid');
        if (widgetGrid) {
            // Clear all widget contents before showing
            const widgets = widgetGrid.querySelectorAll('.widget-content');
            widgets.forEach(widget => {
                widget.innerHTML = '';
                widget.textContent = '';
            });
            widgetGrid.style.display = 'grid';
        }

        const customView = detailContent.querySelector('#chi-tiet-diem-chay-view');
        if (customView) {
            customView.style.display = 'none';
        }

        Config.log('debug', 'Rendering default detail view for screen:', screen);
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
        this.isMapViewLocked = false;
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

// Export cho cÃ¡c module khÃ¡c sá»­ dá»¥ng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.App = App;
}

