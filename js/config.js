/**
 * Cấu hình API cho ứng dụng
 */
const API_CONFIG = {
    // URL base - có thể dễ dàng chuyển đổi giữa localhost và ngrok
    BASE_URLS: {
        LOCALHOST: 'https://localhost:44311',
        NGROK: 'https://unsupercilious-leonarda-unreaving.ngrok-free.dev'
    },
    
    // Headers mặc định cho tất cả request
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    },
    
    // API endpoints
    ENDPOINTS: {
        GET_ACTIVE_DISPLAYS: '/api/services/app/HienThiDieuKhienTrungTam/GetActiveDisplays'
    },
    
    // Timeout cho request (ms)
    TIMEOUT: 30000
};

// Cấu hình TV 100 inch - Đơn giản hóa
const TV_CONFIG = {
    DEVICE_TYPE: "TV_100_INCH",
    // Không cần kích thước cố định - sử dụng viewport units
    // Auto scale đã được vô hiệu hóa - sử dụng CSS viewport units
    getAutoScale: function() {
        // Không cần scale - sử dụng vw/vh và rem trong CSS
        return 1.0; // Always return 1
    }
};

// Thêm CURRENT_BASE_URL sau khi đã định nghĩa API_CONFIG
API_CONFIG.CURRENT_BASE_URL = API_CONFIG.BASE_URLS.NGROK;

// Export để sử dụng trong các module khác
window.API_CONFIG = API_CONFIG;
window.TV_CONFIG = TV_CONFIG;