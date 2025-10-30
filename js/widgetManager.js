/**
 * WidgetManager - Quản lý hiển thị widgets (đã cập nhật cho layout 12 màn hình)
 */
class WidgetManager {
    constructor() {
        this.controlRoomManager = null; // Sẽ được khởi tạo trong script.js
    }

    // Khởi tạo với ControlRoomManager
    init(controlRoomManager) {
        this.controlRoomManager = controlRoomManager;
        console.log('WidgetManager đã được khởi tạo với ControlRoomManager');
    }

    // Cập nhật hiển thị các widget dựa trên dữ liệu API
    updateWidgetDisplay(displays) {
        if (!this.controlRoomManager) {
            console.error('ControlRoomManager chưa được khởi tạo');
            return;
        }

        // Chuyển đổi dữ liệu từ API sang định dạng mới
        const screenData = displays.map(display => ({
            STT: display.stt,
            TenManHinh: display.tenManHinh
        }));

        // Cập nhật ControlRoomManager
        this.controlRoomManager.updateScreens(screenData);
    }

    // Đảm bảo widget M0 (bản đồ) luôn hiển thị
    ensureM0AlwaysVisible() {
        // Trong layout mới, màn hình 1 luôn là bản đồ (M0)
        if (this.controlRoomManager) {
            this.controlRoomManager.ensureMapAlwaysVisible();
        }
    }
    
    // Lấy danh sách các widget đang hiển thị
    getVisibleWidgets() {
        if (!this.controlRoomManager) return [];
        return this.controlRoomManager.getActiveScreens();
    }

    // Lấy widget theo ID
    getWidgetById(id) {
        if (!this.controlRoomManager) return null;
        
        // Chuyển đổi từ ID cũ sang screen number mới
        if (id === 'm0') return this.controlRoomManager.getScreenElement(1); // Bản đồ (M0)
        if (id === 'm5') return this.controlRoomManager.getScreenElement(5); // FirePointWidget
        
        // Các mapping khác có thể được thêm vào đây
        return null;
    }

    // Áp dụng auto scale để phù hợp với màn hình thực tế
    applyAutoScale() {
        // Auto scale đã được vô hiệu hóa - sử dụng viewport units trong CSS
        // if (this.controlRoomManager) {
        //     this.controlRoomManager.applyAutoScale();
        // }
        console.log('Auto scale disabled - using viewport units');
    }

    // Lấy dữ liệu của tất cả các màn hình
    getAllWidgetData() {
        if (!this.controlRoomManager) return [];
        return this.controlRoomManager.getAllScreenData();
    }

    // Lấy dữ liệu của một widget cụ thể
    getWidgetData(id) {
        if (!this.controlRoomManager) return null;
        
        // Chuyển đổi từ ID cũ sang screen number mới
        let screenNumber = null;
        if (id === 'm0') screenNumber = 1; // Bản đồ (M0)
        if (id === 'm5') screenNumber = 5; // FirePointWidget
        
        if (screenNumber) {
            return this.controlRoomManager.getScreenData(screenNumber);
        }
        
        return null;
    }

    // Cập nhật một widget cụ thể
    updateWidget(id, title, isActive = false) {
        if (!this.controlRoomManager) return;
        
        // Chuyển đổi từ ID cũ sang screen number mới
        let screenNumber = null;
        if (id === 'm0') screenNumber = 1; // Bản đồ (M0)
        if (id === 'm5') screenNumber = 5; // FirePointWidget
        
        if (screenNumber) {
            this.controlRoomManager.updateScreen(screenNumber, title, isActive);
        }
    }
}

// Export để sử dụng trong các module khác
window.WidgetManager = WidgetManager;