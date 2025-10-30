/**
 * ApiService.js - Service quản lý việc gọi API
 */

class ApiService {
    constructor() {
        this.baseUrl = Config.API.BASE_URL;
        this.endpoints = Config.API.ENDPOINTS;
        this.pollingInterval = null;
        this.callbacks = [];
        this.lastResponse = null;
        this.errorCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Gọi API GetActiveDisplay
     * @returns {Promise<Array>} Danh sách màn hình active
     */
    async getActiveDisplay() {
        try {
            const url = `${this.baseUrl}${this.endpoints.GET_ACTIVE_DISPLAY}`;

            Config.log('debug', 'Calling API:', url);
            console.log('🔍 Calling API:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',   
                     'ngrok-skip-browser-warning': 'true'
                },
                timeout: Config.API.TIMEOUT
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 Raw API response:', data);

            // Kiểm tra format dữ liệu trả về
            if (!data || !data.result || !Array.isArray(data.result)) {
                Config.log('warn', 'Invalid API response format:', data);
                console.error('❌ Invalid API response format:', data);
                return [];
            }
            
            console.log('📋 Items from API:', data.result.length, 'items');

            // Lọc chỉ lấy các màn hình active
            const activeScreens = data.result
                .filter(item => item.isActive === true || item.isActive === 1)
                .map(item => ({
                    STT: item.stt || item.soThuTu || item.STT || 0,
                    TenManHinh: item.tenManHinh || item.TenManHinh || 'Không có tên',
                    isActive: true,
                    MaManHinh: item.maHienThiDieuKhienTrungTam || item.maManHinh || item.MaManHinh || null,
                    LoaiManHinh: item.loaiManHinh || item.LoaiManHinh || null,
                    Data: item.data || item.Data || {},
                    Layout: item.layout,
                    Theme: item.theme,
                    NguoiCapQuyen: item.nguoiCapQuyen
                }))
                .sort((a, b) => a.STT - b.STT);

            Config.log('info', `Found ${activeScreens.length} active screens`);
            console.log('✅ Active screens found:', activeScreens.length);
            console.log('📊 Screen details:', activeScreens);

            this.errorCount = 0; // Reset error count on success
            this.lastResponse = activeScreens;

            return activeScreens;

        } catch (error) {
            Config.log('error', 'API Error:', error);
            this.errorCount++;

            // Nếu lỗi quá nhiều lần, trả về response cuối cùng hoặc ar1ray rỗng
            if (this.errorCount > this.maxRetries) {
                Config.log('warn', 'Max retries reached, returning last response or empty');
                return this.lastResponse || [];
            }

            // Thử lại sau một khoảng thời gian
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(this.getActiveDisplay());
                }, 1000 * this.errorCount); // Tăng delay theo số lần lỗi
            });
        }
    }

    /**
     * Bắt đầu polling API
     * @param {number} interval - Khoảng thời gian polling (ms)
     */
    startPolling(interval = Config.API.POLLING_INTERVAL) {
        // Clear existing polling if any
        this.stopPolling();

        Config.log('info', `Starting API polling with interval: ${interval}ms`);
        console.log('🚀 === STARTING API POLLING ===');
        console.log('⏱️ Interval:', interval, 'ms');

        // Gọi lần đầu tiên ngay lập tức
        console.log('📡 First poll starting now...');
        this.pollAPI();

        // Set interval cho các lần tiếp theo
        this.pollingInterval = setInterval(() => {
            this.pollAPI();
        }, interval);
    }

    /**
     * Dừng polling API
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            Config.log('info', 'API polling stopped');
        }
    }

    /**
     * Poll API một lần
     */
    async pollAPI() {
        console.log('⏰ Polling API at', new Date().toLocaleTimeString());
        try {
            const activeScreens = await this.getActiveDisplay();
            console.log('📨 Poll result:', activeScreens.length, 'screens');

            // Notify all callbacks
            this.callbacks.forEach(callback => {
                if (typeof callback === 'function') {
                    console.log('🔔 Notifying callback with', activeScreens.length, 'screens');
                    callback(activeScreens);
                }
            });

        } catch (error) {
            Config.log('error', 'Polling error:', error);
        }
    }

    /**
     * Đăng ký callback khi có dữ liệu mới
     * @param {Function} callback - Function sẽ được gọi khi có dữ liệu
     */
    onDataUpdate(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
            Config.log('debug', 'Registered new data update callback');
        }
    }

    /**
     * Hủy đăng ký callback
     * @param {Function} callback - Function cần hủy
     */
    offDataUpdate(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
            Config.log('debug', 'Unregistered data update callback');
        }
    }

    /**
     * Clear tất cả callbacks
     */
    clearCallbacks() {
        this.callbacks = [];
        Config.log('debug', 'Cleared all callbacks');
    }

    /**
     * Test API với dữ liệu giả
     * @param {Array} mockData - Dữ liệu giả để test
     */
    testWithMockData(mockData) {
        Config.log('info', 'Testing with mock data:', mockData);

        this.callbacks.forEach(callback => {
            if (typeof callback === 'function') {
                callback(mockData);
            }
        });
    }

    /**
     * Get last API response
     * @returns {Array|null} Last response or null
     */
    getLastResponse() {
        return this.lastResponse;
    }

    /**
     * Kiểm tra connection status
     * @returns {boolean} True nếu đang kết nối tốt
     */
    isConnected() {
        return this.errorCount === 0 && this.lastResponse !== null;
    }

    /**
     * Reset service về trạng thái ban đầu
     */
    reset() {
        this.stopPolling();
        this.clearCallbacks();
        this.lastResponse = null;
        this.errorCount = 0;
        Config.log('info', 'ApiService reset complete');
    }
}

// Export cho các module khác sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} else {
    window.ApiService = ApiService;
}
