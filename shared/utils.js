// ORTAK UTILITY FONKSİYONLARI

class Utils {
    // TARİH FORMATLAMA
    static formatDate(date, format = 'tr-TR') {
        if (!date) return '';
        
        const d = new Date(date);
        
        if (format === 'tr-TR') {
            return d.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } else if (format === 'full') {
            return d.toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return d.toISOString().split('T')[0];
    }
    
    // SAYI FORMATLAMA
    static formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }
    
    // PARA FORMATLAMA
    static formatCurrency(amount, currency = 'TRY') {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    // STRING KISALTMA
    static truncateText(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // DEĞER KONTROLÜ
    static isEmpty(value) {
        return value === null || 
               value === undefined || 
               value === '' || 
               (Array.isArray(value) && value.length === 0) ||
               (typeof value === 'object' && Object.keys(value).length === 0);
    }
    
    // DOSYA BOYUTU FORMATLAMA
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // RENK KONTRAST HESAPLAMA
    static getContrastColor(hexColor) {
        // Hex color to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }
    
    // DEBOUNCE FONKSİYONU
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // THROTTLE FONKSİYONU
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // RANDOM ID OLUŞTURMA
    static generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // CSV'DEN OBJE OLUŞTURMA
    static csvToObjects(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const obj = {};
            
            headers.forEach((header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
            });
            
            result.push(obj);
        }
        
        return result;
    }
    
    // OBJE'DEN CSV OLUŞTURMA
    static objectsToCsv(objects) {
        if (!objects || objects.length === 0) return '';
        
        const headers = Object.keys(objects[0]);
        const csvRows = [];
        
        // Headers
        csvRows.push(headers.join(','));
        
        // Values
        objects.forEach(obj => {
            const values = headers.map(header => {
                const value = obj[header];
                // Handle values with commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    // LOCALSTORAGE YÖNETİMİ
    static setLocalStorage(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('LocalStorage kayıt hatası:', error);
            return false;
        }
    }
    
    static getLocalStorage(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (error) {
            console.error('LocalStorage okuma hatası:', error);
            return defaultValue;
        }
    }
    
    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('LocalStorage silme hatası:', error);
            return false;
        }
    }
    
    // SESSIONSTORAGE YÖNETİMİ
    static setSessionStorage(key, value) {
        try {
            const serialized = JSON.stringify(value);
            sessionStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('SessionStorage kayıt hatası:', error);
            return false;
        }
    }
    
    static getSessionStorage(key, defaultValue = null) {
        try {
            const serialized = sessionStorage.getItem(key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (error) {
            console.error('SessionStorage okuma hatası:', error);
            return defaultValue;
        }
    }
    
    // VALIDASYON FONKSİYONLARI
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static isValidPhone(phone) {
        const re = /^[+]?[0-9\s\-\(\)]{10,}$/;
        return re.test(phone);
    }
    
    static isValidTCKN(tckn) {
        if (tckn.length !== 11) return false;
        if (isNaN(tckn)) return false;
        
        let total = 0;
        for (let i = 0; i < 10; i++) {
            total += parseInt(tckn[i]);
        }
        
        return total % 10 === parseInt(tckn[10]);
    }
    
    // URL PARAMETRE YÖNETİMİ
    static getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    }
    
    static setUrlParams(params) {
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        return queryString ? `?${queryString}` : '';
    }
    
    // DOSYA İNDİRME
    static downloadFile(filename, content, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// EXPORT
window.Utils = Utils;