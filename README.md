# RA Room Report - Video Upload & Management System

A web application for video upload and management with biometric authentication and user management features.

## Features

- **Biometric Authentication** - WebAuthn support for fingerprint, face recognition, etc.
- **Traditional Authentication** - Username/password login
- **Video Recording & Upload** - Capture and upload videos directly from browser
- **User Management** - Role-based access control (User, Manager, Supervisor)
- **Room Management** - Organize videos by room numbers
- **File Explorer** - Search and manage uploaded videos
- **Mobile-First Design** - Optimized for mobile devices

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **WebAuthn API** - Biometric authentication

### Backend
- **Golang** - High-performance backend
- **Gin Framework** - Web framework
- **GORM** - ORM for database
- **JWT** - Session management
- **PostgreSQL** - Database

## Project Structure

```
trialuploadhk/
├── frontend/          # Next.js frontend application
├── backend/           # Golang backend application
├── database/          # Database scripts and migrations
├── docs/             # Documentation
└── PROJECT_DESIGN.md # Project design document
```

## Prerequisites

- **Node.js** (v18 or higher)
- **Go** (v1.21 or higher)
- **PostgreSQL** (v12 or higher)

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd trialuploadhk
```

### 2. Setup Database
Install PostgreSQL and create a database:
```sql
CREATE DATABASE trialuploadhk;
```

### 3. Setup Backend
```bash
cd backend

# Install dependencies
go mod tidy

# Configure environment
# Edit config.env file with your database credentials

# Run the server
go run main.go
```

The backend will start on `http://0.0.0.0:8080` (accessible from network)

### 4. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## Default Admin User

When the backend starts for the first time, it creates a default admin user:

- **Username**: `admin`
- **Password**: `password`
- **Role**: `supervisor`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Traditional login
- `POST /api/auth/webauthn/register` - WebAuthn registration
- `POST /api/auth/webauthn/authenticate` - WebAuthn login
- `GET /api/auth/webauthn/credentials` - List credentials
- `DELETE /api/auth/webauthn/credentials/:id` - Delete credential

### Videos
- `POST /api/videos/upload` - Upload video
- `GET /api/videos` - List videos
- `GET /api/videos/:id` - Get video details
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/:id/stream` - Stream video

### Rooms (Manager/Supervisor only)
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Users (Manager/Supervisor only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Configuration

### Backend Configuration (`backend/config.env`)
```env
# Server Configuration
PORT=8080
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=trialuploadhk
DB_SSLMODE=disable

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h

# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=RA Room Report
WEBAUTHN_RP_ORIGIN=http://localhost:3000

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=1073741824
```

## Development

### Backend Development
```bash
cd backend
go run main.go
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Database Migrations
The application uses GORM auto-migration. Tables are created automatically when the backend starts.

## Security Features

- **JWT Authentication** - Secure session management
- **WebAuthn** - Biometric authentication
- **Role-based Access Control** - User permissions
- **CORS Configuration** - Network access control
- **File Validation** - Upload security

## Deployment

### Local Network Deployment
The backend is configured to run on `0.0.0.0:8080` to allow access from other devices on the same network.

### Production Considerations
- Change default JWT secret
- Configure proper database credentials
- Set up SSL/TLS certificates
- Configure firewall rules
- Set up backup strategy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software.

## Support

For support and questions, please contact the development team. 