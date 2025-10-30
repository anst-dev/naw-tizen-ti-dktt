class FirePointWidget {
    constructor(containerId, props = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.props = props;
        
        // State management (like React state)
        this.state = {
            data: [
                { id: 1, content: "Số lượng điểm cháy trong tháng", value: null },
                { id: 2, content: "Số lượng điểm cháy đang xử lý", value: null },
                { id: 3, content: "Số lượng điểm cháy đã xử lý", value: null },
                { id: 4, content: "Số lượng điểm cháy nghe do trong tháng", value: null },
                { id: 5, content: "Số lượng vị trí điểm đang nghe đo", value: null }
            ],
            loading: false,
            error: null
        };
        
        this.init();
    }
    
    // Lifecycle: Component mount
    init() {
        this.render();
        this.attachEventListeners();
    }
    
    // Render method (like React render)
    render() {
        const content = this.container.querySelector('.screen-content') || this.createContentWrapper();
        content.innerHTML = this.template();
    }
    
    // Template method (like JSX)
    template() {
        return `
            <table class="fire-stats-table">
                <thead>
                    <tr>
                        <th>TT</th>
                        <th>Nội dung</th>
                        <th>Giá trị</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.state.data.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.content}</td>
                            <td>${item.value !== null ? item.value : '--'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${this.state.loading ? '<div class="loading">Đang tải...</div>' : ''}
            ${this.state.error ? `<div class="error">${this.state.error}</div>` : ''}
        `;
    }
    
    // State update (like setState)
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
    
    // Update data from API
    updateData(apiData) {
        const updatedData = this.state.data.map(item => ({
            ...item,
            value: apiData[item.id] || item.value
        }));
        this.setState({ data: updatedData, loading: false });
    }
    
    // Event listeners
    attachEventListeners() {
        // Can add custom events here
    }
    
    // Lifecycle: Component unmount
    destroy() {
        // Cleanup if needed
    }
    
    createContentWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = 'fire-point-widget';
        this.container.appendChild(wrapper);
        return wrapper;
    }
}
