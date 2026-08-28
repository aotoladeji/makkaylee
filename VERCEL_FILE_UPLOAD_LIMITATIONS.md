# Vercel Deployment Limitations & Solutions

## File Upload Endpoints - Vercel Limitation

**Affected Endpoints:**
- `POST /api/billing/receipt` - Upload payment receipt
- `POST /api/admin/sponsors` - Create sponsor with logo
- `POST /api/admin/registrations/:id/passport` - Upload passport photo
- `POST /api/admin/registrations/:id/receipt` - Upload receipt

**Problem:**
Vercel Functions (serverless) don't support direct file uploads. The `multipart/form-data` format cannot be processed in the Vercel handler.

**Solution Options:**

### Option 1: Use Backend Server for File Uploads ✅ RECOMMENDED
For development and local deployments, the backend Express server at `http://localhost:5000` fully supports file uploads with multer.

**Frontend Configuration:**
```javascript
// Use backend server for file uploads
const BACKEND_API = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : process.env.REACT_APP_BACKEND_URL || '/api';

// For file uploads, always use backend
const UPLOAD_API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

// Use UPLOAD_API for:
// - POST /api/billing/receipt
// - POST /api/admin/sponsors
// - POST /api/admin/registrations/:id/passport
// - POST /api/admin/registrations/:id/receipt

// Use BACKEND_API or regular API for other endpoints
```

### Option 2: Implement External Storage Service
Use AWS S3, Cloudinary, or similar:

1. **Cloudinary** (Recommended for quick setup)
   ```javascript
   // Upload directly to Cloudinary from frontend
   const formData = new FormData();
   formData.append('file', file);
   formData.append('upload_preset', 'YOUR_PRESET');
   
   const res = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD/image/upload', {
     method: 'POST',
     body: formData
   });
   
   const { secure_url } = await res.json();
   
   // Then send secure_url to your API
   await fetch(`${API}/admin/sponsors`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name,
       type,
       description,
       websiteUrl,
       logoUrl: secure_url  // URL instead of file
     })
   });
   ```

2. **AWS S3**
   - Pre-sign URLs on backend
   - Upload directly from frontend
   - Send URL to API

### Option 3: Update Backend to Accept URLs Only
For Vercel deployment, modify the API to accept URLs instead of files:

**Current Endpoint (File Upload):**
```javascript
POST /api/admin/sponsors
Content-Type: multipart/form-data

name=Sponsor Name
type=sponsor
description=Description
websiteUrl=https://example.com
logo=<binary file data>
```

**Updated Endpoint (URL Only):**
```javascript
POST /api/admin/sponsors
Content-Type: application/json

{
  "name": "Sponsor Name",
  "type": "sponsor",
  "description": "Description",
  "websiteUrl": "https://example.com",
  "logoUrl": "https://cdn.example.com/logo.png"
}
```

**Vercel Handler Update:**
```javascript
async function handleCreateSponsor(req, res, user) {
  if (!user.isAdmin) return jsonResponse(res, 403, { error: 'Forbidden' });
  
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('multipart/form-data')) {
    return jsonResponse(res, 400, { 
      error: 'File uploads not supported. Send logoUrl as JSON instead of uploading files.' 
    });
  }

  const body = await getRequestBody(req);
  const { name, type, description, websiteUrl, logoUrl } = body;

  if (!name || (type !== 'sponsor' && type !== 'partner')) {
    return jsonResponse(res, 400, { error: 'Name and valid type are required' });
  }

  try {
    await run(
      'INSERT INTO Sponsor (name, type, description, websiteUrl, logoUrl, isPublished, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [name, type, description || '', websiteUrl || '', logoUrl || '']
    );
    jsonResponse(res, 200, { message: 'Sponsor created' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}
```

---

## Current Status

### ✅ Working on All Platforms
- User login/registration
- Profile management
- Child management
- Billing info viewing
- Training event viewing
- Gallery viewing (YouTube URLs)
- Sponsor viewing
- Admin user management
- Admin registration management
- Payment configuration
- Staff management

### ⚠️ File Uploads - Backend Only (Not on Vercel)
- Payment receipts
- Sponsor logos
- Passport photos
- Gallery file uploads (use YouTube URLs on Vercel)

---

## Recommended Setup for Production

### Development Environment
Use backend server for ALL operations including file uploads:
```bash
npm start  # Runs both backend and frontend
# Frontend hits: http://localhost:5000/api
# Supports all endpoints including file uploads
```

### Production Environment (Vercel + Backend)
Deploy both:
1. **Frontend + API Handler** → Vercel
   - Fast, scalable
   - Handles read operations
   - Returns 400 error for file uploads with helpful message

2. **Backend Server** → Heroku, Railway, or other platform
   - Handles file uploads
   - Processes multer uploads
   - Supports full feature set

3. **Database** → Turso (serverless SQLite)
   - Works with both Vercel and backend
   - Uses same connection string

**Frontend Configuration for Production:**
```javascript
// constants/api.js
const developmentApi = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const productionApi = process.env.REACT_APP_API_URL || "https://yourdomain.vercel.app/api";
const backendApi = process.env.REACT_APP_BACKEND_URL || productionApi;

export const API = process.env.NODE_ENV === "development" ? developmentApi : productionApi;
export const UPLOAD_API = backendApi;  // Always use backend for file uploads

// In AdminDashboard.js, use UPLOAD_API for file operations
import { API, UPLOAD_API } from '../../constants/api';

// File upload operations
const res = await fetch(`${UPLOAD_API}/admin/sponsors`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});

// Other operations
const res = await fetch(`${API}/admin/users`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## Error Messages Explained

**"File uploads are not supported on Vercel"**
- Cause: Trying to upload a file via FormData
- Solution: Use backend server or external storage service
- Environment: Production (Vercel)

**"Use JSON with YouTube URLs for serverless deployment"**
- Cause: Trying to upload image files to gallery
- Solution: Use YouTube video URLs instead on Vercel
- Environment: Production (Vercel)
- Workaround: Use backend server for image uploads

---

## Migration Guide: File Uploads to External Storage

### Step 1: Choose Service (Cloudinary)
1. Sign up at https://cloudinary.com
2. Get Cloud Name and Upload Preset

### Step 2: Update Frontend
```javascript
// Create cloudinary upload handler
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'YOUR_PRESET');
  
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/YOUR_CLOUD/image/upload`,
    { method: 'POST', body: formData }
  );
  
  const data = await res.json();
  return data.secure_url;
}

// Use in sponsor creation
const handleSponsorSubmit = async (sponsorForm) => {
  let logoUrl = '';
  
  if (sponsorForm.logo) {
    logoUrl = await uploadToCloudinary(sponsorForm.logo);
  }
  
  const res = await fetch(`${API}/admin/sponsors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: sponsorForm.name,
      type: sponsorForm.type,
      description: sponsorForm.description,
      websiteUrl: sponsorForm.websiteUrl,
      logoUrl
    })
  });
};
```

### Step 3: Update Database Schema
Add `logoUrl` column to Sponsor table:
```sql
ALTER TABLE Sponsor ADD COLUMN logoUrl TEXT;
```

### Step 4: Update API Handler
```javascript
async function handleCreateSponsor(req, res, user) {
  // ... existing checks ...
  
  const { name, type, description, websiteUrl, logoUrl } = body;
  
  await run(
    'INSERT INTO Sponsor (name, type, description, websiteUrl, logoUrl, isPublished, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [name, type, description || '', websiteUrl || '', logoUrl || '']
  );
}
```

---

**Last Updated:** 2026-08-28  
**Status:** Current limitations documented, solutions provided
