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

let currentUser = null;

// Sayfa yüklendiğinde oturum kontrol et
window.onload = function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
};

function handleRegister() {
    const name = document.getElementById("reg-name").value;
    const user = document.getElementById("reg-user").value;
    const pass = document.getElementById("reg-pass").value;
    const role = document.getElementById("reg-role").value;

    if(name && user && pass) {
        // Kullanıcı adı kontrolü
        if(users.some(u => u.user === user)) {
            alert("Bu kullanıcı adı zaten kullanılıyor!");
            return;
        }
        
        users.push({ name, user, pass, role });
        localStorage.setItem('kapiusers', JSON.stringify(users));
        alert("Kayıt başarılı! Giriş yapabilirsiniz.");
        showLogin();
    } else {
        alert("Lütfen tüm alanları doldurun.");
    }
}

function handleLogin() {
    const userInp = document.getElementById("login-user").value;
    const passInp = document.getElementById("login-pass").value;
    const found = users.find(u => u.user === userInp && u.pass === passInp);

    if (found) {
        currentUser = found;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
    } else {
        document.getElementById("login-error").style.display = "block";
    }
}

function showDashboard() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("register-screen").style.display = "none";
    document.getElementById("main-dashboard").style.display = "block";
    
    // Kullanıcı rolünü göster
    document.getElementById("current-user-role").textContent = 
        currentUser.role === 'operator' ? 'Operatör' : 'İzleyici';
    
    // Operatör ise sipariş ekleme alanını göster
    if(currentUser.role === 'operator') {
        document.getElementById("order-input-section").style.display = 'block';
    }
    
    updateDashboard();
}

function updateDashboard() {
    const container = document.getElementById("stations-container");
    container.innerHTML = "";

    stationNames.forEach((name, index) => {
        const stationDiv = document.createElement("div");
        stationDiv.className = "station-block";
        
        const filtered = orders.filter(o => o.step === index);
        let ordersHtml = filtered.map(o => {
            const isOperator = currentUser.role === 'operator';
            const isSevkiyat = index === stationNames.length - 1; // Son istasyon: Sevkiyat
            
          // Sipariş detaylarını göster (düzenli format)
            const orderInfo = `
                <div class="order-details">
                    <div><strong>${o.id}</strong></div>
                    <div><strong></strong> ${o.name}</div>
                    <div><strong>Renk:</strong> ${o.model}</div>
                    <div><strong>Model:</strong> ${o.quantity}</div>
                    <div><strong>Adet:</strong> ${o.color}</div>
                </div>
            `;
            
            let actionButtons = '';
            
            if (isOperator) {
                if (isSevkiyat) {
                    // Sevkiyat istasyonunda: Tamamlandı butonu
                    actionButtons = `<button class="complete-btn" onclick="completeOrder('${o.id}')">✓ Tamamlandı</button>`;
                } else if (index === 0) {
                    // Planlama istasyonunda: Silme ve İlerletme butonu
                    actionButtons = `
                        <button class="delete-btn" onclick="deleteOrder('${o.id}')">❌</button>
                        <button class="move-btn" onclick="moveOrder('${o.id}')">İlerlet →</button>
                    `;
                } else {
                    // Diğer istasyonlarda: Sadece ilerletme butonu
                    actionButtons = `<button class="move-btn" onclick="moveOrder('${o.id}')">İlerlet →</button>`;
                }
            } else {
                // İzleyici için durum badge'i
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
    
    // Verileri kaydet
    localStorage.setItem('kapiorders', JSON.stringify(orders));
}

function deleteOrder(orderId) {
    if(currentUser.role !== 'operator') {
        alert("Bu işlem için operatör yetkisi gereklidir!");
        return;
    }
    
    if(confirm("Bu siparişi silmek istediğinizden emin misiniz?")) {
        // Sadece Planlama istasyonundaki siparişi sil (step: 0)
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
    if(currentUser.role !== 'operator') {
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
    if(currentUser.role !== 'operator') {
        alert("Bu işlem için operatör yetkisi gereklidir!");
        return;
    }
    
    if(confirm("Bu siparişi tamamlanmış olarak işaretlemek istediğinizden emin misiniz?\n\nSipariş sistemden kaldırılacaktır.")) {
        // Sevkiyat istasyonundaki siparişi kaldır
        const orderIndex = orders.findIndex(o => o.id === orderId && o.step === stationNames.length - 1);
        
        if(orderIndex !== -1) {
            const completedOrder = orders[orderIndex];
            orders.splice(orderIndex, 1);
            
            // Tamamlanan siparişleri kaydet (isteğe bağlı)
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
    if(currentUser.role !== 'operator') {
        alert("Bu işlem için operatör yetkisi gereklidir!");
        return;
    }
    
    const input = document.getElementById("excel-input").value;
    const lines = input.split('\n').filter(line => line.trim() !== '');
    
    let addedCount = 0;
    let errorCount = 0;
    
    lines.forEach((line, index) => {
        try {
            // Tab ve virgül ile ayrılmış verileri işle
            const separator = line.includes('\t') ? '\t' : ',';
            const parts = line.split(separator).map(part => part.trim());
            
            if(parts.length >= 3) {
                let id, name, quantity, model, color, step = 0;
                
                // Farklı formatları destekle
                if(parts.length >= 5) {
                    // Format: 40212 TURAN GÜVEN 681 LAKE İPEK MAT BEYAZ 6
                    id = parts[0];
                    name = parts[1];
                    quantity = parts[2];
                    model = parts[3];
                    color = parts[4];
                } else if(parts.length >= 2) {
                    // Basit format: KAPI-001,Model Adı
                    id = parts[0];
                    model = parts[1];
                    name = "Müşteri";
                    quantity = "1";
                    color = "Standart";
                }
                
                // Benzersiz ID oluştur
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
                console.warn(`Satır ${index+1} yetersiz veri içeriyor: ${line}`);
                errorCount++;
            }
        } catch(error) {
            console.error(`Satır ${index+1} işlenirken hata:`, error);
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

// Ekran geçiş fonksiyonları
function showLogin() {
    document.getElementById("register-screen").style.display = "none";
    document.getElementById("login-screen").style.display = "block";
    document.getElementById("login-error").style.display = "none";
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
}