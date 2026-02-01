// DASHBOARD KONTROL SİSTEMİ
class Dashboard {
    constructor() {
        this.orders = [];
        this.charts = {};
        this.init();
    }
    
    async init() {
        this.checkAuthentication();
        this.loadUserData();
        await this.loadOrders();
        this.setupEventListeners();
        this.initializeCharts();
        this.setupStations();
    }
    
    checkAuthentication() {
        if (!auth.isAuthenticated()) {
            window.location.href = '../index.html';
            return;
        }
        
        const token = localStorage.getItem('auth_token');
        const validation = auth.validateToken(token);
        
        if (!validation.valid) {
            auth.logout();
        }
    }
    
    loadUserData() {
        const user = auth.getCurrentUser();
        if (user) {
            document.getElementById('sidebar-username').textContent = user.name;
            document.getElementById('sidebar-role').textContent = user.role;
            
            // Yetki kontrolleri
            if (!auth.hasPermission('view_orders')) {
                this.hideUnauthorizedSections();
            }
        }
    }
    
    hideUnauthorizedSections() {
        const unauthorizedSections = ['add-order', 'reports'];
        unauthorizedSections.forEach(section => {
            const navItem = document.querySelector(`[data-section="${section}"]`);
            if (navItem) navItem.style.display = 'none';
        });
    }
    
    async loadOrders() {
        try {
            this.orders = await OrdersAPI.getAll();
            this.displayOrders(this.orders);
            this.updateStats();
            this.updateHeaderStats();
        } catch (error) {
            console.error('Siparişler yüklenirken hata:', error);
            this.showToast('Siparişler yüklenemedi!', 'error');
        }
    }
    
    displayOrders(orders) {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderNumber || 'ORD-' + order.id}</td>
                <td>${order.customer}</td>
                <td>${order.model}</td>
                <td>${order.color}</td>
                <td>${order.quantity}</td>
                <td>${this.formatDate(order.date)}</td>
                <td><span class="status-badge status-${order.status}">${this.getStatusText(order.status)}</span></td>
                <td>${order.station || '-'}</td>
                <td>
                    <button class="btn-action" onclick="dashboard.editOrder(${order.id})" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" onclick="dashboard.deleteOrder(${order.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    getStatusText(status) {
        const statusMap = {
            'pending': 'Bekleyen',
            'production': 'Üretimde',
            'completed': 'Tamamlandı'
        };
        return statusMap[status] || status;
    }
    
    updateStats() {
        const totalOrders = this.orders.length;
        const inProgress = this.orders.filter(o => o.status === 'production').length;
        const completed = this.orders.filter(o => o.status === 'completed').length;
        const pending = this.orders.filter(o => o.status === 'pending').length;
        
        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('in-progress').textContent = inProgress;
        document.getElementById('completed').textContent = completed;
        document.getElementById('pending').textContent = pending;
    }
    
    updateHeaderStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayProduction = this.orders.filter(o => 
            o.status === 'completed' && o.date === today
        ).length;
        
        const activeOrders = this.orders.filter(o => o.status === 'production').length;
        
        document.getElementById('active-orders').textContent = activeOrders;
        document.getElementById('today-production').textContent = todayProduction;
    }
    
    initializeCharts() {
        // Production Chart
        const productionCtx = document.getElementById('production-chart');
        if (productionCtx) {
            this.charts.production = new Chart(productionCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
                    datasets: [{
                        label: 'Üretim Adedi',
                        data: [12, 19, 15, 25, 22, 18, 14],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: true
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
        
        // Station Chart
        const stationCtx = document.getElementById('station-chart');
        if (stationCtx) {
            this.charts.station = new Chart(stationCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Kesim', 'Montaj', 'Cila', 'Paketleme'],
                    datasets: [{
                        data: [30, 25, 20, 25],
                        backgroundColor: [
                            '#667eea',
                            '#11998e',
                            '#f46b45',
                            '#ff416c'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
    setupStations() {
        const stationsContainer = document.getElementById('stations-container');
        if (!stationsContainer) return;
        
        const stations = [
            { id: 1, name: 'Kesim İstasyonu', status: 'active', orders: 5 },
            { id: 2, name: 'Montaj İstasyonu', status: 'active', orders: 3 },
            { id: 3, name: 'Cila İstasyonu', status: 'inactive', orders: 0 },
            { id: 4, name: 'Paketleme İstasyonu', status: 'active', orders: 2 }
        ];
        
        stationsContainer.innerHTML = '';
        
        stations.forEach(station => {
            const stationCard = document.createElement('div');
            stationCard.className = 'station-card';
            stationCard.innerHTML = `
                <div class="station-header">
                    <h3 class="station-title">${station.name}</h3>
                    <span class="station-status status-${station.status}">
                        ${station.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                </div>
                <div class="station-info">
                    <p><i class="fas fa-clipboard-list"></i> Aktif Sipariş: ${station.orders}</p>
                </div>
                <div class="station-orders">
                    <h4>Son İşlemler:</h4>
                    <p>ORD-2024-001: Kesim tamamlandı</p>
                    <p>ORD-2024-002: Beklemede</p>
                </div>
            `;
            stationsContainer.appendChild(stationCard);
        });
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.showSection(section);
                    this.updateActiveNav(item);
                    this.updatePageTitle(item.querySelector('span').textContent);
                }
            });
        });
        
        // Search and filter
        const searchInput = document.getElementById('search-orders');
        const filterSelect = document.getElementById('filter-status');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterOrders(e.target.value, filterSelect?.value);
            });
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterOrders(searchInput?.value, e.target.value);
            });
        }
        
        // Modal close
        document.querySelector('.close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Click outside modal
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }
    
    filterOrders(searchTerm = '', statusFilter = '') {
        let filtered = this.orders;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(order =>
                order.customer.toLowerCase().includes(term) ||
                order.orderNumber.toLowerCase().includes(term) ||
                order.model.toLowerCase().includes(term)
            );
        }
        
        if (statusFilter) {
            filtered = filtered.filter(order => order.status === statusFilter);
        }
        
        this.displayOrders(filtered);
    }
    
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }
    
    updateActiveNav(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }
    
    updatePageTitle(title) {
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');
        
        if (pageTitle) pageTitle.textContent = title;
        if (pageSubtitle) pageSubtitle.textContent = `${title} paneli`;
    }
    
    openModal(content) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalBody) {
            modalBody.innerHTML = content;
            modal.style.display = 'flex';
        }
    }
    
    closeModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalBody) {
            modal.style.display = 'none';
            modalBody.innerHTML = '';
        }
    }
    
    // ORDER OPERATIONS
    async saveOrder() {
        const customer = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const model = document.getElementById('order-model').value;
        const color = document.getElementById('order-color').value;
        const quantity = parseInt(document.getElementById('order-quantity').value) || 1;
        const notes = document.getElementById('order-notes').value.trim();
        
        // Validation
        if (!customer || !model || !color || !quantity) {
            this.showToast('Lütfen zorunlu alanları doldurun!', 'warning');
            return;
        }
        
        if (quantity < 1) {
            this.showToast('Adet 1\'den küçük olamaz!', 'warning');
            return;
        }
        
        const orderData = {
            customer,
            phone,
            model,
            color,
            quantity,
            notes,
            date: new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        
        try {
            const newOrder = await OrdersAPI.create(orderData);
            this.orders.push(newOrder);
            this.displayOrders(this.orders);
            this.updateStats();
            this.updateHeaderStats();
            this.resetForm();
            this.showToast('Sipariş başarıyla eklendi!', 'success');
            
            // Switch to orders section
            this.showSection('orders');
            this.updateActiveNav(document.querySelector('[data-section="orders"]'));
        } catch (error) {
            this.showToast('Sipariş eklenirken hata oluştu!', 'error');
            console.error(error);
        }
    }
    
    resetForm() {
        const form = document.querySelector('#add-order-section');
        if (form) {
            form.querySelectorAll('input, select, textarea').forEach(element => {
                if (element.type !== 'button') {
                    element.value = '';
                }
            });
            document.getElementById('order-quantity').value = '1';
        }
    }
    
    async editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;
        
        const modalContent = `
            <h2>Sipariş Düzenle</h2>
            <div class="form-group">
                <label>Durum</label>
                <select id="edit-status" class="form-control">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Bekleyen</option>
                    <option value="production" ${order.status === 'production' ? 'selected' : ''}>Üretimde</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Tamamlandı</option>
                </select>
            </div>
            <div class="form-group">
                <label>İstasyon</label>
                <input type="text" id="edit-station" value="${order.station || ''}" class="form-control" placeholder="İstasyon adı">
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="dashboard.closeModal()">İptal</button>
                <button class="btn-primary" onclick="dashboard.updateOrder(${orderId})">Kaydet</button>
            </div>
        `;
        
        this.openModal(modalContent);
    }
    
    async updateOrder(orderId) {
        const status = document.getElementById('edit-status').value;
        const station = document.getElementById('edit-station').value.trim();
        
        try {
            await OrdersAPI.update(orderId, { status, station });
            
            // Update local data
            const orderIndex = this.orders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                this.orders[orderIndex] = { ...this.orders[orderIndex], status, station };
            }
            
            this.displayOrders(this.orders);
            this.updateStats();
            this.updateHeaderStats();
            this.closeModal();
            this.showToast('Sipariş güncellendi!', 'success');
        } catch (error) {
            this.showToast('Güncelleme başarısız!', 'error');
            console.error(error);
        }
    }
    
    async deleteOrder(orderId) {
        if (!confirm('Bu siparişi silmek istediğinize emin misiniz?')) {
            return;
        }
        
        try {
            await OrdersAPI.delete(orderId);
            this.orders = this.orders.filter(o => o.id !== orderId);
            this.displayOrders(this.orders);
            this.updateStats();
            this.updateHeaderStats();
            this.showToast('Sipariş silindi!', 'success');
        } catch (error) {
            this.showToast('Silme işlemi başarısız!', 'error');
            console.error(error);
        }
    }
    
    async importFromExcel() {
        const excelInput = document.getElementById('excel-input');
        if (!excelInput || !excelInput.value.trim()) {
            this.showToast('Excel verisi girin!', 'warning');
            return;
        }
        
        const lines = excelInput.value.trim().split('\n');
        let importedCount = 0;
        let errorCount = 0;
        
        for (let i = 1; i < lines.length; i++) { // Skip header
            const [customer, model, color, quantity] = lines[i].split(',');
            
            if (customer && model && color && quantity) {
                try {
                    const orderData = {
                        customer: customer.trim(),
                        model: model.trim(),
                        color: color.trim(),
                        quantity: parseInt(quantity.trim()),
                        date: new Date().toISOString().split('T')[0],
                        status: 'pending'
                    };
                    
                    const newOrder = await OrdersAPI.create(orderData);
                    this.orders.push(newOrder);
                    importedCount++;
                } catch (error) {
                    errorCount++;
                    console.error(`Satır ${i + 1} hata:`, error);
                }
            }
        }
        
        excelInput.value = '';
        this.displayOrders(this.orders);
        this.updateStats();
        this.updateHeaderStats();
        
        if (importedCount > 0) {
            this.showToast(`${importedCount} sipariş başarıyla eklendi!`, 'success');
        }
        if (errorCount > 0) {
            this.showToast(`${errorCount} sipariş eklenirken hata oluştu!`, 'warning');
        }
    }
    
    // UTILITIES
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 5000);
        
        // Add slide out animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes toastSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    refreshData() {
        this.loadOrders();
        this.showToast('Veriler yenilendi!', 'success');
    }
    
    exportData() {
        const dataStr = JSON.stringify(this.orders, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `siparisler_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Veriler dışa aktarıldı!', 'success');
    }
}

// GLOBAL DASHBOARD INSTANCE
let dashboard;

// GLOBAL FUNCTIONS
function logout() {
    auth.logout();
}

function refreshData() {
    if (dashboard) dashboard.refreshData();
}

function exportData() {
    if (dashboard) dashboard.exportData();
}

function saveOrder() {
    if (dashboard) dashboard.saveOrder();
}

function resetForm() {
    if (dashboard) dashboard.resetForm();
}

function importFromExcel() {
    if (dashboard) dashboard.importFromExcel();
}

function addStation() {
    if (dashboard) {
        dashboard.showToast('Yeni istasyon ekleme özelliği aktif değil!', 'warning');
    }
}

function generateDailyReport() {
    if (dashboard) {
        dashboard.showToast('Günlük rapor oluşturuluyor...', 'info');
    }
}

function generateMonthlyReport() {
    if (dashboard) {
        dashboard.showToast('Aylık rapor oluşturuluyor...', 'info');
    }
}

// INITIALIZE DASHBOARD
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});