// KULLANICI VERİTABANI (Geçici - backend ile değiştirilecek)
const users = [
    {
        id: 1,
        username: 'admin',
        password: 'admin123',
        name: 'Sistem Yöneticisi',
        role: 'admin',
        permissions: ['all']
    },
    {
        id: 2,
        username: 'uretim',
        password: 'uretim123',
        name: 'Üretim Sorumlusu',
        role: 'production',
        permissions: ['view_orders', 'update_status']
    },
    {
        id: 3,
        username: 'stok',
        password: 'stok123',
        name: 'Stok Sorumlusu',
        role: 'stock',
        permissions: ['view_stock', 'update_stock']
    }
];

// TOKEN YÖNETİMİ
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// KULLANICI DOĞRULAMA
function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = users.find(u => 
                u.username === username && u.password === password
            );
            
            if (user) {
                // Token oluştur
                const token = generateToken(user);
                const userData = {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    permissions: user.permissions
                };
                
                resolve({
                    success: true,
                    token: token,
                    user: userData
                });
            } else {
                reject(new Error('Kullanıcı adı veya şifre hatalı!'));
            }
        }, 500); // Simüle edilmiş API gecikmesi
    });
}

// TOKEN OLUŞTURMA
function generateToken(user) {
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        timestamp: Date.now()
    };
    
    return btoa(JSON.stringify(payload));
}

// TOKEN DOĞRULAMA
function validateToken(token) {
    try {
        const payload = JSON.parse(atob(token));
        
        // Token süresi kontrolü (24 saat)
        const tokenAge = Date.now() - payload.timestamp;
        const isExpired = tokenAge > 24 * 60 * 60 * 1000;
        
        return {
            valid: !isExpired,
            payload: payload
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Geçersiz token'
        };
    }
}

// KULLANICI KONTROLÜ
function isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    return validateToken(token).valid;
}

function getCurrentUser() {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    
    try {
        return JSON.parse(userData);
    } catch (error) {
        return null;
    }
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
}

// YETKİ KONTROLÜ
function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    
    return user.permissions.includes('all') || 
           user.permissions.includes(permission);
}

// EXPORT
window.auth = {
    authenticateUser,
    validateToken,
    isAuthenticated,
    getCurrentUser,
    logout,
    hasPermission
};