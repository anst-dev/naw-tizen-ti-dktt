/**
 * FullscreenManager - Quản lý chế độ fullscreen (đã cập nhật cho layout 12 màn hình)
 */
class FullscreenManager {
    constructor(mapManager) {
        this.isFullscreen = false;
        this.fullscreenScreen = null;
        this.controlRoomGrid = document.querySelector(".control-room-grid");
        this.mapManager = mapManager;
    }

    enterFullscreen(screen) {
        if (!screen || this.isFullscreen) {
            return;
        }

        this.isFullscreen = true;
        this.fullscreenScreen = screen;

        screen.classList.add("fullscreen");
        this.controlRoomGrid.classList.add("has-fullscreen");

        // Lazy-load iframe for screen-5 (FirePointWidget)
        if (screen.id === "screen-5") {
            let iframe = screen.querySelector("iframe.fullscreen-content");
            if (!iframe) {
                iframe = document.createElement("iframe");
                iframe.className = "fullscreen-content";
                iframe.src = "components/diemChay/diemChayCT/index.html";
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "none";
                iframe.style.position = "absolute";
                iframe.style.top = "0";
                iframe.style.left = "0";
                screen.appendChild(iframe);
            }
            iframe.style.display = "block";
        }

        screen.focus();

        if (screen.id === "screen-1" && this.mapManager) {
            this.mapManager.adjustZoomForFullscreen();
        }
    }

    exitFullscreen() {
        if (!this.isFullscreen || !this.fullscreenScreen) {
            return;
        }

        const screenToFocus = this.fullscreenScreen; // Store reference before cleanup

        if (this.fullscreenScreen.id === "screen-5") {
            const iframe = this.fullscreenScreen.querySelector("iframe.fullscreen-content");
            if (iframe) {
                iframe.style.display = "none";
            }
        }

        this.fullscreenScreen.classList.remove("fullscreen");
        this.controlRoomGrid.classList.remove("has-fullscreen");
        
        // Force focus restoration with delay to ensure DOM is ready
        setTimeout(() => {
            screenToFocus.focus();
            
            // Verify focus was restored
            setTimeout(() => {
                const activeElement = document.activeElement;
                
                // If focus still lost, try to focus on first available screen
                if (!activeElement || !activeElement.classList.contains("screen")) {
                    const firstScreen = document.querySelector('.screen');
                    if (firstScreen) {
                        firstScreen.focus();
                    }
                }
            }, 50);
        }, 100);

        if (this.fullscreenScreen.id === "screen-1" && this.mapManager) {
            this.mapManager.adjustZoomAfterFullscreen();
        }

        this.isFullscreen = false;
        this.fullscreenScreen = null;
    }

    toggleFullscreen(screen) {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen(screen);
        }
    }

    getIsFullscreen() {
        return this.isFullscreen;
    }

    getFullscreenScreen() {
        return this.fullscreenScreen;
    }
}

// Export để sử dụng trong các module khác
window.FullscreenManager = FullscreenManager;