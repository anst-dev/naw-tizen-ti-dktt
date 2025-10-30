# Quy trình thêm màn hình chi tiết mới khi chọn từ Dashboard

Tài liệu này mô tả cách thêm “màn hình chi tiết” (detail view) mới cho một màn hình trên Dashboard, dựa theo mẫu đã có cho Chi tiết Điểm cháy (ChiTietDiemChay).

## 1) Mục tiêu
- Khi người dùng chọn một ô màn hình trên Dashboard, ứng dụng điều hướng sang `/detail` và hiển thị giao diện chi tiết tương ứng (custom view hoặc bố cục widget mặc định).
- Có thể quyết định hiển thị chi tiết theo STT (mã màn hình) hoặc theo tham số `view` truyền vào router.

## 2) Thành phần liên quan
- Router nội bộ: `src/core/Router.js`
  - Đăng ký route `/detail` và điều hướng: `router.navigate('/detail', { screen, view })`.
- Luồng điều khiển trong App: `src/core/App.js`
  - `setupRoutes()` đăng ký `/detail` → gọi `showDetailView(params)`.
  - `handleOpenDetail(detail)` lắng nghe event `openScreenDetail` và điều hướng sang `/detail`.
  - `showDetailView(params)` quyết định render giao diện chi tiết (mặc định hoặc custom).
  - Mẫu hiện có: `renderChiTietDiemChayView(detailContainer)` nạp `ChiTietDiemChay.html` qua iframe.
- Dashboard: `src/components/dashboard/DashboardGrid.js`
  - Khi click/Enter một ô: phát event `openScreenDetail` với `{ screen }` hoặc `{ stt }`.
- Khung HTML: `src/pages/index.html`
  - Các container: `#map-fullscreen-container`, `#dashboard-container`, `#detail-container`.

## 3) Luồng tổng quát khi người dùng chọn một màn hình
1. Dashboard phát `openScreenDetail` kèm theo `screen` (hoặc `stt`).
2. App lắng nghe và gọi `this.router.navigate('/detail', { screen, view? })`.
3. Router chạy handler `/detail` → `app.showDetailView(params)`.
4. `showDetailView` ẩn Map/Dashboard, hiển thị `#detail-container`.
5. Tùy `params.view` (hoặc theo `screen.STT`), App chọn render custom view hoặc layout mặc định.
6. Nút Back/phím Back quay lại Dashboard (hoặc Map) qua `navigateBack`/`router.back()`.

## 4) Các cách “chọn” giao diện chi tiết
- Theo STT: ví dụ STT=5 → hiển thị `ChiTietDiemChay`.
- Theo tham số `view`: ví dụ `view: 'myNewDetail'` → App sẽ gọi renderer tương ứng.

Khuyến nghị: ưu tiên truyền `view` để tách biệt logic UI với STT.

## 5) Các bước triển khai màn hình chi tiết mới

### Bước 1: Chuẩn bị nguồn UI cho chi tiết
- Chọn 1 trong 2 cách:
  - C1) Dùng iframe như mẫu Điểm cháy: tạo file HTML chuyên biệt (ví dụ `ChiTietBom.html`) rồi nạp qua iframe.
  - C2) Render trực tiếp DOM vào `.detail-content` (tạo `div.detail-custom-view` và thêm nội dung động).

### Bước 2: Thêm renderer cho view mới trong App
- Mở `src/core/App.js` và tạo hàm renderer tương tự `renderChiTietDiemChayView` (ví dụ `renderMyNewDetailView(detailContainer)`).
- Yêu cầu tối thiểu trong renderer:
  - Ẩn `.widget-grid` mặc định khi hiển thị custom view.
  - Tạo/hiện `#<id-view>` bên trong `.detail-content` để tái sử dụng khi điều hướng qua lại.
  - Nếu dùng iframe: tạo thẻ `iframe.detail-iframe` và set `src` tới file HTML custom.

Ví dụ khung renderer (rút gọn):

```js
renderMyNewDetailView(detailContainer) {
  const detailContent = detailContainer.querySelector('.detail-content');
  if (!detailContent) return;

  const widgetGrid = detailContent.querySelector('.widget-grid');
  if (widgetGrid) widgetGrid.style.display = 'none';

  let customView = detailContent.querySelector('#my-new-detail-view');
  if (!customView) {
    customView = document.createElement('div');
    customView.id = 'my-new-detail-view';
    customView.className = 'detail-custom-view';
    detailContent.appendChild(customView);
  }
  customView.style.display = 'block';

  let iframe = customView.querySelector('iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.className = 'detail-iframe';
    iframe.title = 'My New Detail';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    customView.appendChild(iframe);
  }

  iframe.src = 'ChiTietBom.html'; // thay bằng file của bạn
}
```

### Bước 3: Gắn logic chọn renderer trong `showDetailView`
- Sử dụng `params.view` hoặc `screen.STT` để điều hướng tới renderer mới.

Ví dụ (rút gọn, bên trong `showDetailView(params)`):

```js
const { screen = null, view = 'defaultDetail' } = params;

if (view === 'myNewDetail' || Number(screen?.STT) === 7) {
  this.renderMyNewDetailView(detailContainer);
} else if (view === 'chiTietDiemChay' || Number(screen?.STT) === 5) {
  this.renderChiTietDiemChayView(detailContainer);
} else {
  this.renderDefaultDetailView(detailContainer, screen);
}
```

### Bước 4: Phát event/điều hướng kèm `view` (khuyến nghị)
- Từ Dashboard, khi muốn mở chi tiết mới, truyền thêm `view` để App nhận biết renderer:

```js
window.dispatchEvent(new CustomEvent('openScreenDetail', {
  detail: { screen, view: 'myNewDetail' }
}));
```

- Hoặc điều hướng trực tiếp (nếu bạn chủ động gọi router):

```js
window.app.router.navigate('/detail', { screen, view: 'myNewDetail' });
```

Nếu không truyền `view`, bạn cần ánh xạ theo STT trong `showDetailView` như ở Bước 3.

### Bước 5: Ẩn/hiện đúng các container và tiêu đề
- `showDetailView` đã xử lý:
  - Ẩn Map/Dashboard, hiện `#detail-container` và thêm class `active`.
  - Set tiêu đề: `#detail-title` theo `screen.TenManHinh` nếu có.
- `hideDetailView` cần đảm bảo:
  - Ẩn custom view (`#my-new-detail-view`) khi thoát.
  - Khôi phục hiển thị `.widget-grid` cho các trường hợp dùng layout mặc định.

### Bước 6: Back/thoát chi tiết
- Nút back trong header gọi `window.app.router.back()` (index.html đã có).
- Phím Back (Tizen/PC): `NavigationManager`/`App.handleTizenKey` sẽ điều hướng về Dashboard/Map.

## 6) Ví dụ hoàn chỉnh tối thiểu

1) Tạo file giao diện, ví dụ `ChiTietBom.html` ở root (cùng cấp `ChiTietDiemChay.html`) hoặc nơi bạn mong muốn.

2) Thêm renderer vào `App`:

```js
// Trong class App
renderMyNewDetailView(detailContainer) { /* như ví dụ ở Bước 2 */ }

// Bổ sung nhánh trong showDetailView(params)
// if (view === 'myNewDetail' || Number(screen?.STT) === 7) this.renderMyNewDetailView(detailContainer);
```

3) Gọi mở chi tiết từ Dashboard (ví dụ khi click một ô có STT=7):

```js
window.dispatchEvent(new CustomEvent('openScreenDetail', {
  detail: { screen: theScreenObject, view: 'myNewDetail' }
}));
```

Hoặc để App tự suy luận theo STT, chỉ cần `detail: { screen: theScreenObject }` và ánh xạ STT trong `showDetailView`.

## 7) Kiểm thử nhanh
- Cách 1: Dùng mock data sau khi app chạy:

```js
// Trong DevTools console sau khi app init
const mockScreens = [
  { STT: 0, TenManHinh: 'M0: Bản đồ', isActive: true, LoaiManHinh: 'map' },
  { STT: 7, TenManHinh: 'M7: Chi tiết bơm', isActive: true }
];
window.app.apiService.testWithMockData(mockScreens);
window.app.router.navigate('/dashboard', { screens: mockScreens });
```

- Cách 2: Mở trực tiếp chi tiết:

```js
window.app.router.navigate('/detail', {
  screen: { STT: 7, TenManHinh: 'M7: Chi tiết bơm' },
  view: 'myNewDetail'
});
```

## 8) Checklist & lưu ý
- Không phụ thuộc cứng vào STT nếu có thể truyền `view` từ nơi phát event.
- Dọn dẹp UI khi thoát chi tiết: ẩn custom view, khôi phục `.widget-grid`.
- Tên id của custom view nên có dạng `#<ten-view>-view` để tránh trùng lặp.
- Giữ nguyên class `.detail-custom-view` và `.detail-iframe` để ăn sẵn style.
- Với iframe, đảm bảo file HTML có kích thước toàn phần và không bị scroll thanh đôi.
- Kiểm tra phím Back trên Tizen/PC và nút back trong header.
- Đảm bảo `#detail-title` được set từ `screen.TenManHinh` để nhất quán UI.

---

Tham khảo mã nguồn:
- `src/core/App.js` (routes, showDetailView, renderers)
- `src/core/Router.js` (điều hướng nội bộ)
- `src/components/dashboard/DashboardGrid.js` (phát event mở chi tiết)
- `src/pages/index.html` (cấu trúc container)