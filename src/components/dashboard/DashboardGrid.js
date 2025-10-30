/**
 * DashboardGrid.js - Component hiển thị grid dashboard với layout động
 */

class DashboardGrid {
    constructor(containerId = 'dashboard-container') {
        this.containerId = containerId;
        this.container = null;
        this.screens = [];
        this.currentLayout = null;
        this.screenElements = new Map();
    }

    /**
     * Khởi tạo component
     */
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            Config.log('error', `Container ${this.containerId} not found`);
            return false;
        }

        this.setupContainer();
        this.bindEvents();
        
        Config.log('info', 'DashboardGrid component initialized');
        return true;
    }

    /**
     * Setup container HTML cơ bản
     */
    setupContainer() {
        this.container.innerHTML = `
            <div class="dashboard-wrapper">
                <div class="dashboard-header">
                    <h1 class="dashboard-title">Bảng điều khiển</h1>
                    <div class="dashboard-info">
                        <span class="active-count">0</span> màn hình hoạt động
                    </div>
                </div>
                <div id="dashboard-grid" class="dashboard-grid"></div>
            </div>
        `;
    }

    /**
     * Render dashboard với danh sách màn hình active
     * @param {Array} activeScreens - Danh sách màn hình active từ API
     */
    render(activeScreens) {
        // Sort screens, ensuring M0 comes first
        this.screens = activeScreens.sort((a, b) => {
            // M0 always comes first
            if (a.STT === 0) return -1;
            if (b.STT === 0) return 1;
            // Then sort by STT
            return a.STT - b.STT;
        });
        
        // Tính toán layout
        this.currentLayout = this.calculateLayout(this.screens.length);
        
        // Render grid
        this.renderGrid();
        
        // Update info
        this.updateInfo();
        
        Config.log('info', `Rendered dashboard with ${this.screens.length} screens`);
    }

    /**
     * Tính toán layout dựa trên số màn hình
     */
    calculateLayout(screenCount) {
        let columns, rows, flexBasis;
        
        if (screenCount === 0) {
            return null;
        }

        // Tính số cột và hàng tối ưu để lấp đầy màn hình
        if (screenCount === 1) {
            columns = 1;
            rows = 1;
            flexBasis = '100%';
        } else if (screenCount === 2) {
            columns = 2;
            rows = 1;
            flexBasis = '50%';
        } else if (screenCount === 3) {
            columns = 3;
            rows = 1;
            flexBasis = '33.33%';
        } else if (screenCount === 4) {
            columns = 2;
            rows = 2;
            flexBasis = '50%';
        } else if (screenCount === 5 || screenCount === 6) {
            columns = 3;
            rows = 2;
            flexBasis = '33.33%';
        } else if (screenCount >= 7 && screenCount <= 9) {
            columns = 3;
            rows = 3;
            flexBasis = '33.33%';
        } else if (screenCount >= 10 && screenCount <= 12) {
            columns = 4;
            rows = 3;
            flexBasis = '25%';
        } else {
            // Nhiều hơn 12 màn hình
            columns = 4;
            rows = Math.ceil(screenCount / 4);
            flexBasis = '25%';
        }

        // Điều chỉnh flex-grow để lấp đầy màn hình
        const totalCells = columns * rows;
        const emptyCells = totalCells - screenCount;
        let flexGrow = 1;
        
        if (emptyCells > 0 && screenCount < columns) {
            // Có ô trống và ít hơn 1 hàng đầy
            flexGrow = columns / screenCount;
        }

        return {
            columns,
            rows,
            flexBasis,
            flexGrow,
            screenCount,
            totalCells,
            emptyCells
        };
    }

    /**
     * Render grid với layout đã tính toán
     */
    renderGrid() {
        const gridElement = document.getElementById('dashboard-grid');
        if (!gridElement) return;

        // Clear existing elements
        gridElement.innerHTML = '';
        this.screenElements.clear();

        // Không có màn hình nào
        if (!this.currentLayout) {
            gridElement.innerHTML = '<div class="no-screens">Không có màn hình nào được kích hoạt</div>';
            return;
        }

        // Set CSS variables cho grid
        gridElement.style.setProperty('--grid-columns', this.currentLayout.columns);
        gridElement.style.setProperty('--grid-rows', this.currentLayout.rows);
        gridElement.setAttribute('data-active', this.screens.length);

        // Render từng màn hình
        this.screens.forEach((screen, index) => {
            const screenElement = this.createScreenElement(screen, index);
            gridElement.appendChild(screenElement);
            this.screenElements.set(screen.STT, screenElement);
        });

        // Apply flex styles
        this.applyFlexLayout();
    }

    /**
     * Tạo element cho một màn hình
     */
    createScreenElement(screen, index) {
        const div = document.createElement('div');
        div.className = 'screen-tile';
        
        // Add special class for M0 (map screen)
        if (screen.STT === 0) {
            div.className += ' map-screen';
        }
        
        div.id = `screen-tile-${screen.STT}`;
        div.setAttribute('data-stt', screen.STT);
        div.setAttribute('data-index', index);
        div.setAttribute('tabindex', '0');
        
        // Navigation attributes cho điều khiển
        this.setNavigationAttributes(div, index);

        // Special content for M0
        if (screen.STT === 0) {
            div.innerHTML = `
                <div class="screen-tile-header">
                    <span class="screen-number">M${screen.STT}</span>
                    <h3 class="screen-name">Màn hình Bản đồ</h3>
                    <span class="screen-status active">●</span>
                </div>
                <div class="screen-tile-content">
                    <div class="map-icon-container">
                        <div class="map-icon">🗺️</div>
                        <p class="map-description">Nhấn để xem bản đồ</p>
                    </div>
                </div>
                <button class="action-btn">Chi tiết →</button>
            `;
        } else {
            div.innerHTML = `
                <div class="screen-tile-header">
                    <span class="screen-number">M${screen.STT}</span>
                    <h3 class="screen-name">${screen.TenManHinh || 'Màn hình ' + screen.STT}</h3>
                    <span class="screen-status active">●</span>
                </div>
                <div class="screen-tile-content">
                    <div class="screen-widgets">
                        <div class="widget-placeholder top-left">
                            <div class="widget-icon">📊</div>
                            <span>Widget 1</span>
                        </div>
                        <div class="widget-placeholder top-right">
                            <div class="widget-icon">📈</div>
                            <span>Widget 2</span>
                        </div>
                        <div class="widget-placeholder bottom-left">
                            <div class="widget-icon">⚠️</div>
                            <span>Widget 3</span>
                        </div>
                        <div class="widget-placeholder bottom-right">
                            <div class="widget-icon">ℹ️</div>
                            <span>Widget 4</span>
                        </div>
                    </div>
                </div>
                <div class="screen-tile-footer">
                    <button class="screen-action-btn" onclick="DashboardGrid.openDetail(${screen.STT})">
                        Chi tiết →
                    </button>
                </div>
            `;
        }

        // Add event listeners
        div.addEventListener('click', () => this.handleScreenClick(screen));
        div.addEventListener('keydown', (e) => this.handleScreenKeydown(e, screen, index));

        return div;
    }

    /**
     * Set navigation attributes cho điều khiển remote
     */
    setNavigationAttributes(element, index) {
        if (!this.currentLayout) return;

        const { columns, rows } = this.currentLayout;
        const row = Math.floor(index / columns);
        const col = index % columns;

        // Calculate neighbors
        const up = row > 0 ? index - columns : -1;
        const down = row < rows - 1 && index + columns < this.screens.length ? index + columns : -1;
        const left = col > 0 ? index - 1 : -1;
        const right = col < columns - 1 && index + 1 < this.screens.length ? index + 1 : -1;

        // Set navigation data
        element.setAttribute('data-nav-up', up);
        element.setAttribute('data-nav-down', down);
        element.setAttribute('data-nav-left', left);
        element.setAttribute('data-nav-right', right);
        element.setAttribute('data-row', row);
        element.setAttribute('data-col', col);
    }

    /**
     * Apply flex layout styles
     */
    applyFlexLayout() {
        if (!this.currentLayout) return;

        const gridElement = document.getElementById('dashboard-grid');
        const { flexBasis, flexGrow } = this.currentLayout;

        // Apply flex styles to grid
        gridElement.style.display = 'flex';
        gridElement.style.flexWrap = 'wrap';
        gridElement.style.width = '100%';
        gridElement.style.height = '100%';

        // Apply styles to each screen tile
        this.screenElements.forEach((element) => {
            element.style.flexBasis = flexBasis;
            element.style.flexGrow = flexGrow;
            element.style.maxWidth = flexBasis;
        });
    }

    /**
     * Handle screen click
     */
    handleScreenClick(screen) {
        Config.log('info', `Screen ${screen.STT} clicked: ${screen.TenManHinh}`);
        
        // M0 (screen 0) - navigate to map view
        if (screen.STT === 0) {
            Config.log('info', 'M0 clicked - navigating to map view');
            if (window.app && window.app.router) {
                window.app.router.navigate('/map');
            }
        } else {
            // Other screens - open detail view
            this.openDetailView(screen);
        }
    }

    /**
     * Handle keydown on screen
     */
    handleScreenKeydown(event, screen, index) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.openDetailView(screen);
        }
    }

    /**
     * Open detail view cho màn hình
     */
    openDetailView(screen) {
        window.dispatchEvent(new CustomEvent('openScreenDetail', {
            detail: { screen }
        }));
    }

    /**
     * Static method để mở chi tiết (dùng cho onclick)
     */
    static openDetail(stt) {
        window.dispatchEvent(new CustomEvent('openScreenDetail', {
            detail: { stt }
        }));
    }

    /**
     * Update thông tin dashboard
     */
    updateInfo() {
        const countElement = this.container.querySelector('.active-count');
        if (countElement) {
            countElement.textContent = this.screens.length;
        }
    }

    /**
     * Focus vào một màn hình
     */
    focusScreen(index) {
        const screens = this.container.querySelectorAll('.screen-tile');
        if (screens[index]) {
            screens[index].focus();
            screens[index].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    /**
     * Navigate theo hướng
     */
    navigate(direction, currentIndex) {
        const currentElement = this.container.querySelectorAll('.screen-tile')[currentIndex];
        if (!currentElement) return;

        const navIndex = currentElement.getAttribute(`data-nav-${direction}`);
        if (navIndex && navIndex !== '-1') {
            this.focusScreen(parseInt(navIndex));
        }
    }

    /**
     * Bind global events
     */
    bindEvents() {
        // Listen for screen updates
        window.addEventListener('screensUpdate', (e) => {
            if (e.detail && e.detail.screens) {
                this.render(e.detail.screens);
            }
        });
    }

    /**
     * Show dashboard
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.container.classList.add('active');
            Config.log('info', 'Dashboard shown');
        }
    }

    /**
     * Hide dashboard
     */
    hide() {
        if (this.container) {
            this.container.classList.remove('active');
            setTimeout(() => {
                this.container.style.display = 'none';
            }, Config.LAYOUT.TRANSITION_DURATION);
            Config.log('info', 'Dashboard hidden');
        }
    }

    /**
     * Get screen element by STT
     */
    getScreenElement(stt) {
        return this.screenElements.get(stt);
    }

    /**
     * Destroy component
     */
    destroy() {
        this.screenElements.clear();
        if (this.container) {
            this.container.innerHTML = '';
        }
        Config.log('info', 'DashboardGrid component destroyed');
    }
}

// Export cho các module khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardGrid;
} else {
    window.DashboardGrid = DashboardGrid;
}
