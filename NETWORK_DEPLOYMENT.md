# Network Deployment Guide

## 🚀 Cara Menjalankan Aplikasi di Network

Setelah menghapus fitur biometric, aplikasi sekarang dapat diakses dari jaringan lokal maupun internet.

### 📋 Prerequisites

1. **Go** (versi 1.21 atau lebih baru)
2. **Node.js** (versi 18 atau lebih baru)
3. **Git**

### 🔧 Konfigurasi Backend

1. **Masuk ke direktori backend:**
   ```bash
   cd backend
   ```

2. **Copy file konfigurasi (opsional):**
   ```bash
   cp config.env.example config.env
   ```

3. **Edit config.env jika diperlukan:**
   ```env
   HOST=0.0.0.0
   PORT=8080
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Jalankan backend:**
   ```bash
   go run main.go
   ```

### 🌐 Konfigurasi Frontend

1. **Masuk ke direktori frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan frontend:**
   ```bash
   npm run dev
   ```

### 🌍 Akses dari Network

#### **Dari Komputer Lain di Jaringan Lokal:**

1. **Dapatkan IP address server:**
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. **Akses aplikasi dari browser:**
   ```
   Frontend: http://[IP_ADDRESS]:3000
   Backend:  http://[IP_ADDRESS]:8080
   ```

   Contoh:
   ```
   Frontend: http://192.168.1.100:3000
   Backend:  http://192.168.1.100:8080
   ```

#### **Dari Internet (Port Forwarding):**

1. **Konfigurasi router untuk port forwarding:**
   - Port 3000 → Frontend
   - Port 8080 → Backend

2. **Akses dari internet:**
   ```
   Frontend: http://[PUBLIC_IP]:3000
   Backend:  http://[PUBLIC_IP]:8080
   ```

### 🔒 Keamanan

#### **Untuk Production:**

1. **Gunakan HTTPS:**
   - Install SSL certificate
   - Konfigurasi reverse proxy (nginx/apache)

2. **Ganti JWT Secret:**
   ```env
   JWT_SECRET=your-very-secure-jwt-secret-key
   ```

3. **Firewall Configuration:**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 3000
   sudo ufw allow 8080
   ```

4. **Environment Variables:**
   ```bash
   export HOST=0.0.0.0
   export PORT=8080
   export JWT_SECRET=your-secure-secret
   ```

### 📱 Mobile Access

Aplikasi sudah dioptimalkan untuk mobile dan dapat diakses dari:
- **iPhone/iPad:** Safari, Chrome
- **Android:** Chrome, Firefox
- **Tablet:** Semua browser modern

### 🔧 Troubleshooting

#### **Masalah Umum:**

1. **Tidak bisa akses dari network:**
   - Pastikan firewall tidak memblokir port 3000 dan 8080
   - Cek apakah aplikasi berjalan di `0.0.0.0` bukan `localhost`

2. **CORS Error:**
   - Backend sudah dikonfigurasi untuk allow all origins
   - Pastikan URL backend benar di frontend

3. **Video tidak bisa diupload:**
   - Pastikan direktori `uploads` ada dan writable
   - Cek permission folder

4. **Login tidak berfungsi:**
   - Pastikan backend berjalan di port 8080
   - Cek koneksi database

### 📊 Monitoring

#### **Log Backend:**
```bash
# Real-time logs
tail -f backend.log

# Check if backend is running
curl http://localhost:8080/health
```

#### **Log Frontend:**
```bash
# Check frontend status
curl http://localhost:3000
```

### 🎯 Tips Deployment

1. **Gunakan PM2 untuk production:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "frontend" -- run start
   ```

2. **Gunakan systemd untuk backend:**
   ```bash
   sudo systemctl enable trialuploadhk
   sudo systemctl start trialuploadhk
   ```

3. **Backup database:**
   ```bash
   cp backend/trialuploadhk.db backup/
   ```

4. **Monitor disk space:**
   ```bash
   du -sh backend/uploads/
   ```

### 📞 Support

Jika ada masalah, cek:
1. Log aplikasi
2. Network connectivity
3. Firewall settings
4. Port availability

---

**🎉 Selamat! Aplikasi Anda sekarang dapat diakses dari network!** 