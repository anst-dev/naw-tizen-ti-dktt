/**
 * ControlRoomManager - Quản lý layout 12 màn hình cố định cho phòng điều khiển
 */
class ControlRoomManager {
    constructor() {
        this.controlRoomGrid = document.querySelector('.control-room-grid');
        this.screens = [];
        this.screenData = new Array(12).fill(null); // Mảng 12 phần tử, mỗi phần tử là null hoặc dữ liệu
        this.init();
    }

    // Khởi tạo control room
    init() {
        // Lấy tất cả các screen elements
        for (let i = 1; i <= 12; i++) {
            const screenElement = document.getElementById(`screen-${i}`);
            if (screenElement) {
                this.screens.push({
                    id: i,
                    element: screenElement,
                    isActive: false
                });
                
                // Thêm class disconnected cho tất cả các màn hình trừ màn hình 1 và 5
                if (i !== 1) {
                    screenElement.classList.add('disconnected');
                }
            }
        }
        
        // Đảm bảo màn hình 1 luôn hiển thị
        this.ensureMapAlwaysVisible();
        
        console.log(`Đã khởi tạo ControlRoomManager với ${this.screens.length} màn hình`);
    }

    // Cập nhật dữ liệu cho các màn hình từ API
    updateScreens(apiData) {
        // Reset tất cả các màn hình về trạng thái mặc định
        this.resetAllScreens();
        
        // Cập nhật dữ liệu từ API
        apiData.forEach(item => {
            const screenIndex = item.STT - 1; // Chuyển từ STT (1-12) sang index (0-11)
            if (screenIndex >= 0 && screenIndex < 12) {
                this.updateScreen(screenIndex + 1, item.TenManHinh, true);
            }
        });
        
        console.log('Đã cập nhật dữ liệu cho các màn hình:', apiData);
    }

    // Cập nhật một màn hình cụ thể
    updateScreen(screenNumber, title, isActive = false) {
        const screenIndex = screenNumber - 1;
        if (screenIndex < 0 || screenIndex >= this.screens.length) {
            console.error(`Screen number ${screenNumber} is out of range`);
            return;
        }

        const screen = this.screens[screenIndex];
        const titleElement = screen.element.querySelector('.screen-title');
        
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        // Cập nhật trạng thái active
        if (isActive) {
            screen.element.classList.add('active');
            screen.element.classList.remove('disconnected'); // Xóa class disconnected khi có kết nối
            screen.isActive = true;
            this.screenData[screenIndex] = { title, isActive };
        } else {
            screen.element.classList.remove('active');
            
            // Không thêm class disconnected cho màn hình 1
            if (screenNumber !== 1) {
                screen.element.classList.add('disconnected'); // Thêm class disconnected khi không có kết nối
            }
            
            screen.isActive = false;
            this.screenData[screenIndex] = null;
        }
    }

    // Reset tất cả các màn hình về trạng thái mặc định
    resetAllScreens() {
        this.screens.forEach((screen, index) => {
            const titleElement = screen.element.querySelector('.screen-title');
            if (titleElement) {
                titleElement.textContent = 'Chưa kết nối';
            }
            
            screen.element.classList.remove('active');
            
            // Không thêm class disconnected cho màn hình 1
            if (screen.id !== 1) {
                screen.element.classList.add('disconnected');
            }
            
            screen.isActive = false;
            this.screenData[index] = null;
        });
        
        // Đảm bảo màn hình 1 luôn hiển thị sau khi reset
        this.ensureMapAlwaysVisible();
    }

    // Lấy thông tin một màn hình
    getScreen(screenNumber) {
        const screenIndex = screenNumber - 1;
        if (screenIndex >= 0 && screenIndex < this.screens.length) {
            return this.screens[screenIndex];
        }
        return null;
    }

    // Lấy tất cả các màn hình đang active
    getActiveScreens() {
        return this.screens.filter(screen => screen.isActive);
    }

    // Lấy element theo screen number
    getScreenElement(screenNumber) {
        const screen = this.getScreen(screenNumber);
        return screen ? screen.element : null;
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
        //     console.log(`ControlRoomManager Auto scale applied: ${scaleFactor.toFixed(3)} for screen ${window.innerWidth}x${window.innerHeight}`);
        // }
        console.log(`Auto scale disabled - using viewport units for responsive display`);
    }

    // Đảm bảo M0 (bản đồ) luôn hiển thị ở màn hình 1
    ensureMapAlwaysVisible() {
        const screenIndex = 0; // Màn hình 1 có index 0
        const screen = this.screens[screenIndex];
        const titleElement = screen.element.querySelector('.screen-title');
        
        if (titleElement) {
            titleElement.textContent = 'Bản đồ';
        }
        
        // Đảm bảo màn hình 1 luôn active và không bao giờ disconnected
        screen.element.classList.add('active');
        screen.element.classList.remove('disconnected');
        screen.isActive = true;
        this.screenData[screenIndex] = { title: 'Bản đồ', isActive: true };
    }

    // Lấy dữ liệu của tất cả các màn hình
    getAllScreenData() {
        return this.screenData;
    }

    // Lấy dữ liệu của một màn hình cụ thể
    getScreenData(screenNumber) {
        const screenIndex = screenNumber - 1;
        if (screenIndex >= 0 && screenIndex < this.screenData.length) {
            return this.screenData[screenIndex];
        }
        return null;
    }
}

// Export để sử dụng trong các module khác
window.ControlRoomManager = ControlRoomManager;