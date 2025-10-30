/**
 * ApiService - Quản lý API calls
 */
class ApiService {
    constructor() {
        this.previousData = null;
        // Sử dụng URL từ config
        this.updateApiUrl();
        this.pollingInterval = null;
        this.callbacks = [];
    }
    
    // Cập nhật URL API khi có thay đổi config
    updateApiUrl() {
        this.apiUrl = API_CONFIG.CURRENT_BASE_URL + API_CONFIG.ENDPOINTS.GET_ACTIVE_DISPLAYS;
        console.log('API URL đã được cập nhật:', this.apiUrl);
    }

    // Đăng ký callback để xử lý dữ liệu khi API trả về
    onDataUpdate(callback) {
        this.callbacks.push(callback);
    }

    // Gọi API và xử lý dữ liệu
    async callDefaultAPI() {
        try {
            // Sử dụng headers từ config
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: API_CONFIG.DEFAULT_HEADERS
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            
            // Kiểm tra nếu API trả về thành công
            if (data.success) {
                // Xử lý trường hợp có dữ liệu hoặc không có dữ liệu
                const displays = data.result || [];
                const dataString = JSON.stringify(displays);
                
                // Luôn notify callbacks cho lần đầu tiên hoặc khi dữ liệu thay đổi
                if (this.previousData === null || this.previousData === undefined || this.previousData !== dataString) {
                    this.previousData = dataString;
                    this.notifyCallbacks(displays);
                    console.log('Dữ liệu đã được cập nhật:', new Date().toLocaleTimeString());
                }
            } else {
                console.warn('API returned unsuccessful response - Ẩn các màn hình không kết nối');
                // VẪN hiển thị widget M0 ngay cả khi API lỗi
                this.notifyCallbacks([]);
            }
        } catch (error) {
            console.error('Error calling API:', error, '- Ẩn các màn hình không kết nối');
            // VẪN hiển thị widget M0 ngay cả khi API lỗi - ĐÂY LÀ QUAN TRỌNG!
            this.notifyCallbacks([]);
        }
    }

    // Thông báo cho tất cả callbacks
    notifyCallbacks(displays) {
        this.callbacks.forEach(callback => callback(displays));
    }

    // Bắt đầu polling data
    startPolling(intervalMs = 2000) {
        this.stopPolling();
        this.callDefaultAPI(); // Gọi ngay lập tức
        this.pollingInterval = setInterval(() => {
            this.callDefaultAPI();
        }, intervalMs);
    }

    // Dừng polling
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Lấy dữ liệu cũ để so sánh
    getPreviousData() {
        return this.previousData;
    }

    // Đặt lại dữ liệu cũ
    resetPreviousData() {
        this.previousData = null;
    }
}

// Export để sử dụng trong các module khác
window.ApiService = ApiService;