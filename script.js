// Biến toàn cục cho các managers
let mapManager;
let fullscreenManager;
let keyboardHandler;
let apiService;
let widgetManager;
let layoutManager;
let controlRoomManager;

// Biến toàn cục cho auto fullscreen
let lastAutoFullscreenTime = 0;
const AUTO_FULLSCREEN_DEBOUNCE = 3000; // 3 giây
let hasAutoFullscreenTriggered = false;
let pageLoadTime = Date.now(); // Lấy thời gian tải trang

// Biến mới cho logic fullscreen mặc định
let hasInitialFullscreen = false;

// Ensure JavaScript executes after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Khởi tạo ControlRoomManager trước
    controlRoomManager = new ControlRoomManager();
    
    // Khởi tạo các managers khác
    mapManager = new MapManager();
    fullscreenManager = new FullscreenManager(mapManager);
    keyboardHandler = new KeyboardHandler(fullscreenManager);
    apiService = new ApiService();
    widgetManager = new WidgetManager();
    layoutManager = new LayoutManager();
    
    // Khởi tạo WidgetManager với ControlRoomManager
    widgetManager.init(controlRoomManager);
    
    // Đặt mapManager và controlRoomManager vào window để các module khác có thể truy cập
    window.mapManager = mapManager;
    window.controlRoomManager = controlRoomManager;

    // Khởi tạo bản đồ trong screen-1
    mapManager.initialize();

    // KÍCH HOẠT FULLSCREEN NGAY LẬP TỨC sau khi bản đồ được khởi tạo
    setTimeout(() => {
        const mapScreen = document.getElementById('screen-1');
        if (mapScreen && fullscreenManager && !fullscreenManager.getIsFullscreen()) {
            fullscreenManager.enterFullscreen(mapScreen);
            hasInitialFullscreen = true;
            console.log('Đã kích hoạt fullscreen mặc định cho bản đồ khi tải trang');
            updateFullscreenButton(); // Ẩn nút khi đang fullscreen
        }
    }, 500); // Đợi 500ms để đảm bảo bản đồ đã được khởi tạo

    // Đăng ký callback cho API service với logic auto fullscreen
    apiService.onDataUpdate((displays) => {
        widgetManager.updateWidgetDisplay(displays);
        checkAndAutoFullscreen(displays);
    });

    // Đảm bảo M0 (bản đồ) luôn hiển thị ở màn hình 1
    widgetManager.ensureM0AlwaysVisible();

    // Bắt đầu polling API
    apiService.startPolling(2000);

    // Initialize FirePointWidget component trong screen-5
    const firePointWidget = new FirePointWidget("screen-5", {
        title: "Thông tin điểm cháy"
    });

    // Example data update (placeholder for real API call)
    firePointWidget.updateData({
        1: 12,
        2: 3,
        3: 9,
        4: 8,
        5: 2
    });

    // Không focus tự động vào màn hình nào khi trang tải
    console.log("DEBUG: Không focus tự động vào màn hình nào khi trang tải");

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        mapManager.cleanup();
        apiService.stopPolling();
        resetAutoFullscreenState();
    });
});

/**
 * Kiểm tra và tự động thoát fullscreen khi có dữ liệu từ API
 * Logic đúng: Luôn fullscreen bản đồ, chỉ thoát khi API có dữ liệu
 * @param {Array} displays - Dữ liệu trả về từ API
 */
function checkAndAutoFullscreen(displays) {
    const currentTime = Date.now();
    const timeSincePageLoad = currentTime - pageLoadTime;
    
    // Kiểm tra debounce - chỉ cho phép thay đổi lại sau 3 giây
    if (currentTime - lastAutoFullscreenTime < AUTO_FULLSCREEN_DEBOUNCE) {
        return;
    }
    
    // Đảm bảo đã qua thời gian ngăn chặn của KeyboardHandler (3 giây)
    if (timeSincePageLoad < 3500) {
        return;
    }
    
    // Nếu API lỗi (undefined), giữ nguyên fullscreen
    if (displays === undefined) {
        console.warn('API trả về undefined, giữ nguyên fullscreen');
        return;
    }
    
    // Logic đúng: Chỉ thoát fullscreen khi có dữ liệu
    if (Array.isArray(displays) && displays.length > 0) {
        if (fullscreenManager && fullscreenManager.getIsFullscreen()) {
            console.log('Thoát fullscreen vì có dữ liệu API - hiển thị các màn hình nhỏ');
            fullscreenManager.exitFullscreen();
            lastAutoFullscreenTime = Date.now();
            hasAutoFullscreenTriggered = true; // Đánh dấu đã thoát fullscreen
            updateFullscreenButton(); // Hiện nút khi thoát fullscreen
        }
    } else if (Array.isArray(displays) && displays.length === 0) {
        // Giữ nguyên fullscreen khi không có dữ liệu
        if (!fullscreenManager.getIsFullscreen() && hasInitialFullscreen) {
            // Nếu somehow không còn fullscreen, kích hoạt lại
            setTimeout(() => {
                const mapScreen = document.getElementById('screen-1');
                if (mapScreen && fullscreenManager && !fullscreenManager.getIsFullscreen()) {
                    fullscreenManager.enterFullscreen(mapScreen);
                    console.log('Kích hoạt lại fullscreen (không có dữ liệu API)');
                    updateFullscreenButton(); // Ẩn nút khi vào fullscreen
                }
            }, 500);
        }
    }
}

/**
 * Cập nhật hiển thị của nút fullscreen
 */
function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreen-map-btn');
    if (fullscreenBtn && fullscreenManager) {
        if (fullscreenManager.getIsFullscreen()) {
            fullscreenBtn.style.display = 'none'; // Ẩn nút khi đang fullscreen
        } else {
            fullscreenBtn.style.display = 'block'; // Hiện nút khi không fullscreen
        }
    }
}

/**
 * Kích hoạt fullscreen cho bản đồ khi người dùng bấm
 */
function triggerMapFullscreen() {
    const mapScreen = document.getElementById('screen-1');
    if (mapScreen && fullscreenManager && !fullscreenManager.getIsFullscreen()) {
        fullscreenManager.enterFullscreen(mapScreen);
        console.log('Người dùng kích hoạt fullscreen cho bản đồ');
        updateFullscreenButton(); // Ẩn nút sau khi kích hoạt
    }
}

/**
 * Reset trạng thái auto fullscreen - hữu ích khi cần thiết lập lại
 */
function resetAutoFullscreenState() {
    lastAutoFullscreenTime = 0;
    hasAutoFullscreenTriggered = false;
    hasInitialFullscreen = false;
    console.log('Đã reset trạng thái auto fullscreen');
}
