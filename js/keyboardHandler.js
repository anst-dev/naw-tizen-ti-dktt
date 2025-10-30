/**
 * KeyboardHandler - Xử lý sự kiện bàn phím/remote (đã cập nhật cho layout 12 màn hình)
 */
class KeyboardHandler {
    constructor(fullscreenManager) {
        this.fullscreenManager = fullscreenManager;
        this.lastKeyTime = 0;
        this.KEY_DEBOUNCE_DELAY = 100;
        this.isTransitioning = false;
        this.pageLoadTime = Date.now();
        this.PREVENT_FULLSCREEN_DURATION = 3000;
        
        this.KEY_CODE_MAP = {
            13: "Enter",
            32: "Enter", // some remotes map OK to space
            65376: "Enter",
            65385: "Enter",
            415: "Enter",
            10009: "Back",
            27: "Back",
            8: "Back",
            65390: "Back",
            65391: "Back",
            65361: "ArrowLeft",
            37: "ArrowLeft",
            65362: "ArrowUp",
            38: "ArrowUp",
            65363: "ArrowRight",
            39: "ArrowRight",
            65364: "ArrowDown",
            40: "ArrowDown"
        };
        
        this.init();
    }

    init() {
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    handleKeyDown(event) {
        const currentTime = Date.now();
        
        // Debounce rapid key presses
        if (currentTime - this.lastKeyTime < this.KEY_DEBOUNCE_DELAY) {
            return;
        }
        this.lastKeyTime = currentTime;
        
        // Prevent operations during transitions
        if (this.isTransitioning) {
            return;
        }
        
        const key = event.key || event.keyIdentifier || event.code;
        const keyCode = event.keyCode;

        const normalizedKey = this.normalizeKey(key, keyCode);

        let focusedElement = document.activeElement;
        
        // Auto-focus fallback if no screen is focused
        if (!focusedElement || !focusedElement.classList.contains("screen")) {
            const firstScreen = document.querySelector('.screen');
            if (firstScreen) {
                firstScreen.focus();
                focusedElement = firstScreen;
            } else {
                return;
            }
        }

        if (normalizedKey === "Enter" || event.key === " ") {
            event.preventDefault();
            
            // Kiểm tra nếu đang trong khoảng thời gian ngăn chặn fullscreen sau khi tải trang
            const currentTime = Date.now();
            const timeSincePageLoad = currentTime - this.pageLoadTime;
            
            if (this.preventFullscreenIfNeeded()) {
                console.log(`DEBUG: Ngăn chặn fullscreen trong ${this.PREVENT_FULLSCREEN_DURATION/1000} giây đầu tiên. Thời gian đã trôi qua: ${timeSincePageLoad/1000} giây`);
                return;
            }
            
            this.isTransitioning = true;
            
            if (this.fullscreenManager.getIsFullscreen()) {
                this.fullscreenManager.exitFullscreen();
            } else {
                console.log(`DEBUG: Cho phép fullscreen. Thời gian đã trôi qua: ${timeSincePageLoad/1000} giây`);
                this.fullscreenManager.enterFullscreen(focusedElement);
            }
            
            // Reset transition flag after animation completes
            setTimeout(() => {
                this.isTransitioning = false;
            }, 300);
            return;
        }

        if (normalizedKey === "Back") {
            if (this.fullscreenManager.getIsFullscreen()) {
                event.preventDefault();
                this.isTransitioning = true;
                this.fullscreenManager.exitFullscreen();
                
                // Reset transition flag after animation completes
                setTimeout(() => {
                    this.isTransitioning = false;
                }, 300);
            }
            return;
        }

        if (this.fullscreenManager.getIsFullscreen()) {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(normalizedKey)) {
                event.preventDefault();
                return;
            }
        }

        this.handleNavigation(normalizedKey, focusedElement, event);
    }

    normalizeKey(key, keyCode) {
        if (key) {
            const lower = String(key).toLowerCase();
            if (lower.includes("arrowup") || lower === "up") return "ArrowUp";
            if (lower.includes("arrowdown") || lower === "down") return "ArrowDown";
            if (lower.includes("arrowleft") || lower === "left") return "ArrowLeft";
            if (lower.includes("arrowright") || lower === "right") return "ArrowRight";
            if (lower === "enter" || lower === "return" || lower === "ok") return "Enter";
            if (lower === "escape" || lower === "backspace" || lower === "back" || lower === "xf86back") return "Back";
        }

        switch (keyCode) {
            case undefined:
                return null;
            default:
                return this.KEY_CODE_MAP[keyCode] || null;
        }
    }

    handleNavigation(normalizedKey, focusedElement, event) {
        let nextElementId;
        switch (normalizedKey) {
            case "ArrowUp":
                nextElementId = focusedElement.dataset.navUp;
                break;
            case "ArrowDown":
                nextElementId = focusedElement.dataset.navDown;
                break;
            case "ArrowLeft":
                nextElementId = focusedElement.dataset.navLeft;
                break;
            case "ArrowRight":
                nextElementId = focusedElement.dataset.navRight;
                break;
            default:
                return;
        }
        
        if (nextElementId) {
            event.preventDefault();
            const nextElement = document.querySelector(nextElementId);
            if (nextElement) {
                nextElement.focus();
            }
        }
    }

    preventFullscreenIfNeeded() {
        const currentTime = Date.now();
        const timeSincePageLoad = currentTime - this.pageLoadTime;
        return timeSincePageLoad < this.PREVENT_FULLSCREEN_DURATION;
    }

    setIsTransitioning(value) {
        this.isTransitioning = value;
    }

    getIsTransitioning() {
        return this.isTransitioning;
    }
}

// Export để sử dụng trong các module khác
window.KeyboardHandler = KeyboardHandler;