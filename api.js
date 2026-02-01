// API KONFİGÜRASYONU
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api', // Backend API URL
    TIMEOUT: 10000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// API YÖNETİCİSİ
class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    // TOKEN EKLEME
    getHeaders() {
        const headers = { ...API_CONFIG.HEADERS };
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // HTTP İSTEKLERİ
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}/${endpoint}`);
        Object.keys(params).forEach(key => 
            url.searchParams.append(key, params[key])
        );
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
                signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async post(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async put(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
                signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
            });
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // RESPONSE YÖNETİMİ
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API hatası');
        }
        
        return data;
    }

    handleError(error) {
        console.error('API Hatası:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('İstek zaman aşımına uğradı');
        }
        
        if (!navigator.onLine) {
            throw new Error('İnternet bağlantısı yok');
        }
        
        throw error;
    }
}

// MODÜL ÖZEL API'LER
const OrdersAPI = {
    async getAll() {
        // Backend yoksa localStorage'dan getir
        const localOrders = localStorage.getItem('orders');
        if (localOrders) {
            return JSON.parse(localOrders);
        }
        
        // Fallback: Örnek veri
        return [
            {
                id: 1,
                orderNumber: 'ORD-2024-001',
                customer: 'Ahmet Yılmaz',
                model: '606',
                color: 'Beyaz',
                quantity: 5,
                date: '2024-01-15',
                status: 'production',
                station: 'Kesim'
            },
            {
                id: 2,
                orderNumber: 'ORD-2024-002',
                customer: 'Mehmet Demir',
                model: '707',
                color: 'Ceviz',
                quantity: 3,
                date: '2024-01-16',
                status: 'pending',
                station: ''
            }
        ];
    },

    async create(orderData) {
        const orders = await this.getAll();
        const newOrder = {
            id: Date.now(),
            orderNumber: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
            ...orderData,
            createdAt: new Date().toISOString()
        };
        
        orders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        return newOrder;
    },

    async update(id, updates) {
        const orders = await this.getAll();
        const index = orders.findIndex(o => o.id === id);
        
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updates };
            localStorage.setItem('orders', JSON.stringify(orders));
            return orders[index];
        }
        
        throw new Error('Sipariş bulunamadı');
    },

    async delete(id) {
        const orders = await this.getAll();
        const filteredOrders = orders.filter(o => o.id !== id);
        localStorage.setItem('orders', JSON.stringify(filteredOrders));
        return true;
    }
};

const StockAPI = {
    async getAll() {
        const localStock = localStorage.getItem('stock');
        if (localStock) {
            return JSON.parse(localStock);
        }
        
        // Fallback: Örnek stok verisi
        return [
            {
                id: 1,
                model: '606',
                color: 'Beyaz',
                currentStock: 150,
                minStock: 50,
                pendingOrders: 20,
                location: 'A Rafı'
            },
            {
                id: 2,
                model: '606',
                color: 'Ceviz',
                currentStock: 30,
                minStock: 40,
                pendingOrders: 15,
                location: 'B Rafı'
            }
        ];
    },

    async updateStock(id, quantity) {
        const stock = await this.getAll();
        const item = stock.find(s => s.id === id);
        
        if (item) {
            item.currentStock += quantity;
            localStorage.setItem('stock', JSON.stringify(stock));
            return item;
        }
        
        throw new Error('Stok ürünü bulunamadı');
    }
};

// EXPORT
window.ApiService = ApiService;
window.OrdersAPI = OrdersAPI;
window.StockAPI = StockAPI;