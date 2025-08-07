# Rancangan Project: Video Upload & Management System

## 1. Overview Project

Project ini adalah web application untuk sistem upload dan manajemen video dengan fitur autentikasi biometric dan manajemen user. Aplikasi ini dirancang untuk kebutuhan monitoring atau dokumentasi video dengan sistem manajemen user yang terstruktur.

## 2. Tech Stack

### Frontend
- **Next.js** - React framework untuk pengembangan web application
- **TypeScript** - Untuk type safety dan maintainability
- **Tailwind CSS** - Untuk styling yang modern dan responsive
- **WebAuthn API** - Untuk autentikasi biometric (fingerprint, face recognition, dll)

### Backend
- **Golang** - High-performance backend language
- **Gin Framework** - Web framework untuk Golang
- **GORM** - ORM untuk database operations
- **JWT** - Untuk session management

### Database
- **PostgreSQL** - Relational database yang robust dan scalable
- **Redis** (opsional) - Untuk caching dan session storage

## 3. Fitur Utama

### 3.1 Autentikasi & Keamanan
- **WebAuthn Integration** - Login menggunakan biometric (fingerprint, face recognition)
- **Traditional Authentication** - Username/password sebagai primary method sebelum setup biometric
- **Multi-device Biometric** - Satu user dapat memiliki beberapa credential biometric dari device berbeda
- **JWT Token Management** - Session handling yang aman
- **Role-based Access Control** - User vs Manager/Supervisor

### 3.2 Halaman Utama
- **Login Page** - Interface untuk autentikasi biometric
- **Video Capture & Upload** - Halaman utama untuk recording dan upload
- **User Management** - Halaman untuk mengelola user (Manager/Supervisor)
- **File Explorer** - Halaman untuk melihat dan mengelola file video

### 3.3 Video Management
- **Video Recording** - Capture video langsung dari browser
- **Video Preview** - Preview sebelum upload
- **Room Number Selection** - Dropdown untuk memilih nomor kamar
- **Upload Management** - Progress tracking dan error handling

## 4. Database Design

### 4.1 Entity Design

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'manager', 'supervisor'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

#### WebAuthn Credentials Table
```sql
CREATE TABLE webauthn_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    sign_count INTEGER DEFAULT 0,
    device_name VARCHAR(100), -- e.g., "iPhone 15", "Samsung Galaxy"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);
```

#### Rooms Table
```sql
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    room_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Videos Table
```sql
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER, -- in seconds
    room_id INTEGER REFERENCES rooms(id),
    uploaded_by INTEGER REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    metadata JSONB -- Additional video metadata
);
```

### 4.2 Alasan Pemilihan PostgreSQL
- **ACID Compliance** - Data integrity yang tinggi
- **JSONB Support** - Untuk menyimpan WebAuthn credentials dan metadata
- **Scalability** - Dapat menangani pertumbuhan data yang besar
- **Full-text Search** - Untuk pencarian video berdasarkan metadata
- **Backup & Recovery** - Fitur backup yang robust

## 5. File Storage Strategy

### 5.1 Local Storage Strategy

#### Local Storage (Primary & Only)
- **Struktur Folder:**
  ```
  /uploads/
  ├── 2024/
  │   ├── 01/
  │   │   ├── room_101/
  │   │   ├── room_102/
  │   │   └── ...
  │   └── 02/
  └── ...
  ```

- **Keuntungan:**
  - Kontrol penuh atas data
  - Tidak ada biaya bulanan
  - Latency sangat rendah (local server)
  - Privacy yang maksimal
  - Performa upload yang optimal

- **Kekurangan:**
  - Perlu backup strategy manual
  - Storage management manual
  - Tidak ada CDN (tidak diperlukan untuk deployment lokal)

### 5.2 Implementasi Storage
```go
type StorageService interface {
    Upload(file []byte, filename string, roomNumber string) (string, error)
    GetURL(filePath string) string
    Delete(filePath string) error
    ListFiles(roomNumber string) ([]FileInfo, error)
}
```

## 6. Architecture Overview

### 6.1 System Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │
│  (Next.js)  │◄──►│   (Golang)  │◄──►│ PostgreSQL  │
│ Mobile-First│    │ High-Perf   │    │ Local       │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ WebAuthn    │    │ Local File  │    │ Redis Cache │
│ Multi-Device│    │ Storage     │    │ (Optional)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 6.2 API Endpoints

#### Authentication
- `POST /api/auth/login` - Traditional login (username/password)
- `POST /api/auth/webauthn/register` - WebAuthn registration untuk device baru
- `POST /api/auth/webauthn/authenticate` - WebAuthn login
- `GET /api/auth/webauthn/credentials` - List user's biometric credentials
- `DELETE /api/auth/webauthn/credentials/:id` - Remove specific biometric credential
- `POST /api/auth/logout` - Logout

#### Video Management
- `POST /api/videos/upload` - Upload video
- `GET /api/videos` - List videos (with filters)
- `GET /api/videos/:id` - Get video details
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/:id/stream` - Stream video

#### User Management
- `GET /api/users` - List users (Manager/Supervisor only)
- `POST /api/users` - Create user (Manager/Supervisor only)
- `PUT /api/users/:id` - Update user (Manager/Supervisor only)
- `DELETE /api/users/:id` - Delete user (Manager/Supervisor only)

#### Room Management
- `GET /api/rooms` - List rooms (Manager/Supervisor only)
- `POST /api/rooms` - Create room (Manager/Supervisor only)
- `PUT /api/rooms/:id` - Update room (Manager/Supervisor only)
- `DELETE /api/rooms/:id` - Delete room (Manager/Supervisor only)

## 7. Security Considerations

### 7.1 WebAuthn Implementation
- **Credential Creation** - Generate challenge for registration per device
- **Credential Verification** - Verify biometric authentication
- **Multi-device Support** - Satu user dapat memiliki multiple biometric credentials
- **Device Management** - User dapat melihat dan menghapus credential per device
- **Traditional Login** - Username/password sebagai primary method sebelum setup biometric

### 7.2 File Security
- **Access Control** - Role-based file access
- **File Validation** - Validate video format and size
- **Virus Scanning** - Scan uploaded files
- **Encryption** - Encrypt sensitive data

## 8. Performance Optimization

### 8.1 Frontend
- **Mobile-First Design** - UI/UX dioptimalkan untuk mobile devices
- **Progressive Web App (PWA)** - Offline capability dan native app experience
- **Video Compression** - Client-side compression sebelum upload untuk performa optimal
- **Lazy Loading** - Load components on demand
- **Caching** - Cache frequently accessed data

### 8.2 Backend
- **High-Performance Upload** - Optimized file handling untuk upload cepat
- **Connection Pooling** - Database connection management
- **Caching** - Redis untuk session dan frequently accessed data
- **File Streaming** - Stream video files instead of loading entirely
- **Concurrent Processing** - Handle multiple uploads simultaneously

## 9. Deployment Strategy

### 9.1 Development Environment
- **Docker Compose** - Local development setup
- **Hot Reload** - Fast development iteration

### 9.2 Production Environment
- **Local Server Deployment** - Deploy langsung di server lokal
- **Docker Containers** - Containerized deployment untuk consistency
- **Nginx Reverse Proxy** - Untuk routing dan SSL termination
- **SSL/TLS** - HTTPS encryption
- **Monitoring** - Application monitoring dan logging
- **Backup Strategy** - Automated backup untuk database dan file storage

## 10. Timeline & Milestones

### Phase 1: Foundation (2-3 weeks)
- [ ] Setup project structure
- [ ] Database design dan implementation
- [ ] Traditional authentication system (username/password)
- [ ] WebAuthn integration dengan multi-device support
- [ ] Mobile-first UI framework setup

### Phase 2: Core Features (3-4 weeks)
- [ ] High-performance video upload functionality
- [ ] File management system dengan local storage
- [ ] User management interface (tanpa registration)
- [ ] Mobile-optimized UI/UX implementation
- [ ] Video compression dan optimization

### Phase 3: Enhancement (2-3 weeks)
- [ ] File explorer dengan advanced features
- [ ] Performance optimization untuk mobile
- [ ] Security hardening
- [ ] PWA implementation
- [ ] Testing dan bug fixes

### Phase 4: Deployment (1-2 weeks)
- [ ] Local server deployment
- [ ] Monitoring setup
- [ ] Backup strategy implementation
- [ ] Documentation
- [ ] User training

## 11. Risk Assessment & Mitigation

### 11.1 Technical Risks
- **WebAuthn Browser Support** - Implement traditional login sebagai primary method
- **Mobile Performance** - Optimize untuk mobile devices dan network conditions
- **Video Upload Performance** - Implement client-side compression dan chunked upload
- **Local Storage Management** - Implement proper backup dan cleanup strategy

### 11.2 Security Risks
- **Biometric Data Privacy** - Local storage, no server-side biometric data
- **File Upload Security** - Strict validation dan virus scanning
- **Session Management** - Secure JWT implementation
- **Local Network Security** - Implement proper network security untuk deployment lokal

## 12. Conclusion

Project ini dirancang dengan fokus pada:
1. **Mobile-First Experience** - UI/UX dioptimalkan untuk mobile devices
2. **High Performance** - Upload cepat dan responsive untuk produktivitas user
3. **Local Deployment** - Kontrol penuh atas data dan infrastruktur
4. **Security** - Multi-layer security approach dengan WebAuthn
5. **Maintainability** - Clean code dan proper documentation

Dengan tech stack yang dipilih dan architecture yang direncanakan, project ini dapat memberikan solusi yang robust, performant, dan aman untuk kebutuhan video upload dan management system dengan deployment lokal. 