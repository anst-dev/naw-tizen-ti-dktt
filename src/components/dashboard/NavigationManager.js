/**
 * NavigationManager.js - Quản lý điều hướng bằng remote control
 */

class NavigationManager {
    constructor() {
        this.currentFocus = null;
        this.currentView = 'map'; // 'map', 'dashboard', 'detail'
        this.navigationMap = new Map();
        this.focusHistory = [];
        this.isNavigating = false;
        this.keyHandlers = new Map();
    }

    /**
     * Khởi tạo NavigationManager
     */
    init() {
        this.bindKeyEvents();
        this.setupKeyHandlers();
        Config.log('info', 'NavigationManager initialized');
    }

    /**
     * Setup các key handlers
     */
    setupKeyHandlers() {
        // Arrow keys
        this.keyHandlers.set('ArrowUp', () => this.navigate('up'));
        this.keyHandlers.set('ArrowDown', () => this.navigate('down'));
        this.keyHandlers.set('ArrowLeft', () => this.navigate('left'));
        this.keyHandlers.set('ArrowRight', () => this.navigate('right'));
        
        // Enter/OK key
        this.keyHandlers.set('Enter', () => this.handleEnter());
        
        // Back key
        this.keyHandlers.set('Escape', () => this.handleBack());
        this.keyHandlers.set('10009', () => this.handleBack()); // Tizen Back key
        
        // Number keys for quick navigation (including 0 for M0)
        for (let i = 0; i <= 9; i++) {
            this.keyHandlers.set(String(i), () => this.quickNavigate(i));
        }
    }

    /**
     * Bind keyboard events
     */
    bindKeyEvents() {
        document.addEventListener('keydown', (e) => {
            // Prevent default cho navigation keys
            if (Config.NAVIGATION.KEYS.UP.includes(e.key) ||
                Config.NAVIGATION.KEYS.DOWN.includes(e.key) ||
                Config.NAVIGATION.KEYS.LEFT.includes(e.key) ||
                Config.NAVIGATION.KEYS.RIGHT.includes(e.key) ||
                Config.NAVIGATION.KEYS.ENTER.includes(e.key) ||
                Config.NAVIGATION.KEYS.BACK.includes(e.key)) {
                e.preventDefault();
            }

            // Handle navigation
            this.handleKeyPress(e.key, e.keyCode);
        });

        // Listen for view changes
        window.addEventListener('viewChange', (e) => {
            this.currentView = e.detail.view;
            this.resetNavigation();
            Config.log('debug', `View changed to: ${this.currentView}`);
        });
    }

    /**
     * Handle key press
     */
    handleKeyPress(key, keyCode) {
        if (this.isNavigating) return;

        // Check if we have a handler for this key
        const handler = this.keyHandlers.get(key) || this.keyHandlers.get(String(keyCode));
        
        if (handler) {
            this.isNavigating = true;
            handler();
            
            // Reset navigation flag after delay
            setTimeout(() => {
                this.isNavigating = false;
            }, Config.NAVIGATION.FOCUS_DELAY);
        }
    }

    /**
     * Navigate theo hướng
     * @param {string} direction - 'up', 'down', 'left', 'right'
     */
    navigate(direction) {
        Config.log('debug', `Navigating ${direction} in ${this.currentView} view`);

        switch (this.currentView) {
            case 'map':
                this.navigateInMap(direction);
                break;
            case 'dashboard':
                this.navigateInDashboard(direction);
                break;
            case 'detail':
                this.navigateInDetail(direction);
                break;
        }
    }

    /**
     * Navigate trong map view
     */
    navigateInMap(direction) {
        // Trong map view, có thể pan bản đồ
        const map = window.mapFullscreen?.getMap();
        if (!map) return;

        const view = map.getView();
        const center = view.getCenter();
        const resolution = view.getResolution();
        const panDistance = resolution * 100; // Pan 100 pixels

        let newCenter = [...center];

        switch (direction) {
            case 'up':
                newCenter[1] += panDistance;
                break;
            case 'down':
                newCenter[1] -= panDistance;
                break;
            case 'left':
                newCenter[0] -= panDistance;
                break;
            case 'right':
                newCenter[0] += panDistance;
                break;
        }

        view.animate({
            center: newCenter,
            duration: Config.NAVIGATION.ANIMATION_DURATION
        });
    }

    /**
     * Navigate trong dashboard view
     */
    navigateInDashboard(direction) {
        const currentElement = document.activeElement;
        
        // Nếu chưa có focus, focus vào màn hình đầu tiên
        if (!currentElement || !currentElement.classList.contains('screen-tile')) {
            const firstScreen = document.querySelector('.screen-tile');
            if (firstScreen) {
                firstScreen.focus();
                this.currentFocus = firstScreen;
            }
            return;
        }

        // Get navigation index
        const navAttr = `data-nav-${direction}`;
        const targetIndex = currentElement.getAttribute(navAttr);
        
        if (targetIndex && targetIndex !== '-1') {
            const targetElement = document.querySelector(`.screen-tile[data-index="${targetIndex}"]`);
            if (targetElement) {
                this.moveFocus(targetElement);
            }
        }
    }

    /**
     * Navigate trong detail view
     */
    navigateInDetail(direction) {
        const widgets = document.querySelectorAll('.detail-widget');
        if (!widgets.length) return;

        const currentIndex = Array.from(widgets).findIndex(w => w === document.activeElement);
        let newIndex = currentIndex;

        // Widget layout: 2x2
        const row = Math.floor(currentIndex / 2);
        const col = currentIndex % 2;

        switch (direction) {
            case 'up':
                if (row > 0) newIndex = currentIndex - 2;
                break;
            case 'down':
                if (row < 1) newIndex = currentIndex + 2;
                break;
            case 'left':
                if (col > 0) newIndex = currentIndex - 1;
                break;
            case 'right':
                if (col < 1) newIndex = currentIndex + 1;
                break;
        }

        if (newIndex >= 0 && newIndex < widgets.length && newIndex !== currentIndex) {
            this.moveFocus(widgets[newIndex]);
        }
    }

    /**
     * Move focus to element
     */
    moveFocus(element) {
        if (!element) return;

        // Remove old focus
        if (this.currentFocus) {
            this.currentFocus.classList.remove('focused');
        }

        // Add new focus
        element.focus();
        element.classList.add('focused');
        this.currentFocus = element;

        // Scroll into view
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });

        // Add to history
        this.focusHistory.push(element);
        if (this.focusHistory.length > 10) {
            this.focusHistory.shift();
        }

        Config.log('debug', `Focus moved to element:`, element);
    }

    /**
     * Handle Enter key
     */
    handleEnter() {
        Config.log('debug', `Enter pressed in ${this.currentView} view`);

        switch (this.currentView) {
            case 'map':
                // Trong map view, Enter có thể zoom in
                const map = window.mapFullscreen?.getMap();
                if (map) {
                    const view = map.getView();
                    view.animate({
                        zoom: view.getZoom() + 1,
                        duration: Config.NAVIGATION.ANIMATION_DURATION
                    });
                }
                break;
                
            case 'dashboard':
                // Trong dashboard, Enter mở chi tiết màn hình
                const focusedScreen = document.activeElement;
                if (focusedScreen && focusedScreen.classList.contains('screen-tile')) {
                    const stt = focusedScreen.getAttribute('data-stt');
                    if (stt) {
                        const screenNumber = parseInt(stt);
                        
                        // M0 (screen 0) - navigate to map view
                        if (screenNumber === 0) {
                            Config.log('info', 'M0 selected - navigating to map view');
                            window.app.router.navigate('/map');
                        } else {
                            // Other screens - open detail view
                            window.dispatchEvent(new CustomEvent('openScreenDetail', {
                                detail: { stt: screenNumber }
                            }));
                        }
                    }
                }
                break;
                
            case 'detail':
                // Trong detail, Enter có thể kích hoạt widget
                const focusedWidget = document.activeElement;
                if (focusedWidget && focusedWidget.classList.contains('detail-widget')) {
                    focusedWidget.click();
                }
                break;
        }
    }

    /**
     * Handle Back key
     */
    handleBack() {
        Config.log('debug', `Back pressed in ${this.currentView} view`);

        switch (this.currentView) {
            case 'detail':
                // Quay lại dashboard
                window.dispatchEvent(new CustomEvent('navigateBack', {
                    detail: { from: 'detail', to: 'dashboard' }
                }));
                break;
                
            case 'dashboard':
                // Check if M0 screen is active - if yes, navigate to map
                const hasM0 = document.querySelector('.screen-tile[data-stt="0"]');
                if (hasM0) {
                    Config.log('info', 'M0 active - navigating to map view on back');
                    window.app.router.navigate('/map');
                } else {
                    // Normal back navigation
                    window.dispatchEvent(new CustomEvent('navigateBack', {
                        detail: { from: 'dashboard', to: 'map' }
                    }));
                }
                break;
                
            case 'map':
                // Exit app hoặc không làm gì
                if (Config.isTizen()) {
                    try {
                        window.tizen.application.getCurrentApplication().exit();
                    } catch (e) {
                        Config.log('error', 'Failed to exit app:', e);
                    }
                }
                break;
        }
    }

    /**
     * Quick navigate to screen by number
     */
    quickNavigate(number) {
        if (this.currentView !== 'dashboard') return;

        const targetScreen = document.querySelector(`.screen-tile[data-stt="${number}"]`);
        if (targetScreen) {
            this.moveFocus(targetScreen);
            Config.log('info', `Quick navigated to screen ${number}`);
            
            // If it's M0, automatically navigate to map
            if (number === 0) {
                setTimeout(() => {
                    this.handleEnter(); // Trigger enter to open map
                }, 100);
            }
        }
    }

    /**
     * Reset navigation state
     */
    resetNavigation() {
        this.currentFocus = null;
        this.focusHistory = [];
        this.navigationMap.clear();
        
        // Remove all focused classes
        document.querySelectorAll('.focused').forEach(el => {
            el.classList.remove('focused');
        });
    }

    /**
     * Build navigation map cho current view
     */
    buildNavigationMap() {
        this.navigationMap.clear();

        switch (this.currentView) {
            case 'dashboard':
                // Build map cho dashboard screens
                const screens = document.querySelectorAll('.screen-tile');
                screens.forEach((screen, index) => {
                    const navData = {
                        element: screen,
                        index: index,
                        up: parseInt(screen.getAttribute('data-nav-up')),
                        down: parseInt(screen.getAttribute('data-nav-down')),
                        left: parseInt(screen.getAttribute('data-nav-left')),
                        right: parseInt(screen.getAttribute('data-nav-right'))
                    };
                    this.navigationMap.set(index, navData);
                });
                break;
                
            case 'detail':
                // Build map cho widgets
                const widgets = document.querySelectorAll('.detail-widget');
                widgets.forEach((widget, index) => {
                    this.navigationMap.set(index, {
                        element: widget,
                        index: index
                    });
                });
                break;
        }

        Config.log('debug', `Built navigation map for ${this.currentView} with ${this.navigationMap.size} elements`);
    }

    /**
     * Get current focused element info
     */
    getCurrentFocusInfo() {
        return {
            element: this.currentFocus,
            view: this.currentView,
            history: this.focusHistory
        };
    }

    /**
     * Destroy navigation manager
     */
    destroy() {
        this.resetNavigation();
        document.removeEventListener('keydown', this.handleKeyPress);
        Config.log('info', 'NavigationManager destroyed');
    }
}

// Export cho các module khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
} else {
    window.NavigationManager = NavigationManager;
}
