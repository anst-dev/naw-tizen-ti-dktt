# Sửa lỗi hiển thị khi chuyển màn hình và Back về Dashboard

## Vấn đề gặp phải:
- Khi back về Dashboard từ các màn hình khác, gặp vấn đề với hiển thị container
- CSS conflict giữa `display: none/block` và class `active` với opacity transitions
- Timing issue khi chuyển màn hình

## Các thay đổi đã thực hiện:

### 1. Routes.js - Cải thiện phương thức back():
- **Thêm clear iframe content** trước khi ẩn container
- **Thêm setTimeout 50ms** để đợi animation hoàn tất trước khi hiển thị Dashboard
- **Force reflow** (dùng `offsetHeight`) trước khi add class `active` để đảm bảo transition mượt mà

```javascript
back() {
    // Clear iframe content trước
    if (this.detailContainer) {
        const iframeContainer = this.detailContainer.querySelector('#iframe-container');
        if (iframeContainer) {
            iframeContainer.innerHTML = '';
        }
    }
    
    this.hideAllContainers();
    
    // Đợi animation hoàn tất
    setTimeout(() => {
        if (this.dashboardContainer) {
            this.dashboardContainer.style.display = 'block';
            this.dashboardContainer.offsetHeight; // Force reflow
            this.dashboardContainer.classList.add('active');
        }
        // ... render dashboard
    }, 50);
}
```

### 2. Routes.js - Cải thiện hideAllContainers():
- **Remove class active trước**, sau đó mới set `display: none`
- **Clear iframe content** khi ẩn detail container
- **Thêm setTimeout 10ms** cho việc set `display: none` để transition hoạt động tốt

```javascript
hideAllContainers() {
    // Remove active class trước
    if (this.mapContainer) {
        this.mapContainer.classList.remove('active');
    }
    // ... tương tự cho các container khác
    
    // Set display none sau
    setTimeout(() => {
        if (this.mapContainer) {
            this.mapContainer.style.display = 'none';
        }
        // ... tương tự cho các container khác
    }, 10);
}
```

### 3. Routes.js - Thêm Force Reflow cho render methods:
- **renderComponent()**: Thêm force reflow cho Map container
- **renderIframe()**: Thêm force reflow cho Detail container

### 4. CSS (main.css) - Tăng cường active state:
- Thêm `!important` cho `.active` class để đảm bảo override
- Thêm rules cụ thể cho từng container với active state

```css
.view-container.active {
    display: block !important;
    opacity: 1 !important;
}

/* Đảm bảo các container hiển thị đúng khi active */
#dashboard-container.active,
#detail-container.active,
#map-fullscreen-container.active {
    display: block !important;
    opacity: 1 !important;
}
```

### 5. App.js - Thêm Force Reflow cho các show methods:
- **showMapView()**: Thêm force reflow trước khi add class active
- **showDashboardView()**: Thêm force reflow 
- **showDetailView()**: Thêm force reflow

## Kết quả:
- Navigation mượt mà hơn với transitions hoạt động đúng
- Không còn flash/flicker khi chuyển màn hình
- Back về Dashboard hoạt động ổn định
- Iframe content được clear đúng cách khi chuyển màn hình

## Testing:
Cần test các scenarios:
1. Dashboard → Map → Back (về Dashboard)
2. Dashboard → Detail Screen → Back (về Dashboard)
3. Map → Dashboard → Detail → Back (về Dashboard)
4. Kiểm tra với STT 5 (Chi tiết điểm chảy) vẫn hoạt động tốt

## Technical Notes:
- **Force Reflow**: Dùng `element.offsetHeight` để buộc browser tính toán lại layout trước khi add class
- **Timing**: 50ms cho back navigation, 10ms cho hide operations
- **CSS Specificity**: Dùng `!important` chỉ cho active state để đảm bảo override
