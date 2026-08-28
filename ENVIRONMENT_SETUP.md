# Environment Variables & Deployment Guide

## 🚀 Vercel Deployment Configuration

### Required Environment Variables for Vercel

These variables MUST be set in your Vercel project settings for the API to work:

#### **Database Connection (Turso SQLite)**
```
TURSO_CONNECTION_URL=libsql://[database-name].turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Get these from: https://console.turso.io/
- Format: `TURSO_CONNECTION_URL` is the database URL
- `TURSO_AUTH_TOKEN` is the authentication token

#### **JWT Authentication**
```
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=1d
```
- `JWT_SECRET`: Long random string (minimum 32 characters recommended)
- `JWT_EXPIRE`: Token expiration time (e.g., '1d', '7d', '24h')
- **IMPORTANT**: Change the default secret in production!

Generate a secure secret:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random -Count 32 | %{[char]$_} | Join-String)))
```

---

## 📋 Complete Endpoint Status

### ✓ PUBLIC ENDPOINTS (38 total - ALL IMPLEMENTED)

#### Authentication & User Management
- `POST /api/login` - Parent login
- `POST /api/register` - Register new parent + child
- `POST /api/staff/login` - Staff login
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Complete password reset

#### Public Information
- `GET /api/training-event` - Current training event details
- `GET /api/payment-config` - Payment configuration
- `GET /api/gallery` - Published gallery media
- `GET /api/sponsors?type=sponsor|partner` - Sponsors/partners list
- `GET /api/hello` - Health check endpoint

### ✓ PARENT/USER ENDPOINTS (8 total - ALL IMPLEMENTED)
Requires: Authorization header with valid JWT token

#### Child Management
- `POST /api/children` - Add new child
- `GET /api/children` - List all children (via /api/profile)
- `PUT /api/children/:id` - Update child profile
- `DELETE /api/children/:id` - Delete child profile

#### Profile & Billing
- `GET /api/profile` - Get complete profile with all children
- `PUT /api/profile` - Update parent information
- `GET /api/billing` - Get billing information
- `POST /api/change-password` - Change password

### ✓ STAFF ENDPOINTS (3 total - ALL IMPLEMENTED)
Requires: Authorization header with valid staff token

- `GET /api/staff/profile` - Get staff profile
- `PUT /api/staff/profile` - Update staff profile
- `POST /api/staff/login` - Staff login (same as public but staff-only response)

### ✓ ADMIN ENDPOINTS (18+ total - ALL IMPLEMENTED)
Requires: Authorization header with admin token + isAdmin flag

#### User Management
- `GET /api/admin/users` - List all users
- `POST /api/admin/staff` - Create staff account
- `PUT /api/admin/staff/:id` - Update staff account
- `POST /api/admin/change-password` - Change password (admin-only)

#### Registration Management
- `GET /api/admin/registrations` - List all registrations with billing
- `PUT /api/admin/registrations/:id` - Update player information
- `POST /api/admin/registrations/:id/confirm-payment` - Confirm payment
- `PUT /api/admin/registrations/:id/badges` - Assign badges (10 types)

#### Configuration
- `PUT /api/admin/payment-config` - Update payment settings
- `PUT /api/admin/training-event` - Update training event notification

#### Gallery Management
- `GET /api/admin/gallery` - List all gallery items
- `POST /api/admin/gallery/upload` - Upload media (YouTube URLs only on Vercel)
- `DELETE /api/admin/gallery/:id` - Delete gallery item

#### Sponsors/Partners
- `GET /api/admin/sponsors` - List all sponsors
- `POST /api/admin/sponsors` - Create sponsor entry
- `DELETE /api/admin/sponsors/:id` - Delete sponsor

---

## 🔧 Local Development Setup

### Prerequisites
- Node.js 16+ and npm
- SQLite3
- A Turso account (for Vercel) OR local SQLite for backend

### Backend Server Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup database**
   ```bash
   # Copy database from root or create new
   npm run sync
   npm run seed:default-user
   ```

3. **Create `.env` file in backend folder**
   ```
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_EXPIRE=1d
   NODE_ENV=development
   ```

4. **Start backend server**
   ```bash
   npm start
   ```
   Server runs at `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env.local` in root**
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   Frontend runs at `http://localhost:3000`

### Run Endpoint Tests

```bash
# Test against backend server
node test-endpoints.js http://localhost:5000 backend

# Test against Vercel deployment
node test-endpoints.js https://yourdomain.vercel.app backend
```

---

## ✅ Verification Checklist

- [ ] Backend server starts without errors
- [ ] Database synchronizes successfully
- [ ] Default admin user created (username: admin, password: password)
- [ ] JWT_SECRET is set in environment
- [ ] TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN set on Vercel
- [ ] API login endpoint returns valid JWT token
- [ ] No 404 errors on any endpoint
- [ ] Admin endpoints require isAdmin flag
- [ ] Staff endpoints require isStaff flag
- [ ] Parent endpoints accessible with valid token
- [ ] Password change works correctly
- [ ] Payment config accessible publicly
- [ ] Gallery endpoints work (upload disabled on Vercel)

---

## 🐛 Known Limitations on Vercel

### File Uploads (Serverless)
- Passport photo upload → Returns error
- Billing receipt upload → Returns error
- Gallery logo upload → Returns error
- **Solution**: Use external storage (AWS S3, Cloudinary, etc.)

### Email Notifications (Serverless)
- Password reset emails → Logged to console in dev
- **Solution**: Integrate SendGrid, AWS SES, or similar service

### Gallery Media (Vercel)
- Direct file uploads → Not supported
- YouTube URLs → Fully supported ✓
- **Note**: Backend supports file uploads; only Vercel functions disabled

---

## 🚀 Vercel Deployment Steps

### 1. Connect Repository
```bash
npm install -g vercel
vercel
```

### 2. Set Environment Variables
Go to Vercel Dashboard → Settings → Environment Variables

Add:
- `TURSO_CONNECTION_URL`
- `TURSO_AUTH_TOKEN`
- `JWT_SECRET`
- `JWT_EXPIRE`

### 3. Configure Build Command
In vercel.json (already configured):
```json
"buildCommand": "npm run build"
```

### 4. Deploy
```bash
vercel --prod
```

### 5. Test Deployment
```bash
node test-endpoints.js https://yourdomain.vercel.app backend
```

---

## 📊 API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing/invalid fields) |
| 401 | Unauthorized (invalid credentials/token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (endpoint doesn't exist) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (DB not connected) |

---

## 🔍 Troubleshooting

### "Unauthorized" on Protected Endpoints
- Check Authorization header format: `Bearer [token]`
- Verify JWT_SECRET matches between backend and Vercel
- Ensure token hasn't expired

### "Database not initialized"
- Check TURSO_CONNECTION_URL format
- Verify TURSO_AUTH_TOKEN is correct
- Run `npm run sync` on backend

### "Invalid credentials" on login
- Ensure default user created: `npm run seed:default-user`
- Check username spelling (case-insensitive)
- Verify password (default: "password")

### 404 Errors on Endpoints
- Verify API route path is correct
- Check endpoint is implemented in api/minimal.js
- Ensure method matches (GET, POST, PUT, DELETE)
- Review test output with `node test-endpoints.js`

---

## 📞 Support

For issues or questions:
1. Review endpoint list above
2. Check test output: `node test-endpoints.js`
3. Verify environment variables set correctly
4. Check console logs in Vercel deployment
