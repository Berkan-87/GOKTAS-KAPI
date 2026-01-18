// LocalStorage'dan verileri yükle
let users = JSON.parse(localStorage.getItem('kapiusers')) || [];
let orders = JSON.parse(localStorage.getItem('kapiorders')) || [
    { id: "KAPI-001", name: "Örnek Müşteri", model: "Lake Beyaz", color: "Beyaz", quantity: "1", step: 0 },
    { id: "KAPI-002", name: "Örnek Müşteri 2", model: "PVC Meşe", color: "Kahve", quantity: "2", step: 3 }
];

const stationNames = [
    "Planlama", "CNC", "Tutkal", "PVC", 
    "Pres", "Kenarbant", "Kol-Kilit", "Paketleme", "Sevkiyat"
];

const operatorUsernames = [
    "PLANLAMA", "CNC", "TUTKAL", "PVC", 
    "PRES", "BANT", "KİLİT", "PAKET", "SEVKİYAT"
];

let currentUser = null;

function isOperatorUser(username) {
    return operatorUsernames.includes(username.toUpperCase());
}

// Hata mesajı göster fonksiyonu
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        setTimeout(() => {
            errorElement.style.display = "none";
        }, 3000);
    }
}

// Sayfa yüklendiğinde oturum kontrol et
window.onload = function() {
    console.log("Sayfa yüklendi, users:", users);
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard();
        } catch (error) {
            console.error("Kullanıcı verisi okunamadı:", error);
            localStorage.removeItem('currentUser');
        }
    } else {
        // Eğer hiç kullanıcı yoksa, varsayılan bir admin kullanıcısı ekle
        if (users.length === 0) {
            users.push({
                name: "Sistem Yöneticisi",
                user: "admin",
                pass: "admin123",
                role: "operator"
            });
            localStorage.setItem('kapiusers', JSON.stringify(users));
            console.log("Varsayılan admin kullanıcısı oluşturuldu");
        }
    }
};

// Ekran geçiş fonksiyonları
function showLogin() {
    document.getElementById("register-screen").style.display = "none";
    document.getElementById("main-dashboard").style.display = "none";
    document.getElementById("login-screen").style.display = "block";
    
    // Form alanlarını temizle
    document.getElementById("login-user").value = "";
    document.getElementById("login-pass").value = "";
    if (document.getElementById("login-error")) {
        document.getElementById("login-error").style.display = "none";
    }
}

function showRegister() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("main-dashboard").style.display = "none";
    document.getElementById("register-screen").style.display = "block";
    
    // Form alanlarını temizle
    document.getElementById("reg-name").value = "";
    document.getElementById("reg-user").value = "";
    document.getElementById("reg-pass").value = "";
    if (document.getElementById("register-error")) {
        document.getElementById("register-error").style.display = "none";
    }
}

function handleRegister() {
    const name = document.getElementById("reg-name").value.trim();
    const user = document.getElementById("reg-user").value.trim();
    const pass = document.getElementById("reg-pass").value.trim();

    if (!name || !user || !pass) {
        showError("register-error", "Lütfen tüm alanları doldurun!");
        return;
    }

    // Kullanıcı adı kontrolü
    if (users.some(u => u.user === user)) {
        showError("register-error", "Bu kullanıcı adı zaten kullanılıyor!");
        return;
    }

    // Kullanıcı rolünü belirle
    const role = isOperatorUser(user) ? 'operator' : 'izleyici';

    // Yeni kullanıcıyı ekle
    users.push({ name, user, pass, role });
    localStorage.setItem('kapiusers', JSON.stringify(users));
    
    alert("Kayıt başarılı! Giriş yapabilirsiniz.");
    showLogin();
}

function handleLogin() {
    const userInp = document.getElementById("login-user").value.trim();
    const passInp = document.getElementById("login-pass").value.trim();

    if (!userInp || !passInp) {
        showError("login-error", "Lütfen kullanıcı adı ve şifre girin!");
        return;
    }

    console.log("Giriş denemesi:", userInp, "users:", users);
    
    const found = users.find(u => u.user === userInp && u.pass === passInp);

    if (found) {
        currentUser = found;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log("Giriş başarılı:", currentUser);
        showDashboard();
    } else {
        showError("login-error", "Hatalı kullanıcı adı veya şifre!");
    }
}

function showDashboard() {
    console.log("showDashboard çağrıldı, currentUser:", currentUser);
    
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("register-screen").style.display = "none";
    document.getElementById("main-dashboard").style.display = "block";
    
    // Kullanıcı rolünü göster
    /* if (currentUser && currentUser.role) {
        document.getElementById("current-user-role").textContent = 
            currentUser.role === 'operator' ? ' (Operatör)' : ' (İzleyici)';
    } else {
        document.getElementById("current-user-role").textContent = '';
    } */
    
    // Operatör ise sipariş ekleme alanını göster
    if(currentUser && currentUser.role === 'operator') {
        document.getElementById("order-input-section").style.display = 'block';
    } else {
        document.getElementById("order-input-section").style.display = 'none';
    }
    
    updateDashboard();
}

function updateDashboard() {
    try {
        console.log("updateDashboard çağrıldı, currentUser:", currentUser);
        
        const container = document.getElementById("stations-container");
        if (!container) {
            console.error("stations-container bulunamadı!");
            return;
        }
        
        container.innerHTML = "";

        stationNames.forEach((name, index) => {
            const stationDiv = document.createElement("div");
            stationDiv.className = "station-block";
            
            const filtered = orders.filter(o => o.step === index);
            let ordersHtml = filtered.map(o => {
                const isOperator = currentUser && currentUser.role === 'operator';
                const isSevkiyat = index === stationNames.length - 1;
                
                // Sipariş detaylarını göster - düzenli format
                const orderInfo = `
                    <div class="order-details">
                        <div><strong>${o.id}</strong></div>
                        <div><strong></strong> ${o.name}</div>
                        <div><strong>Renk:</strong> ${o.color}</div>
                        <div><strong>Model:</strong> ${o.model}</div>
                        <div><strong>Adet:</strong> ${o.quantity}</div>
                    </div>
                `;
                
                let actionButtons = '';
                
                if (isOperator) {
                    if (isSevkiyat) {
                        actionButtons = `<button class="complete-btn" onclick="completeOrder('${o.id}')">✓ Tamamlandı</button>`;
                    } else if (index === 0) {
                        actionButtons = `
                            <button class="delete-btn" onclick="deleteOrder('${o.id}')">❌</button>
                            <button class="move-btn" onclick="moveOrder('${o.id}')">İlerlet →</button>
                        `;
                    } else {
                        actionButtons = `<button class="move-btn" onclick="moveOrder('${o.id}')">İlerlet →</button>`;
                    }
                } else {
                    actionButtons = `<span class="status-badge">Durum: ${index+1}/${stationNames.length}</span>`;
                }
                
                return `
                    <div class="order-card-mini ${isSevkiyat ? 'completed-order' : ''}">
                        ${orderInfo}
                        <div class="order-actions">
                            ${actionButtons}
                        </div>
                    </div>
                `;
            }).join("");

            stationDiv.innerHTML = `
                <h3>${name} <span class="order-count">(${filtered.length})</span></h3>
                <div class="order-list-small">${ordersHtml || '<p class="empty">Bekleyen iş yok</p>'}</div>
            `;
            container.appendChild(stationDiv);
        });
        
        localStorage.setItem('kapiorders', JSON.stringify(orders));
        
    } catch (error) {
        console.error("updateDashboard hatası:", error);
        alert("Dashboard yüklenirken bir hata oluştu: " + error.message);
    }
}

function deleteOrder(orderId) {
    if(!currentUser || currentUser.role !== 'operator') {
        alert("Bu işlem için operatör yetkisi gereklidir!");
        return;
    }
    
    if(confirm("Bu siparişi silmek istediğinizden emin misiniz?")) {
        const orderIndex = orders.findIndex(o => o.id === orderId && o.step === 0);
        
        if(orderIndex !== -1) {
            orders.splice(orderIndex, 1);
            updateDashboard();
            alert("Sipariş başarıyla silindi!");
        } else {
            alert("Bu sipariş silinemez veya Planlama istasyonunda değil!");
        }
    }
}

function moveOrder(orderId) {
    if(!currentUser || currentUser.role !== 'operator') {
        alert("Bu işlem için operatör yetkisi gereklidir!");
        return;
    }
    
    orders = orders.map(o => {
        if (o.id === orderId && o.step < stationNames.length - 1) {
            o.step++;
        }
        return o;
    });
    updateDashboard();
}

function completeOrder(orderId) {
    if(!currentUser || currentUser.role !== 'operator') {
        alert("Bu işlem için operatör yetkisi gereklidir!");
        return;
    }
    
    if(confirm("Bu siparişi tamamlanmış olarak işaretlemek istediğinizden emin misiniz?\n\nSipariş sistemden kaldırılacaktır.")) {
        const orderIndex = orders.findIndex(o => o.id === orderId && o.step === stationNames.length - 1);
        
        if(orderIndex !== -1) {
            const completedOrder = orders[orderIndex];
            orders.splice(orderIndex, 1);
            
            const completedOrders = JSON.parse(localStorage.getItem('kapiCompletedOrders')) || [];
            completedOrders.push({
                ...completedOrder,
                completedDate: new Date().toLocaleString('tr-TR')
            });
            localStorage.setItem('kapiCompletedOrders', JSON.stringify(completedOrders));
            
            updateDashboard();
            alert("Sipariş başarıyla tamamlandı ve sistemden kaldırıldı!");
        } else {
            alert("Bu sipariş tamamlanamaz veya Sevkiyat istasyonunda değil!");
        }
    }
}

function addOrdersFromExcel() {
    if(!currentUser || currentUser.role !== 'operator') {
        alert("Bu işlem için operatör yetkisi gereklidir!");
        return;
    }
    
    const input = document.getElementById("excel-input").value;
    const lines = input.split('\n').filter(line => line.trim() !== '');
    
    let addedCount = 0;
    let errorCount = 0;
    
    lines.forEach((line, index) => {
        try {
            const separator = line.includes('\t') ? '\t' : ',';
            const parts = line.split(separator).map(part => part.trim());
            
            if(parts.length >= 3) {
                let id, name, quantity, model, color, step = 0;
                
                if(parts.length >= 5) {
                    id = parts[0];
                    name = parts[1];
                    quantity = parts[2];
                    model = parts[3];
                    color = parts[4];
                } else if(parts.length >= 2) {
                    id = parts[0];
                    model = parts[1];
                    name = "Müşteri";
                    quantity = "1";
                    color = "Standart";
                }
                
                let uniqueId = id;
                let counter = 1;
                while(orders.some(o => o.id === uniqueId)) {
                    uniqueId = `${id}_${counter}`;
                    counter++;
                }
                
                if(!orders.some(o => o.id === id || o.id === uniqueId)) {
                    orders.push({ 
                        id: uniqueId, 
                        name: name || "Müşteri",
                        model: model || "Standart Model", 
                        color: color || "Standart Renk",
                        quantity: quantity || "1",
                        step: step 
                    });
                    addedCount++;
                }
            } else {
                console.warn(`Satır ${index+1} yetersiz veri: ${line}`);
                errorCount++;
            }
        } catch(error) {
            console.error(`Satır ${index+1} hatası:`, error);
            errorCount++;
        }
    });
    
    document.getElementById("excel-input").value = '';
    updateDashboard();
    
    let message = `${addedCount} sipariş başarıyla eklendi!`;
    if(errorCount > 0) {
        message += ` ${errorCount} satır işlenemedi.`;
    }
    alert(message);
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
}