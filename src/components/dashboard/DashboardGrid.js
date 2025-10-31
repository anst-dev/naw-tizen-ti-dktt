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
            return false;
        }

        this.setupContainer();
        this.bindEvents();

        return true;
    }

    /**
     * Setup container HTML cơ bản
     */
    setupContainer() {
        this.container.innerHTML = `
            <div class="dashboard-wrapper">
                <div id="dashboard-grid" class="dashboard-grid">LOADDING</div>
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
    }

    /**
     * Tính toán layout dựa trên số màn hình
     */
    calculateLayout(screenCount) {
        if (screenCount === 0) {
            return null;
        }

        const GRID_GAP_REM = 0.5;

        let columns = 1;
        let rows = 1;
        let layoutMode = 'flex';
        let flexGrow = 1;

        // Tính số cột và hàng tối ưu để lấp đầy màn hình
        if (screenCount === 1) {
            columns = 1;
            rows = 1;
        } else if (screenCount === 2) {
            columns = 2;
            rows = 1;
        } else if (screenCount === 3) {
            columns = 3;
            rows = 1;
        } else if (screenCount === 4) {
            columns = 2;
            rows = 2;
        } else if (screenCount === 5 || screenCount === 6) {
            columns = 3;
            rows = 2;
        } else if (screenCount === 7) {
            columns = 4;
            rows = 2;
            layoutMode = 'grid-4-2-last3';
        } else if (screenCount === 8) {
            columns = 4;
            rows = 2;
            layoutMode = 'grid-4-2';
        } else if (screenCount === 9) {
            columns = 3;
            rows = 3;
        } else if (screenCount === 10) {
            columns = 4;
            rows = 3;
            layoutMode = 'grid-4-4-2';
        } else if (screenCount === 11) {
            columns = 4;
            rows = 3;
            layoutMode = 'grid-4-4-3';
        } else if (screenCount === 12) {
            columns = 4;
            rows = 3;
            layoutMode = 'grid-4-3';
        } else {
            // Nhiều hơn 12 màn hình
            columns = 4;
            rows = Math.ceil(screenCount / 4);
        }

        const totalCells = columns * rows;
        const emptyCells = totalCells - screenCount;

        if (layoutMode === 'flex' && emptyCells > 0 && screenCount < columns) {
            // Có ô trống và ít hơn 1 hàng đầy
            flexGrow = columns / screenCount;
        }

        let flexBasis = null;
        let cellHeight = null;
        let gridTemplateColumns = null;
        let gridTemplateRows = null;
        let justifyContent = 'flex-start';
        let layoutClass = '';

        if (layoutMode === 'flex') {
            const widthPercent = (100 / columns).toFixed(4);
            const heightPercent = rows > 0 ? (100 / rows).toFixed(4) : '100.0000';
            const horizontalAdjustment = columns > 1 ? ((columns - 1) / columns * GRID_GAP_REM).toFixed(4) : '0';
            const verticalAdjustment = rows > 1 ? ((rows - 1) / rows * GRID_GAP_REM).toFixed(4) : '0';

            flexBasis = columns === 1
                ? '100%'
                : `calc(${widthPercent}% - ${horizontalAdjustment}rem)`;

            cellHeight = rows === 1
                ? '100%'
                : `calc(${heightPercent}% - ${verticalAdjustment}rem)`;

            const itemsOnLastRow = screenCount % columns || columns;
            const hasPartialLastRow = itemsOnLastRow !== columns;
            if (screenCount === 1) {
                justifyContent = 'center';
            } else if (hasPartialLastRow) {
                justifyContent = 'center';
            }
        } else {
            switch (layoutMode) {
                case 'grid-4-2':
                    gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
                    gridTemplateRows = 'repeat(2, minmax(0, 1fr))';
                    layoutClass = 'layout-4-2';
                    break;
                case 'grid-4-2-last3':
                    gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
                    gridTemplateRows = 'repeat(2, minmax(0, 1fr))';
                    layoutClass = 'layout-4-2-last3';
                    break;
                case 'grid-4-4-2':
                    gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
                    gridTemplateRows = 'repeat(3, minmax(0, 1fr))';
                    layoutClass = 'layout-ten';
                    break;
                case 'grid-4-4-3':
                    gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
                    gridTemplateRows = 'repeat(3, minmax(0, 1fr))';
                    layoutClass = 'layout-eleven';
                    break;
                case 'grid-4-3':
                    gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
                    gridTemplateRows = 'repeat(3, minmax(0, 1fr))';
                    layoutClass = 'layout-4-3';
                    break;
                default:
                    break;
            }
        }

        return {
            columns,
            rows,
            flexBasis,
            flexGrow,
            cellHeight,
            layoutMode,
            gridTemplateColumns,
            gridTemplateRows,
            justifyContent,
            layoutClass,
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

        const activeElement = document.activeElement;
        let previousFocusStt = null;

        if (activeElement) {
            let activeTile = null;

            if (activeElement.classList && activeElement.classList.contains('screen-tile')) {
                activeTile = activeElement;
            } else if (typeof activeElement.closest === 'function') {
                activeTile = activeElement.closest('.screen-tile');
            }

            if (activeTile) {
                previousFocusStt = activeTile.getAttribute('data-stt');
            }
        }

        // Clear existing elements
        gridElement.innerHTML = '';
        this.screenElements.clear();

        // Không có màn hình nào -- khôn hiển thị gì hết
        if (!this.currentLayout) {
            gridElement.innerHTML = '<div class="no-screens"></div>';
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

        this.restoreFocus(previousFocusStt);
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
                       
                    </div>
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
        const left = col > 0
            ? index - 1
            : (row > 0 ? Math.min(row * columns - 1, this.screens.length - 1) : -1);
        const right = index + 1 < this.screens.length ? index + 1 : -1;

        const getNeighborStt = (neighborIndex) => {
            if (neighborIndex < 0 || neighborIndex >= this.screens.length) {
                return -1;
            }
            const neighborScreen = this.screens[neighborIndex];
            return typeof neighborScreen !== 'undefined' && typeof neighborScreen.STT !== 'undefined'
                ? neighborScreen.STT
                : -1;
        };

        // Set navigation data
        element.setAttribute('data-nav-up', up);
        element.setAttribute('data-nav-up-stt', getNeighborStt(up));
        element.setAttribute('data-nav-down', down);
        element.setAttribute('data-nav-down-stt', getNeighborStt(down));
        element.setAttribute('data-nav-left', left);
        element.setAttribute('data-nav-left-stt', getNeighborStt(left));
        element.setAttribute('data-nav-right', right);
        element.setAttribute('data-nav-right-stt', getNeighborStt(right));
        element.setAttribute('data-row', row);
        element.setAttribute('data-col', col);
    }

    /**
     * Apply flex layout styles
     */
    applyFlexLayout() {
        if (!this.currentLayout) return;

        const gridElement = document.getElementById('dashboard-grid');
        if (!gridElement) return;

        const {
            flexBasis,
            flexGrow,
            cellHeight,
            layoutMode,
            gridTemplateColumns,
            gridTemplateRows,
            justifyContent,
            layoutClass
        } = this.currentLayout;

        // Reset grid element styles before applying new layout
        gridElement.classList.remove('layout-4-2', 'layout-4-2-last3', 'layout-ten', 'layout-eleven', 'layout-4-3');
        gridElement.style.gridTemplateColumns = '';
        gridElement.style.gridTemplateRows = '';
        gridElement.style.gridAutoFlow = '';
        gridElement.style.justifyContent = '';
        gridElement.style.alignContent = '';
        gridElement.style.alignItems = '';
        gridElement.style.justifyItems = '';
        gridElement.style.flexWrap = '';
        gridElement.style.width = '100%';
        gridElement.style.height = '100%';

        this.screenElements.forEach((element) => {
            element.style.flexBasis = '';
            element.style.flexGrow = '';
            element.style.maxWidth = '';
            element.style.height = '';
            element.style.gridColumn = '';
            element.style.gridRow = '';
        });

        const isGridLayout = layoutMode !== 'flex' && layoutClass;

        if (isGridLayout) {
            gridElement.style.display = 'grid';
            gridElement.style.gridTemplateColumns = gridTemplateColumns;
            gridElement.style.gridTemplateRows = gridTemplateRows;
            gridElement.style.gridAutoFlow = 'row';
            gridElement.style.justifyContent = 'center';
            gridElement.style.alignContent = 'stretch';
            gridElement.style.alignItems = 'stretch';
            gridElement.style.justifyItems = 'stretch';
            gridElement.classList.add(layoutClass);
            return;
        }

        // Apply flex styles to grid
        gridElement.style.display = 'flex';
        gridElement.style.flexWrap = 'wrap';
        gridElement.style.width = '100%';
        gridElement.style.height = '100%';
        gridElement.style.alignContent = 'stretch';
        gridElement.style.justifyContent = justifyContent;

        // Apply styles to each screen tile
        this.screenElements.forEach((element) => {
            element.style.flexBasis = flexBasis;
            element.style.flexGrow = flexGrow;
            element.style.maxWidth = flexBasis;
            element.style.height = cellHeight;
        });
    }

    restoreFocus(previousFocusStt) {
        if (!previousFocusStt && previousFocusStt !== '0') {
            return;
        }

        const targetSelector = `.screen-tile[data-stt="${previousFocusStt}"]`;
        const targetElement = this.container?.querySelector(targetSelector);
        const navigationManager = window.app?.navigationManager;

        const focusWithManager = (element) => {
            if (!element) {
                return;
            }

            if (navigationManager && typeof navigationManager.moveFocus === 'function') {
                navigationManager.moveFocus(element);
            } else {
                document.querySelectorAll('.screen-tile.focused').forEach((focusedEl) => {
                    if (focusedEl !== element) {
                        focusedEl.classList.remove('focused');
                    }
                });
                element.focus();
                element.classList.add('focused');
            }
        };

        if (targetElement) {
            focusWithManager(targetElement);
            return;
        }

        const fallbackElement =
            this.container?.querySelector('.screen-tile.map-screen') ||
            this.container?.querySelector('.screen-tile[data-stt="0"]');

        if (fallbackElement) {
            focusWithManager(fallbackElement);
        }
    }

    /**
     * Handle screen click
     */
    handleScreenClick(screen) {
        // M0 (screen 0) - navigate to map view
        if (screen.STT === 0) {
            if (window.app && window.app.router) {
                if (typeof window.app.lockMapView === 'function') {
                    window.app.lockMapView();
                }
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

        const navAttr = `data-nav-${direction}`;
        const navIndex = currentElement.getAttribute(navAttr);

        if (navIndex && navIndex !== '-1') {
            const targetIndex = parseInt(navIndex, 10);
            const screens = this.container.querySelectorAll('.screen-tile');
            if (screens[targetIndex]) {
                this.focusScreen(targetIndex);
                return;
            }
        }

        const fallbackStt = currentElement.getAttribute(`${navAttr}-stt`);
        if (fallbackStt && fallbackStt !== '-1') {
            const fallbackElement = this.container.querySelector(`.screen-tile[data-stt="${fallbackStt}"]`);
            if (fallbackElement) {
                fallbackElement.focus();
                fallbackElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
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
    }
}

// Export cho các module khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardGrid;
} else {
    window.DashboardGrid = DashboardGrid;
}
