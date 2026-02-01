// DOM ELEMENTLERİ
const loginScreen = document.getElementById('login-screen');
const loginUser = document.getElementById('login-user');
const loginPass = document.getElementById('login-pass');
const loginError = document.getElementById('login-error');
const loginButton = document.querySelector('.btn-primary');

// SAYFA YÜKLENDİĞİNDE
document.addEventListener('DOMContentLoaded', function() {
    // Eğer zaten giriş yapılmışsa dashboard'a yönlendir
    if (auth.isAuthenticated()) {
        redirectToDashboard();
    }
    
    setupEventListeners();
});

// EVENT LISTENERS
function setupEventListeners() {
    // Enter tuşu ile giriş
    loginPass.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Form submit engelleme
    document.querySelector('.login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
}

// GİRİŞ İŞLEMİ
async function handleLogin() {
    const username = loginUser.value.trim();
    const password = loginPass.value.trim();
    
    // Validasyon
    if (!username || !password) {
        showError('Kullanıcı adı ve şifre gereklidir!');
        return;
    }
    
    // Loading state
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';
    
    try {
        // Kimlik doğrulama
        const response = await auth.authenticateUser(username, password);
        
        if (response.success) {
            // Token ve kullanıcı bilgilerini sakla
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_data', JSON.stringify(response.user));
            
            // Başarı mesajı
            showSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
            
            // 1 saniye sonra yönlendir
            setTimeout(() => {
                redirectToDashboard();
            }, 1000);
        }
    } catch (error) {
        showError(error.message);
        loginButton.disabled = false;
        loginButton.textContent = 'Giriş Yap';
    }
}

// YÖNLENDİRME FONKSİYONLARI
function redirectToDashboard() {
    const user = auth.getCurrentUser();
    
    // Rol bazlı yönlendirme
    if (user.role === 'stock') {
        window.location.href = 'stok/index.html';
    } else {
        window.location.href = 'dashboard/index.html';
    }
}

// HATA / BAŞARI MESAJLARI
function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    
    // 5 saniye sonra gizle
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    // Geçici başarı mesajı göster
    const successDiv = document.createElement('div');
    successDiv.className = 'success-msg';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        background: #d4edda;
        color: #155724;
        padding: 15px;
        border-radius: 8px;
        margin-top: 15px;
        text-align: center;
        border-left: 4px solid #28a745;
    `;
    
    document.querySelector('.login-form').appendChild(successDiv);
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// GLOBAL FONKSİYONLAR
window.handleLogin = handleLogin;