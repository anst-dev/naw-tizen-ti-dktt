async function GetReportDataNoCount(reportPath) {
    const url = "http://118.70.151.182:1223/api/services/app/Report/GetReportDataNoCount";
    const payload = {
        format: "json",
        page: 0,
        reportPath: reportPath,
        parameters: {}
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 10000); // 10 second timeout

    try {
        const res = await fetch(url, {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            let msg = `Lỗi HTTP ${res.status}`;
            if (res.status === 401) msg += " (Unauthorized — token hết hạn hoặc sai).";
            if (res.status === 403) msg += " (Forbidden — không đủ quyền).";
            throw new Error(msg);
        }

        const data = await res.json();
        const items = data.result.items;

        if (items && items.length > 0) {
            const info = items[0];
            document.getElementById('tongSoDiemChay').textContent = info.TongSoDiemChayTrongThang || 0;
            document.getElementById('soLuongDangXuLy').textContent = info.SoLuong_DangXuLy || 0;
            document.getElementById('soLuongDaXuLy').textContent = info.SoLuong_DaXuLy || 0;
            document.getElementById('infoSection').style.display = 'block';
        }

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            // Handle timeout silently
        } else {
            console.error(err);
        }
    }
}

async function postGetReportDataNoCount() {
    const url = "http://118.70.151.182:1223/api/services/app/Report/GetReportDataNoCount";
    const payload = {
        format: "json",
        page: 0,
        reportPath: "dbo.Top5DiemChaySuCo",
        parameters: {}
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 10000); // 10 second timeout

    try {
        const res = await fetch(url, {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            let msg = `Lỗi HTTP ${res.status}`;
            if (res.status === 401) msg += " (Unauthorized — token hết hạn hoặc sai).";
            if (res.status === 403) msg += " (Forbidden — không đủ quyền).";
            throw new Error(msg);
        }

        const data = await res.json();
        const items = data.result.items || [];
        
        if (items.length === 0) {
            tableBody.innerHTML = `
            <tr>
              <td colspan="3" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4m0 4h.01" stroke-linecap="round"/>
                </svg>
                <p>Không tìm thấy dữ liệu phù hợp</p>
              </td>
            </tr>
          `;
            return;
        }
        
        renderTable(items);
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            tableBody.innerHTML = `
              <tr>
                <td colspan="3" class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4m0 4h.01" stroke-linecap="round"/>
                  </svg>
                  <p>Yêu cầu hết thời gian chờ. Vui lòng thử lại.</p>
                </td>
              </tr>
            `;
        } else {
            console.error(err);
            tableBody.innerHTML = `
              <tr>
                <td colspan="3" class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6m0-6l6 6"/>
                  </svg>
                  <p>${err.message}</p>
                </td>
              </tr>
            `;
        }
    } finally {
    }
}

const statusEl = document.getElementById('status');
const tableBody = document.querySelector('#resultTable tbody');

function renderTable(data) {
    tableBody.innerHTML = '';
    data.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${item.MADON}</td>
          <td>${item.ViTriDiemChay}</td>
          <td>${item.SoDienThoaiNguoiBaoTin}</td>
          <td>${item.ThoiGianNhanCongViec}</td>
          <td>${item.NhanVienKyThuat}</td>
          <td><span class="badge">${item.TrangThaiKhacPhuc}</span></td>
        `;
        tableBody.appendChild(tr);
    });
}

async function loadData() {

    tableBody.innerHTML = '';

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Filter data if search value exists
        let filteredData = mockData;
        if (searchValue) {
            filteredData = mockData.filter(item =>
                item.maDiemChay.toLowerCase().includes(searchValue.toLowerCase()) ||
                item.viTri.toLowerCase().includes(searchValue.toLowerCase()) ||
                item.soDienThoai.includes(searchValue)
            );
        }

        if (filteredData.length === 0) {
            tableBody.innerHTML = `
            <tr>
              <td colspan="3" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4m0 4h.01" stroke-linecap="round"/>
                </svg>
                <p>Không tìm thấy dữ liệu phù hợp</p>
              </td>
            </tr>
          `;
            return;
        }

        renderTable(filteredData);
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `
          <tr>
            <td colspan="3" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6m0-6l6 6"/>
              </svg>
              <p>${err.message}</p>
            </td>
          </tr>
        `;
    } finally {
    }
}

window.addEventListener('load', async () => {
    console.log(`[DEBUG] iframe window loaded, starting data fetch`);
    const startTime = performance.now();
    
    try {
        await postGetReportDataNoCount();
        await GetReportDataNoCount('ld.InfoDiemChaySuCo');
        
        const endTime = performance.now();
        console.log(`[DEBUG] All data loaded in ${endTime - startTime}ms`);
    } catch (error) {
        console.error(`[DEBUG] Error during initial data loading:`, error);
    }
});