// SABİT DEĞERLER

// ÜRETİM DURUMLARI
export const PRODUCTION_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'production',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// STOK DURUMLARI
export const STOCK_STATUS = {
    NORMAL: 'normal',
    LOW: 'low',
    CRITICAL: 'critical',
    OUT_OF_STOCK: 'out_of_stock'
};

// ROL TANIMLARI
export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STOCK: 'stock',
    OPERATOR: 'operator',
    VIEWER: 'viewer'
};

// İSTASYON TANIMLARI
export const PRODUCTION_STATIONS = [
    { id: 1, name: 'Kesim', color: '#667eea', icon: 'fas fa-cut' },
    { id: 2, name: 'Montaj', color: '#11998e', icon: 'fas fa-tools' },
    { id: 3, name: 'Cila', color: '#f46b45', icon: 'fas fa-paint-roller' },
    { id: 4, name: 'Paketleme', color: '#ff416c', icon: 'fas fa-box' }
];

// MODEL TANIMLARI
export const DOOR_MODELS = [
    { id: '606', name: '606 Model', description: 'Klasik tasarım' },
    { id: '707', name: '707 Model', description: 'Modern tasarım' },
    { id: '808', name: '808 Model', description: 'Lüks tasarım' },
    { id: '909', name: '909 Model', description: 'Premium tasarım' }
];

// RENK TANIMLARI
export const COLOR_OPTIONS = [
    { id: 'white', name: 'Beyaz', hex: '#FFFFFF' },
    { id: 'black', name: 'Siyah', hex: '#000000' },
    { id: 'brown', name: 'Kahverengi', hex: '#8B4513' },
    { id: 'gray', name: 'Gri', hex: '#808080' },
    { id: 'silver', name: 'Gümüş', hex: '#C0C0C0' }
];

// STOK SEVİYELERİ
export const STOCK_LEVELS = {
    CRITICAL: 5,
    LOW: 10,
    NORMAL: 20,
    HIGH: 50
};

// ZAMAN FORMATLARI
export const TIME_FORMATS = {
    SHORT_DATE: 'DD/MM/YYYY',
    LONG_DATE: 'DD MMMM YYYY',
    DATETIME: 'DD/MM/YYYY HH:mm',
    TIME: 'HH:mm'
};

// API ENDPOINTS
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REGISTER: '/auth/register',
        PROFILE: '/auth/profile'
    },
    ORDERS: {
        BASE: '/orders',
        BY_STATUS: '/orders/status',
        BY_CUSTOMER: '/orders/customer',
        STATS: '/orders/stats'
    },
    STOCK: {
        BASE: '/stock',
        BY_MODEL: '/stock/model',
        BY_COLOR: '/stock/color',
        HISTORY: '/stock/history',
        ALERTS: '/stock/alerts'
    },
    PRODUCTION: {
        STATIONS: '/production/stations',
        PROGRESS: '/production/progress',
        STATS: '/production/stats',
        TIMELINE: '/production/timeline'
    }
};

// PERMISSIONS
export const PERMISSIONS = {
    [USER_ROLES.ADMIN]: ['*'],
    [USER_ROLES.MANAGER]: [
        'view_dashboard',
        'manage_orders',
        'view_reports',
        'manage_production'
    ],
    [USER_ROLES.STOCK]: [
        'view_stock',
        'manage_stock',
        'view_stock_reports'
    ],
    [USER_ROLES.OPERATOR]: [
        'view_dashboard',
        'update_order_status'
    ],
    [USER_ROLES.VIEWER]: [
        'view_dashboard',
        'view_reports'
    ]
};

// LOCAL STORAGE KEYS
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    ORDERS: 'orders',
    STOCK: 'stock',
    SETTINGS: 'app_settings',
    FILTERS: 'last_filters'
};

// ERROR MESSAGES
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.',
    UNAUTHORIZED: 'Bu işlem için yetkiniz bulunmamaktadır.',
    NOT_FOUND: 'İstenilen kaynak bulunamadı.',
    VALIDATION_ERROR: 'Lütfen tüm zorunlu alanları doldurun.',
    SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    TIMEOUT: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
};

// SUCCESS MESSAGES
export const SUCCESS_MESSAGES = {
    LOGIN: 'Başarıyla giriş yapıldı.',
    LOGOUT: 'Başarıyla çıkış yapıldı.',
    ORDER_CREATED: 'Sipariş başarıyla oluşturuldu.',
    ORDER_UPDATED: 'Sipariş başarıyla güncellendi.',
    ORDER_DELETED: 'Sipariş başarıyla silindi.',
    STOCK_UPDATED: 'Stok başarıyla güncellendi.',
    DATA_SAVED: 'Veriler başarıyla kaydedildi.',
    DATA_EXPORTED: 'Veriler başarıyla dışa aktarıldı.'
};
