/**
 * MapManager - Quản lý bản đồ OpenLayers (đã cập nhật cho layout 12 màn hình)
 */
class MapManager {
    constructor() {
        this.openLayersMap = null;
        this.mapResizeObserver = null;
    }

    initialize() {
        this.initializeOpenLayersMap();
    }

    initializeOpenLayersMap() {
        const mapElement = document.getElementById("map");
        if (!mapElement) {
            console.error("Map element not found");
            return;
        }

        if (typeof ol === "undefined") {
            console.error("OpenLayers library failed to load.");
            return;
        }

        // Không đặt kích thước cố định, để CSS quyết định kích thước
        // mapElement sẽ có kích thước theo .map-container

        this.openLayersMap = new ol.Map({
            target: mapElement,
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([105.695587, 18.671575]),
                zoom: 10  // Tăng zoom để bản đồ không bị quá to
            })
        }); 

        if (typeof ResizeObserver !== "undefined") {
            // Clean up existing observer if any
            if (this.mapResizeObserver) {
                this.mapResizeObserver.disconnect();
            }
            
            this.mapResizeObserver = new ResizeObserver(() => {
                if (this.openLayersMap) {
                    this.openLayersMap.updateSize();
                }
            });
            this.mapResizeObserver.observe(mapElement);
        }

        // Clean up existing resize listener if any
        const resizeHandler = () => {
            if (this.openLayersMap) {
                this.openLayersMap.updateSize();
            }
        };
        
        window.removeEventListener("resize", resizeHandler);
        window.addEventListener("resize", resizeHandler);
        
        // Cập nhật kích thước bản đồ sau khi khởi tạo
        setTimeout(() => {
            if (this.openLayersMap) {
                this.openLayersMap.updateSize();
                
                // Đảm bảo zoom phù hợp với kích thước ngay từ đầu
                const mapContainer = document.querySelector('.map-container');
                const mapScreen = document.getElementById('screen-1'); // M0 (bản đồ) hiển thị ở screen-1
                if (mapContainer && mapScreen) {
                    const containerWidth = mapContainer.offsetWidth;
                    const screenWidth = mapScreen.offsetWidth;
                    const view = this.openLayersMap.getView();
                    
                    // Điều chỉnh zoom ngay từ đầu dựa trên kích thước thực tế
                    if (containerWidth < 200) {
                        view.setZoom(14);
                    } else if (containerWidth < 300) {
                        view.setZoom(13);
                    } else if (screenWidth < 400) {
                        view.setZoom(12);
                    } else if (screenWidth < 600) {
                        view.setZoom(11);
                    } else if (screenWidth < 800) {
                        view.setZoom(10);
                    } else {
                        view.setZoom(9);
                    }
                    
                    console.log(`Khởi tạo bản đồ với kích thước: container ${containerWidth}px, screen ${screenWidth}px, zoom: ${view.getZoom()}`);
                }
            }
        }, 100);
        
        console.log("OpenLayers map initialized successfully");
    }

    updateMapSize() {
        if (this.openLayersMap) {
            // Đợi một chút để DOM cập nhật trước khi cập nhật kích thước bản đồ
            setTimeout(() => {
                this.openLayersMap.updateSize();
                
                // Lấy kích thước thực tế của map container để điều chỉnh zoom phù hợp
                const mapContainer = document.querySelector('.map-container');
                const mapScreen = document.getElementById('screen-1'); // M0 (bản đồ) hiển thị ở screen-1
                if (mapContainer && mapScreen) {
                    const containerWidth = mapContainer.offsetWidth;
                    const containerHeight = mapContainer.offsetHeight;
                    const screenWidth = mapScreen.offsetWidth;
                    const view = this.openLayersMap.getView();
                    
                    // Chỉ điều chỉnh zoom khi không ở chế độ fullscreen
                    if (!mapScreen.classList.contains('fullscreen')) {
                        // Điều chỉnh zoom dựa trên kích thước thực tế của map container
                        // Zoom cao hơn do bản đồ nhỏ hơn
                        if (containerWidth < 200) {
                            view.setZoom(14); // Zoom rất cao cho map rất nhỏ
                        } else if (containerWidth < 300) {
                            view.setZoom(13); // Zoom cao cho map nhỏ
                        } else if (screenWidth < 400) {
                            view.setZoom(12); // Zoom cao hơn cho screen nhỏ
                        } else if (screenWidth < 600) {
                            view.setZoom(11); // Zoom trung bình
                        } else if (screenWidth < 800) {
                            view.setZoom(10); // Zoom vừa phải
                        } else {
                            view.setZoom(9); // Zoom thấp hơn cho screen lớn
                        }
                        
                        console.log(`Đã cập nhật kích thước bản đồ: container ${containerWidth}x${containerHeight}, screen ${screenWidth}px, zoom: ${view.getZoom()}`);
                    }
                }
            }, 100);
        }
    }

    adjustZoomForFullscreen() {
        if (this.openLayersMap) {
            setTimeout(() => {
                this.openLayersMap.updateSize();
                // Khi vào fullscreen, bản đồ chiếm 80% kích thước, zoom phù hợp
                const view = this.openLayersMap.getView();
                view.setZoom(10); // Zoom vừa phải cho bản đồ 80% trong fullscreen
                console.log("Đã vào fullscreen, zoom bản đồ cho kích thước 80%");
            }, 250);
        }
    }

    adjustZoomAfterFullscreen() {
        if (this.openLayersMap) {
            setTimeout(() => {
                this.openLayersMap.updateSize();
                // Khi thoát fullscreen, khôi phục zoom dựa trên kích thước map container
                const mapContainer = document.querySelector('.map-container');
                const mapScreen = document.getElementById('screen-1'); // M0 (bản đồ) hiển thị ở screen-1
                if (mapContainer && mapScreen) {
                    const containerWidth = mapContainer.offsetWidth;
                    const screenWidth = mapScreen.offsetWidth;
                    const view = this.openLayersMap.getView();
                    
                    // Khôi phục zoom dựa trên kích thước thực tế của map container
                    if (containerWidth < 200) {
                        view.setZoom(14);
                    } else if (containerWidth < 300) {
                        view.setZoom(13);
                    } else if (screenWidth < 400) {
                        view.setZoom(12);
                    } else if (screenWidth < 600) {
                        view.setZoom(11);
                    } else if (screenWidth < 800) {
                        view.setZoom(10);
                    } else {
                        view.setZoom(9);
                    }
                    
                    console.log("Đã thoát fullscreen, khôi phục zoom cho bản đồ");
                }
            }, 0);
        }
    }

    getMap() {
        return this.openLayersMap;
    }

    cleanup() {
        if (this.mapResizeObserver) {
            this.mapResizeObserver.disconnect();
            this.mapResizeObserver = null;
        }
        
        if (this.openLayersMap) {
            this.openLayersMap.setTarget(null);
            this.openLayersMap = null;
        }
    }
}

// Export để sử dụng trong các module khác
window.MapManager = MapManager;