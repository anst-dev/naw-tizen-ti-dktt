/**
 * MapFullscreen - Quản lý bản đồ OpenLayers full màn hình
 */
class MapFullscreen {
    constructor() {
        this.map = null;
        this.mapElement = null;
        this.coordinatesElement = null;
        this.zoomLevelElement = null;
        this.exitBtn = null;
        this.resizeObserver = null;
        
        // Cấu hình bản đồ
        this.config = {
            center: [105.8342, 21.0278], // Hà Nội
            zoom: 10,
            minZoom: 2,
            maxZoom: 18
        };
    }

    /**
     * Khởi tạo bản đồ
     */
    initialize() {
        this.mapElement = document.getElementById('map');
        this.coordinatesElement = document.getElementById('coordinates');
        this.zoomLevelElement = document.getElementById('zoom-level');
        this.exitBtn = document.getElementById('exit-btn');

        if (!this.mapElement) {
            console.error('Map element not found');
            return;
        }

        if (typeof ol === 'undefined') {
            console.error('OpenLayers library not loaded');
            return;
        }

        this.createMap();
        this.setupEventListeners();
        this.setupResizeObserver();
        this.updateMapInfo();
        
        console.log('Bản đồ full màn hình đã được khởi tạo thành công');
    }

    /**
     * Tạo bản đồ OpenLayers
     */
    createMap() {
        this.map = new ol.Map({
            target: this.mapElement,
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat(this.config.center),
                zoom: this.config.zoom,
                minZoom: this.config.minZoom,
                maxZoom: this.config.maxZoom
            }),
            controls: ol.control.defaults({
                attribution: true,
                zoom: true,
                rotate: false
            })
        });
    }

    /**
     * Thiết lập các sự kiện
     */
    setupEventListeners() {
        // Sự kiện thay đổi view (zoom, pan)
        if (this.map) {
            this.map.getView().on('change:center', () => {
                this.updateCoordinates();
            });
            
            this.map.getView().on('change:resolution', () => {
                this.updateZoomLevel();
            });
        }

        // Sự kiện click chuột để hiển thị tọa độ
        if (this.mapElement) {
            this.mapElement.addEventListener('click', (event) => {
                this.handleMapClick(event);
            });
        }

        // Sự kiện nút thoát
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => {
                this.exitFullscreen();
            });
        }

        // Sự kiện phím ESC để thoát
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.exitFullscreen();
            }
        });

        // Sự kiện thay đổi kích thước cửa sổ
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    /**
     * Thiết lập ResizeObserver để theo dõi thay đổi kích thước
     */
    setupResizeObserver() {
        if (typeof ResizeObserver !== 'undefined' && this.mapElement) {
            this.resizeObserver = new ResizeObserver(() => {
                if (this.map) {
                    this.map.updateSize();
                }
            });
            this.resizeObserver.observe(this.mapElement);
        }
    }

    /**
     * Xử lý click trên bản đồ
     */
    handleMapClick(event) {
        if (!this.map) return;

        const coordinate = this.map.getCoordinateFromPixel([event.clientX, event.clientY]);
        if (coordinate) {
            const lonLat = ol.proj.toLonLat(coordinate);
            console.log('Clicked at:', lonLat);
            this.updateCoordinatesDisplay(lonLat);
        }
    }

    /**
     * Cập nhật hiển thị tọa độ
     */
    updateCoordinates() {
        if (!this.map || !this.coordinatesElement) return;

        const center = this.map.getView().getCenter();
        if (center) {
            const lonLat = ol.proj.toLonLat(center);
            this.updateCoordinatesDisplay(lonLat);
        }
    }

    /**
     * Cập nhật hiển thị tọa độ cụ thể
     */
    updateCoordinatesDisplay(lonLat) {
        if (this.coordinatesElement) {
            this.coordinatesElement.textContent = 
                `Tọa độ: ${lonLat[0].toFixed(6)}, ${lonLat[1].toFixed(6)}`;
        }
    }

    /**
     * Cập nhật mức zoom
     */
    updateZoomLevel() {
        if (!this.map || !this.zoomLevelElement) return;

        const zoom = this.map.getView().getZoom();
        if (zoom !== undefined) {
            this.zoomLevelElement.textContent = `Zoom: ${zoom.toFixed(1)}`;
        }
    }

    /**
     * Cập nhật thông tin bản đồ
     */
    updateMapInfo() {
        this.updateCoordinates();
        this.updateZoomLevel();
    }

    /**
     * Xử lý thay đổi kích thước cửa sổ
     */
    handleWindowResize() {
        if (this.map) {
            // Đợi một chút để DOM cập nhật
            setTimeout(() => {
                this.map.updateSize();
            }, 100);
        }
    }

    /**
     * Thoát fullscreen
     */
    exitFullscreen() {
        // Có thể điều hướng về trang chính hoặc đóng tab
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Nếu không có lịch sử, có thể điều hướng về trang chính
            window.location.href = 'index.html';
        }
    }

    /**
     * Hủy bản đồ
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.map) {
            this.map.setTarget(null);
            this.map = null;
        }

        // Xóa event listeners
        if (this.exitBtn) {
            this.exitBtn.removeEventListener('click', this.exitFullscreen);
        }

        document.removeEventListener('keydown', this.exitFullscreen);
        window.removeEventListener('resize', this.handleWindowResize);
    }
}

// Khởi tạo bản đồ khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    const mapFullscreen = new MapFullscreen();
    mapFullscreen.initialize();
    
    // Lưu instance vào window để có thể truy cập từ console
    window.mapFullscreen = mapFullscreen;
});

// Cleanup khi trang bị unload
window.addEventListener('beforeunload', () => {
    if (window.mapFullscreen) {
        window.mapFullscreen.destroy();
    }
});