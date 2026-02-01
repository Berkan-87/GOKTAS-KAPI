// STOK TAKİP SİSTEMİ
class StockSystem {
    constructor() {
        this.stockItems = [];
        this.models = [];
        this.movements = [];
        this.alerts = [];
        this.init();
    }
    
    async init() {
        this.checkAuthentication();
        this.loadUserData();
        await this.loadStockData();
        await this.loadModels();
        await this.loadMovements();
        await this.loadAlerts();
        this.setupEventListeners();
        this.updateStatistics();
    }
    
    checkAuthentication() {
        if (!auth.isAuthenticated()) {
            window.location.href = '../index.html';
            return;
        }
        
        const user = auth.getCurrentUser();
        if (!auth.hasPermission('view_stock')) {
            this.showToast('Stok görüntüleme yetkiniz yok!', 'error');
            setTimeout(() => window.location.href = '../dashboard/index.html', 2000);
        }
    }
    
    loadUserData() {
        const user = auth.getCurrentUser();
        if (user) {
            document.getElementById('sidebar-username').textContent = user.name;
            document.getElementById('sidebar-role').textContent = user.role;
        }
    }
    
    async loadStockData() {
        try {
            this.stockItems = await StockAPI.getAll();
            this.renderStockTable();
            this.populateModelFilter();
        } catch (error) {
            console.error('Stok verileri yüklenirken hata:', error);
            this.showToast('Stok verileri yüklenemedi!', 'error');
        }
    }
    
    async loadModels() {
        try {
            // Models API'den modelleri çek
            const localModels = localStorage.getItem('door_models');
            if (localModels) {
                this.models = JSON.parse(localModels);
            } else {
                // Fallback: Örnek model verisi
                this.models = [
                    { id: 1, code: '606', name: 'Klasik Panel Kapı', colors: ['Beyaz', 'Ceviz', 'Meşe'] },
                    { id: 2, code: '707', name: 'Modern Panel Kapı', colors: ['Beyaz', 'Siyah', 'Gri'] },
                    { id: 3, code: '808', name: 'Lüks Panel Kapı', colors: ['Ceviz', 'Meşe', 'Kiraz'] }
                ];
                localStorage.setItem('door_models', JSON.stringify(this.models));
            }
            
            this.renderModels();
        } catch (error) {
            console.error('Modeller yüklenirken hata:', error);
        }
    }
    
    async loadMovements() {
        try {
            const localMovements = localStorage.getItem('stock_movements');
            if (localMovements) {
                this.movements = JSON.parse(localMovements);
            }
            this.renderMovements();
        } catch (error) {
            console.error('Hareketler yüklenirken hata:', error);
        }
    }
    
    async loadAlerts() {
        try {
            const localAlerts = localStorage.getItem('stock_alerts');
            if (localAlerts) {
                this.alerts = JSON.parse(localAlerts);
            } else {
                // Generate sample alerts based on stock levels
                this.generateAlerts();
            }
            this.renderAlerts();
        } catch (error) {
            console.error('Uyarılar yüklenirken hata:', error);
        }
    }
    
    generateAlerts() {
        this.alerts = [];
        const today = new Date().toISOString().split('T')[0];
        
        this.stockItems.forEach(item => {
            if (item.currentStock <= item.criticalStock) {
                this.alerts.push({
                    id: Date.now() + Math.random(),
                    type: 'critical',
                    title: 'Kritik Stok Seviyesi',
                    message: `${item.model} - ${item.color} modeli kritik stok seviyesinde (${item.currentStock} adet)`,
                    productId: item.id,
                    date: today,
                    read: false
                });
            } else if (item.currentStock <= item.minStock) {
                this.alerts.push({
                    id: Date.now() + Math.random(),
                    type: 'warning',
                    title: 'Düşük Stok Seviyesi',
                    message: `${item.model} - ${item.color} modeli düşük stok seviyesinde (${item.currentStock} adet)`,
                    productId: item.id,
                    date: today,
                    read: false
                });
            }
        });
        
        localStorage.setItem('stock_alerts', JSON.stringify(this.alerts));
    }
    
    renderStockTable() {
        const tbody = document.getElementById('stock-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.stockItems.forEach(item => {
            const status = this.getStockStatus(item);
            const statusText = this.getStatusText(status);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <strong>${item.model}</strong>
                    <br><small>${item.name || ''}</small>
                </td>
                <td>${item.color}</td>
                <td class="${status === 'critical' || status === 'out' ? 'text-danger' : ''}">
                    <strong>${item.currentStock}</strong>
                </td>
                <td>${item.minStock}</td>
                <td>${item.criticalStock || Math.floor(item.minStock * 0.5)}</td>
                <td>${item.pendingOrders || 0}</td>
                <td><span class="stock-status status-${status}">${statusText}</span></td>
                <td>${item.location || 'Ana Depo'}</td>
                <td>${this.formatDate(item.lastUpdated)}</td>
                <td>
                    <div class="stock-actions">
                        <button class="btn-stock-action btn-stock-in" onclick="stockSystem.adjustStock(${item.id}, 'in')" title="Stok Girişi">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn-stock-action btn-stock-out" onclick="stockSystem.adjustStock(${item.id}, 'out')" title="Stok Çıkışı">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="btn-stock-action btn-stock-edit" onclick="stockSystem.editStockItem(${item.id})" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    getStockStatus(item) {
        if (item.currentStock <= 0) return 'out';
        if (item.currentStock <= (item.criticalStock || Math.floor(item.minStock * 0.3))) return 'critical';
        if (item.currentStock <= item.minStock) return 'low';
        return 'sufficient';
    }
    
    getStatusText(status) {
        const statusMap = {
            'sufficient': 'Yeterli',
            'low': 'Az',
            'critical': 'Kritik',
            'out': 'Tükenmiş'
        };
        return statusMap[status] || status;
    }
    
    renderModels() {
        const container = document.getElementById('models-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.models.forEach(model => {
            const modelCard = document.createElement('div');
            modelCard.className = 'model-card';
            modelCard.innerHTML = `
                <div class="model-header">
                    <div>
                        <h3 class="model-code">${model.code}</h3>
                        <p class="model-name">${model.name}</p>
                    </div>
                    <span class="badge bg-primary">${model.colors.length} Renk</span>
                </div>
                <div class="model-info">
                    <p><strong>Stok Durumu:</strong></p>
                    <div class="model-stats">
                        ${this.getModelStockStats(model.code)}
                    </div>
                </div>
                <div class="model-variants">
                    ${model.colors.map(color => `
                        <span class="variant-badge">${color}</span>
                    `).join('')}
                </div>
                <div class="model-actions">
                    <button class="btn-secondary" onclick="stockSystem.editModel(${model.id})">Düzenle</button>
                </div>
            `;
            container.appendChild(modelCard);
        });
    }
    
    getModelStockStats(modelCode) {
        const modelItems = this.stockItems.filter(item => item.model === modelCode);
        let stats = '';
        
        modelItems.forEach(item => {
            const status = this.getStockStatus(item);
            stats += `
                <div class="model-color-stat">
                    <span>${item.color}:</span>
                    <span class="${status === 'critical' || status === 'out' ? 'text-danger' : ''}">
                        ${item.currentStock} adet
                    </span>
                </div>
            `;
        });
        
        return stats || '<p>Stok bilgisi bulunamadı</p>';
    }
    
    renderMovements() {
        const tbody = document.getElementById('movements-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.movements.forEach(movement => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(movement.date)}</td>
                <td>${movement.product}</td>
                <td>
                    <span class="badge ${this.getMovementBadgeClass(movement.type)}">
                        ${this.getMovementTypeText(movement.type)}
                    </span>
                </td>
                <td class="${movement.type === 'in' ? 'text-success' : 'text-danger'}">
                    ${movement.type === 'in' ? '+' : '-'}${movement.quantity}
                </td>
                <td>${movement.previousStock}</td>
                <td>${movement.newStock}</td>
                <td>${movement.user || 'Sistem'}</td>
                <td>${movement.note || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    getMovementBadgeClass(type) {
        const classes = {
            'in': 'bg-success',
            'out': 'bg-danger',
            'adjust': 'bg-warning'
        };
        return classes[type] || 'bg-secondary';
    }
    
    getMovementTypeText(type) {
        const texts = {
            'in': 'Giriş',
            'out': 'Çıkış',
            'adjust': 'Düzeltme'
        };
        return texts[type] || type;
    }
    
    renderAlerts() {
        const container = document.getElementById('alerts-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item alert-${alert.type} ${alert.read ? '' : 'unread'}`;
            alertItem.onclick = () => this.markAlertAsRead(alert.id);
            
            alertItem.innerHTML = `
                <div class="alert-icon">
                    <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${this.formatDate(alert.date)}</div>
                </div>
                ${!alert.read ? '<span class="badge bg-danger">Yeni</span>' : ''}
            `;
            container.appendChild(alertItem);
        });
    }
    
    getAlertIcon(type) {
        const icons = {
            'critical': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'bell';
    }
    
    populateModelFilter() {
        const filter = document.getElementById('filter-model');
        if (!filter) return;
        
        const uniqueModels = [...new Set(this.stockItems.map(item => item.model))];
        
        uniqueModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            filter.appendChild(option);
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
                }
            });
        });
        
        // Filters
        const searchInput = document.getElementById('search-stock');
        const modelFilter = document.getElementById('filter-model');
        const colorFilter = document.getElementById('filter-color');
        const statusFilter = document.getElementById('filter-status');
        
        const applyFilters = () => {
            const filters = {
                search: searchInput?.value.toLowerCase() || '',
                model: modelFilter?.value || '',
                color: colorFilter?.value || '',
                status: statusFilter?.value || ''
            };
            this.applyStockFilters(filters);
        };
        
        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (modelFilter) modelFilter.addEventListener('change', applyFilters);
        if (colorFilter) colorFilter.addEventListener('change', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        
        // Modal close
        document.querySelector('.close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });
    }
    
    applyStockFilters(filters) {
        const filtered = this.stockItems.filter(item => {
            // Search filter
            if (filters.search && !(
                item.model.toLowerCase().includes(filters.search) ||
                item.color.toLowerCase().includes(filters.search) ||
                item.name?.toLowerCase().includes(filters.search)
            )) {
                return false;
            }
            
            // Model filter
            if (filters.model && item.model !== filters.model) {
                return false;
            }
            
            // Color filter
            if (filters.color && item.color !== filters.color) {
                return false;
            }
            
            // Status filter
            if (filters.status) {
                const status = this.getStockStatus(item);
                if (status !== filters.status) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.renderFilteredStock(filtered);
    }
    
    renderFilteredStock(filteredItems) {
        const tbody = document.getElementById('stock-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        filteredItems.forEach(item => {
            const status = this.getStockStatus(item);
            const statusText = this.getStatusText(status);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.model}</strong></td>
                <td>${item.color}</td>
                <td class="${status === 'critical' || status === 'out' ? 'text-danger' : ''}">
                    <strong>${item.currentStock}</strong>
                </td>
                <td>${item.minStock}</td>
                <td>${item.criticalStock || Math.floor(item.minStock * 0.5)}</td>
                <td>${item.pendingOrders || 0}</td>
                <td><span class="stock-status status-${status}">${statusText}</span></td>
                <td>${item.location || 'Ana Depo'}</td>
                <td>${this.formatDate(item.lastUpdated)}</td>
                <td>
                    <div class="stock-actions">
                        <button class="btn-stock-action btn-stock-in" onclick="stockSystem.adjustStock(${item.id}, 'in')">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn-stock-action btn-stock-out" onclick="stockSystem.adjustStock(${item.id}, 'out')">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="btn-stock-action btn-stock-edit" onclick="stockSystem.editStockItem(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
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
            document.getElementById('page-title').textContent = 
                targetSection.querySelector('h2')?.textContent || 'Stok Takip';
        }
    }
    
    updateActiveNav(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }
    
    updateStatistics() {
        const totalStock = this.stockItems.reduce((sum, item) => sum + item.currentStock, 0);
        const totalProducts = new Set(this.stockItems.map(item => `${item.model}-${item.color}`)).size;
        
        const sufficient = this.stockItems.filter(item => this.getStockStatus(item) === 'sufficient').length;
        const low = this.stockItems.filter(item => this.getStockStatus(item) === 'low').length;
        const critical = this.stockItems.filter(item => this.getStockStatus(item) === 'critical').length;
        const out = this.stockItems.filter(item => this.getStockStatus(item) === 'out').length;
        
        // Update header stats
        document.getElementById('total-stock-value').textContent = totalStock;
        document.getElementById('critical-items').textContent = critical + out;
        
        // Update overview stats
        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('sufficient-stock').textContent = sufficient;
        document.getElementById('low-stock').textContent = low;
        document.getElementById('out-of-stock').textContent = out;
    }
    
    // STOCK OPERATIONS
    async adjustStock(itemId, action) {
        const item = this.stockItems.find(i => i.id === itemId);
        if (!item) return;
        
        const modalContent = `
            <h2>Stok ${action === 'in' ? 'Girişi' : 'Çıkışı'}</h2>
            <div class="form-group">
                <label>Ürün: ${item.model} - ${item.color}</label>
            </div>
            <div class="form-group">
                <label>Mevcut Stok: ${item.currentStock}</label>
            </div>
            <div class="form-group">
                <label>${action === 'in' ? 'Giriş' : 'Çıkış'} Miktarı *</label>
                <input type="number" id="adjust-amount" min="1" value="1" class="form-control">
            </div>
            <div class="form-group">
                <label>Not</label>
                <textarea id="adjust-note" class="form-control" placeholder="Açıklama..."></textarea>
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="stockSystem.closeModal()">İptal</button>
                <button class="btn-primary" onclick="stockSystem.confirmAdjustment(${itemId}, '${action}')">
                    Onayla
                </button>
            </div>
        `;
        
        this.openModal(modalContent);
    }
    
    async confirmAdjustment(itemId, action) {
        const amount = parseInt(document.getElementById('adjust-amount').value) || 0;
        const note = document.getElementById('adjust-note').value.trim();
        
        if (amount <= 0) {
            this.showToast('Geçerli bir miktar girin!', 'warning');
            return;
        }
        
        const item = this.stockItems.find(i => i.id === itemId);
        if (!item) return;
        
        const adjustment = action === 'in' ? amount : -amount;
        
        if (action === 'out' && item.currentStock < amount) {
            this.showToast('Yeterli stok bulunmuyor!', 'error');
            return;
        }
        
        try {
            // Update stock
            const updatedItem = await StockAPI.updateStock(itemId, adjustment);
            
            // Update local data
            const itemIndex = this.stockItems.findIndex(i => i.id === itemId);
            if (itemIndex !== -1) {
                this.stockItems[itemIndex] = updatedItem;
                this.stockItems[itemIndex].lastUpdated = new Date().toISOString().split('T')[0];
            }
            
            // Record movement
            const user = auth.getCurrentUser();
            const movement = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                product: `${item.model} - ${item.color}`,
                type: action === 'in' ? 'in' : 'out',
                quantity: amount,
                previousStock: item.currentStock,
                newStock: item.currentStock + adjustment,
                user: user?.name || 'Sistem',
                note: note
            };
            
            this.movements.unshift(movement);
            localStorage.setItem('stock_movements', JSON.stringify(this.movements));
            
            // Regenerate alerts
            this.generateAlerts();
            
            // Update UI
            this.renderStockTable();
            this.renderMovements();
            this.renderAlerts();
            this.updateStatistics();
            this.closeModal();
            
            this.showToast(`Stok ${action === 'in' ? 'girişi' : 'çıkışı'} başarılı!`, 'success');
        } catch (error) {
            this.showToast('İşlem başarısız!', 'error');
            console.error(error);
        }
    }
    
    async editStockItem(itemId) {
        const item = this.stockItems.find(i => i.id === itemId);
        if (!item) return;
        
        const modalContent = `
            <h2>Stok Ürününü Düzenle</h2>
            <div class="form-row">
                <div class="form-group">
                    <label>Model *</label>
                    <input type="text" id="edit-model" value="${item.model}" class="form-control">
                </div>
                <div class="form-group">
                    <label>Renk *</label>
                    <input type="text" id="edit-color" value="${item.color}" class="form-control">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Mevcut Stok *</label>
                    <input type="number" id="edit-current" value="${item.currentStock}" min="0" class="form-control">
                </div>
                <div class="form-group">
                    <label>Minimum Stok *</label>
                    <input type="number" id="edit-min" value="${item.minStock}" min="1" class="form-control">
                </div>
            </div>
            <div class="form-group">
                <label>Konum</label>
                <input type="text" id="edit-location" value="${item.location || ''}" class="form-control" placeholder="Depo konumu">
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="stockSystem.closeModal()">İptal</button>
                <button class="btn-primary" onclick="stockSystem.updateStockItem(${itemId})">Kaydet</button>
            </div>
        `;
        
        this.openModal(modalContent);
    }
    
    async updateStockItem(itemId) {
        const model = document.getElementById('edit-model').value.trim();
        const color = document.getElementById('edit-color').value.trim();
        const currentStock = parseInt(document.getElementById('edit-current').value) || 0;
        const minStock = parseInt(document.getElementById('edit-min').value) || 1;
        const location = document.getElementById('edit-location').value.trim();
        
        if (!model || !color || currentStock < 0 || minStock < 1) {
            this.showToast('Geçerli değerler girin!', 'warning');
            return;
        }
        
        const itemIndex = this.stockItems.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;
        
        const oldStock = this.stockItems[itemIndex].currentStock;
        const adjustment = currentStock - oldStock;
        
        if (adjustment !== 0) {
            try {
                await StockAPI.updateStock(itemId, adjustment);
                
                // Record adjustment movement
                const user = auth.getCurrentUser();
                const movement = {
                    id: Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    product: `${model} - ${color}`,
                    type: 'adjust',
                    quantity: Math.abs(adjustment),
                    previousStock: oldStock,
                    newStock: currentStock,
                    user: user?.name || 'Sistem',
                    note: 'Manuel düzeltme'
                };
                
                this.movements.unshift(movement);
                localStorage.setItem('stock_movements', JSON.stringify(this.movements));
            } catch (error) {
                console.error('Stok güncelleme hatası:', error);
            }
        }
        
        // Update local data
        this.stockItems[itemIndex] = {
            ...this.stockItems[itemIndex],
            model,
            color,
            currentStock,
            minStock,
            location,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        localStorage.setItem('stock', JSON.stringify(this.stockItems));
        
        // Regenerate alerts
        this.generateAlerts();
        
        // Update UI
        this.renderStockTable();
        this.renderMovements();
        this.renderAlerts();
        this.updateStatistics();
        this.closeModal();
        
        this.showToast('Stok ürünü güncellendi!', 'success');
    }
    
    async addStockItem() {
        const modalContent = `
            <h2>Yeni Stok Ürünü Ekle</h2>
            <div class="form-row">
                <div class="form-group">
                    <label>Model *</label>
                    <select id="new-model" class="form-control">
                        <option value="">Seçiniz</option>
                        ${this.models.map(model => 
                            `<option value="${model.code}">${model.code} - ${model.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Renk *</label>
                    <input type="text" id="new-color" class="form-control" placeholder="Renk">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Başlangıç Stoku *</label>
                    <input type="number" id="new-stock" value="0" min="0" class="form-control">
                </div>
                <div class="form-group">
                    <label>Minimum Stok *</label>
                    <input type="number" id="new-min" value="10" min="1" class="form-control">
                </div>
            </div>
            <div class="form-group">
                <label>Konum</label>
                <input type="text" id="new-location" class="form-control" placeholder="Depo konumu">
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="stockSystem.closeModal()">İptal</button>
                <button class="btn-primary" onclick="stockSystem.saveNewStockItem()">Kaydet</button>
            </div>
        `;
        
        this.openModal(modalContent);
    }
    
    async saveNewStockItem() {
        const model = document.getElementById('new-model').value.trim();
        const color = document.getElementById('new-color').value.trim();
        const currentStock = parseInt(document.getElementById('new-stock').value) || 0;
        const minStock = parseInt(document.getElementById('new-min').value) || 1;
        const location = document.getElementById('new-location').value.trim();
        
        if (!model || !color || currentStock < 0 || minStock < 1) {
            this.showToast('Geçerli değerler girin!', 'warning');
            return;
        }
        
        const newItem = {
            id: Date.now(),
            model,
            color,
            currentStock,
            minStock,
            criticalStock: Math.floor(minStock * 0.3),
            pendingOrders: 0,
            location: location || 'Ana Depo',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        this.stockItems.push(newItem);
        localStorage.setItem('stock', JSON.stringify(this.stockItems));
        
        // Record initial stock movement
        const user = auth.getCurrentUser();
        const movement = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            product: `${model} - ${color}`,
            type: 'in',
            quantity: currentStock,
            previousStock: 0,
            newStock: currentStock,
            user: user?.name || 'Sistem',
            note: 'İlk stok girişi'
        };
        
        this.movements.unshift(movement);
        localStorage.setItem('stock_movements', JSON.stringify(this.movements));
        
        // Regenerate alerts
        this.generateAlerts();
        
        // Update UI
        this.renderStockTable();
        this.renderMovements();
        this.renderAlerts();
        this.updateStatistics();
        this.populateModelFilter();
        this.closeModal();
        
        this.showToast('Yeni stok ürünü eklendi!', 'success');
    }
    
    async editModel(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;
        
        const modalContent = `
            <h2>Model Düzenle</h2>
            <div class="form-group">
                <label>Model Kodu *</label>
                <input type="text" id="edit-model-code" value="${model.code}" class="form-control">
            </div>
            <div class="form-group">
                <label>Model Adı *</label>
                <input type="text" id="edit-model-name" value="${model.name}" class="form-control">
            </div>
            <div class="form-group">
                <label>Renkler (virgülle ayırın)</label>
                <input type="text" id="edit-model-colors" value="${model.colors.join(', ')}" class="form-control">
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="stockSystem.closeModal()">İptal</button>
                <button class="btn-primary" onclick="stockSystem.updateModel(${modelId})">Kaydet</button>
            </div>
        `;
        
        this.openModal(modalContent);
    }
    
    async updateModel(modelId) {
        const code = document.getElementById('edit-model-code').value.trim();
        const name = document.getElementById('edit-model-name').value.trim();
        const colors = document.getElementById('edit-model-colors').value
            .split(',')
            .map(c => c.trim())
            .filter(c => c);
        
        if (!code || !name || colors.length === 0) {
            this.showToast('Geçerli değerler girin!', 'warning');
            return;
        }
        
        const modelIndex = this.models.findIndex(m => m.id === modelId);
        if (modelIndex !== -1) {
            this.models[modelIndex] = { ...this.models[modelIndex], code, name, colors };
            localStorage.setItem('door_models', JSON.stringify(this.models));
            this.renderModels();
            this.closeModal();
            this.showToast('Model güncellendi!', 'success');
        }
    }
    
    async addModel() {
        const modalContent = `
            <h2>Yeni Model Ekle</h2>
            <div class="form-group">
                <label>Model Kodu *</label>
                <input type="text" id="new-model-code" class="form-control" placeholder="örn: 909">
            </div>
            <div class="form-group">
                <label>Model Adı *</label>
                <input type="text" id="new-model-name" class="form-control" placeholder="örn: Premium Kapı">
            </div>
            <div class="form-group">
                <label>Renkler (virgülle ayırın) *</label>
                <input type="text" id="new-model-colors" class="form-control" placeholder="örn: Beyaz, Siyah, Ceviz">
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="stockSystem.closeModal()">İptal</button>
                <button class="btn-primary" onclick="stockSystem.saveNewModel()">Kaydet</button>
            </div>
        `;
        
        this.openModal(modalContent);
    }
    
    async saveNewModel() {
        const code = document.getElementById('new-model-code').value.trim();
        const name = document.getElementById('new-model-name').value.trim();
        const colors = document.getElementById('new-model-colors').value
            .split(',')
            .map(c => c.trim())
            .filter(c => c);
        
        if (!code || !name || colors.length === 0) {
            this.showToast('Geçerli değerler girin!', 'warning');
            return;
        }
        
        const newModel = {
            id: Date.now(),
            code,
            name,
            colors
        };
        
        this.models.push(newModel);
        localStorage.setItem('door_models', JSON.stringify(this.models));
        this.renderModels();
        this.closeModal();
        this.showToast('Yeni model eklendi!', 'success');
    }
    
    markAlertAsRead(alertId) {
        const alertIndex = this.alerts.findIndex(a => a.id === alertId);
        if (alertIndex !== -1) {
            this.alerts[alertIndex].read = true;
            localStorage.setItem('stock_alerts', JSON.stringify(this.alerts));
            this.renderAlerts();
        }
    }
    
    markAllAsRead() {
        this.alerts.forEach(alert => alert.read = true);
        localStorage.setItem('stock_alerts', JSON.stringify(this.alerts));
        this.renderAlerts();
        this.showToast('Tüm uyarılar okundu olarak işaretlendi!', 'success');
    }
    
    // MODAL UTILITIES
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
    
    // UTILITIES
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
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
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 5000);
        
        // Add slide out animation if not exists
        if (!document.getElementById('toast-animation-style')) {
            const style = document.createElement('style');
            style.id = 'toast-animation-style';
            style.textContent = `
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
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
    
    async refreshStock() {
        await this.loadStockData();
        await this.loadAlerts();
        this.showToast('Stok verileri yenilendi!', 'success');
    }
    
    exportStock() {
        const dataStr = JSON.stringify(this.stockItems, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `stok_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Stok verileri dışa aktarıldı!', 'success');
    }
    
    generateDailyStockReport() {
        this.showToast('Günlük stok raporu oluşturuluyor...', 'info');
        // Implement report generation
    }
    
    generateMonthlyInventory() {
        this.showToast('Aylık envanter raporu oluşturuluyor...', 'info');
        // Implement report generation
    }
    
    generateCriticalStockReport() {
        const criticalItems = this.stockItems.filter(item => 
            this.getStockStatus(item) === 'critical' || this.getStockStatus(item) === 'out'
        );
        
        if (criticalItems.length === 0) {
            this.showToast('Kritik stok bulunmuyor!', 'info');
            return;
        }
        
        let report = 'KRİTİK STOK RAPORU\n';
        report += '====================\n\n';
        
        criticalItems.forEach(item => {
            const status = this.getStockStatus(item);
            report += `Model: ${item.model} - ${item.color}\n`;
            report += `Mevcut Stok: ${item.currentStock}\n`;
            report += `Minimum Stok: ${item.minStock}\n`;
            report += `Durum: ${this.getStatusText(status)}\n`;
            report += `Konum: ${item.location || 'Ana Depo'}\n`;
            report += '-----------------\n';
        });
        
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kritik_stok_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        this.showToast('Kritik stok raporu oluşturuldu!', 'success');
    }
}

// GLOBAL STOCK SYSTEM INSTANCE
let stockSystem;

// GLOBAL FUNCTIONS
function logout() {
    auth.logout();
}

function refreshStock() {
    if (stockSystem) stockSystem.refreshStock();
}

function exportStock() {
    if (stockSystem) stockSystem.exportStock();
}

function addStockItem() {
    if (stockSystem) stockSystem.addStockItem();
}

function addModel() {
    if (stockSystem) stockSystem.addModel();
}

function markAllAsRead() {
    if (stockSystem) stockSystem.markAllAsRead();
}

function generateDailyStockReport() {
    if (stockSystem) stockSystem.generateDailyStockReport();
}

function generateMonthlyInventory() {
    if (stockSystem) stockSystem.generateMonthlyInventory();
}

function generateCriticalStockReport() {
    if (stockSystem) stockSystem.generateCriticalStockReport();
}

// INITIALIZE STOCK SYSTEM
document.addEventListener('DOMContentLoaded', () => {
    stockSystem = new StockSystem();
});