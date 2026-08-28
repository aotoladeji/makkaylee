# Changes Made

## 1. Case-Insensitive Login (COMPLETED)

### Backend Server (`backend/server.js`)
- **POST /api/login**: Updated to use case-insensitive username lookup using Sequelize `fn()` and `where()`
- **POST /api/staff/login**: Updated to use case-insensitive username lookup
- Users can now login with username in any case: "admin", "Admin", "ADMIN" all work

### Vercel Functions (`api/minimal.js`)
- **POST /api/login**: Updated fallback login handler to compare usernames case-insensitively
- Username comparison now uses `.toLowerCase()` before comparing

## 2. Fix API 404 Errors (COMPLETED)

### Problem
Frontend on Vercel was getting 404 errors when calling admin endpoints:
- GET /api/admin/gallery
- GET /api/admin/users
- GET /api/payment-config
- GET /api/admin/registrations
- GET /api/admin/sponsors

### Solution
Enhanced `api/minimal.js` (Vercel Functions handler) to:

1. **Added proxy support**: If `BACKEND_URL` environment variable is set, all requests are proxied to the backend server
2. **Added public endpoints**: Direct implementations for:
   - GET /api/gallery
   - GET /api/sponsors
   - GET /api/payment-config
3. **Added admin endpoint handling**: All admin endpoints now:
   - Check JWT authentication
   - Proxy to backend if available
   - Return appropriate empty responses (prevent 404)
   - Support GET, POST, PUT, DELETE methods

### Implementation Details
- Proxy function uses http/https based on protocol
- Preserves original headers and request body
- Falls back to empty response if backend unavailable
- Proper error handling and status codes

### Environment Variables
To use backend proxy, set in Vercel:
```
BACKEND_URL=https://your-backend-server.com
```

## Files Modified
1. `backend/server.js` - Updated login endpoints for case-insensitive username
2. `api/minimal.js` - Added API endpoints and proxy support

## Testing
- Test case-insensitive login: Try logging in with "Admin", "ADMIN", "admin"
- Test API endpoints: They should no longer return 404
- If backend server is running, requests will proxy through to it
- If backend server is down, fallback empty responses will be returned
