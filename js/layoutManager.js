/**
 * LayoutManager - Quản lý layout dashboard (đã cập nhật cho layout 12 màn hình)
 */
class LayoutManager {
    constructor() {
        this.controlRoomGrid = document.querySelector('.control-room-grid');
    }

    // Cập nhật layout dashboard (đã được thay thế bởi ControlRoomManager)
    updateDashboardLayout(widgetCount) {
        console.log(`LayoutManager: Layout được quản lý bởi ControlRoomManager, số lượng màn hình: ${widgetCount}`);
        
        // Auto scale đã được vô hiệu hóa - sử dụng viewport units
        // this.applyAutoScale();
    }

    // Lấy kích thước màn hình thực tế
    getScreenSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    // Cập nhật layout cho một màn hình cụ thể
    updateWidgetLayout(widgetId, layoutProperties) {
        // Chuyển đổi từ widget ID cũ sang screen ID mới
        let screenId = widgetId;
        if (widgetId === 'm0') screenId = 'screen-1'; // Bản đồ (M0)
        if (widgetId === 'm5') screenId = 'screen-5'; // FirePointWidget
        
        const screen = document.getElementById(screenId);
        if (screen) {
            Object.assign(screen.style, layoutProperties);
        }
    }

    // Thêm class layout mới cho dashboard
    addLayoutClass(className) {
        this.controlRoomGrid.classList.add(className);
    }

    // Xóa class layout khỏi dashboard
    removeLayoutClass(className) {
        this.controlRoomGrid.classList.remove(className);
    }

    // Lấy tất cả các class layout hiện tại
    getLayoutClasses() {
        const classes = Array.from(this.controlRoomGrid.classList);
        return classes.filter(cls => cls.startsWith('layout-'));
    }

    // Reset layout về mặc định
    resetLayout() {
        // Xóa tất cả các class layout
        this.getLayoutClasses().forEach(cls => {
            this.controlRoomGrid.classList.remove(cls);
        });
    }

    // Áp dụng auto scale để phù hợp với màn hình thực tế
    // ĐÃ VÔ HIỆU HÓA - Sử dụng viewport units thay vì transform scale
    applyAutoScale() {
        // Không cần scale nữa - sử dụng viewport units (vw, vh) và rem
        // const scaleFactor = TV_CONFIG.getAutoScale();
        // const body = document.body;
        // 
        // if (scaleFactor < 1.0) {
        //     body.style.transform = `scale(${scaleFactor})`;
        //     body.style.width = `${TV_CONFIG.DEFAULT_SCREEN.width}px`;
        //     body.style.height = `${TV_CONFIG.DEFAULT_SCREEN.height}px`;
        //     
        //     console.log(`LayoutManager Auto scale applied: ${scaleFactor.toFixed(3)} for screen ${window.innerWidth}x${window.innerHeight}`);
        // } else {
        //     body.style.transform = 'scale(1.0)';
        //     body.style.width = '100%';
        //     body.style.height = '100%';
        // }
        console.log(`Auto scale disabled - using viewport units for responsive display`);
    }

    // Cập nhật layout cho fullscreen mode
    updateFullscreenLayout(element, isFullscreen) {
        if (isFullscreen) {
            this.controlRoomGrid.classList.add('has-fullscreen');
        } else {
            this.controlRoomGrid.classList.remove('has-fullscreen');
        }
    }

    // Lấy thông tin layout hiện tại
    getCurrentLayoutInfo() {
        return {
            type: 'control-room-grid',
            screens: 12,
            grid: {
                columns: 4,
                rows: 3
            },
            screenSize: this.getScreenSize()
        };
    }
}

// Export để sử dụng trong các module khác
window.LayoutManager = LayoutManager;