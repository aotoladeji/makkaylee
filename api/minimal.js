/**
 * Vercel Function API Handler
 * Handles critical endpoints including admin operations.
 * Attempts to proxy to backend server, falls back to empty responses.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const https = require('https');

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';
const BACKEND_URL = process.env.BACKEND_URL || '';

// Hardcoded seeded user
const DEFAULT_USER = {
  id: 1,
  username: 'admin',
  passwordHash: '$2b$10$KTU6mVnY8eA4fDb68N5Vu.CvBr/gDgUwGM8yFYUVwsV2GtBRcRyhC', // oladeji
  isAdmin: true,
  isStaff: false,
};

// Helper function to proxy requests to backend
async function proxyToBackend(method, pathname, headers, body) {
  if (!BACKEND_URL) return null;
  
  return new Promise((resolve) => {
    const url = new URL(pathname, BACKEND_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        ...headers,
        host: url.host,
      },
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data, headers: res.headers });
      });
    });
    
    req.on('error', () => resolve(null));
    if (body) req.write(body);
    req.end();
  });
}

// Middleware to check JWT
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function handleRequest(req, res) {
  try {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Route: GET /api/training-event
    if (pathname === '/api/training-event' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        data: {
          id: 1,
          title: 'Next Training Session',
          dateLabel: 'April 4, 2026',
          venue: 'International School Ibadan, University of Ibadan',
          note: 'Open to all new registrants',
        },
      }));
      return;
    }

    // Route: POST /api/login
    if (pathname === '/api/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString('utf8');
        if (body.length > 1e6) {
          res.writeHead(413);
          res.end('Payload too large');
        }
      });
      req.on('end', async () => {
        try {
          const { username, password } = JSON.parse(body);
          if (username.toLowerCase() === DEFAULT_USER.username.toLowerCase()) {
            const match = await bcrypt.compare(password, DEFAULT_USER.passwordHash);
            if (match) {
              const token = jwt.sign(
                { id: DEFAULT_USER.id, isAdmin: DEFAULT_USER.isAdmin, isStaff: DEFAULT_USER.isStaff },
                SECRET,
                { expiresIn: JWT_EXPIRE }
              );
              res.setHeader('Content-Type', 'application/json');
              res.writeHead(200);
              res.end(JSON.stringify({ token }));
              return;
            }
          }
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(400);
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Route: GET /api/payment-config
    if (pathname === '/api/payment-config' && req.method === 'GET') {
      if (BACKEND_URL) {
        const backendRes = await proxyToBackend('GET', '/api/payment-config', {}, null);
        if (backendRes) {
          res.setHeader('Content-Type', backendRes.headers['content-type'] || 'application/json');
          res.writeHead(backendRes.status);
          res.end(backendRes.body);
          return;
        }
      }
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        data: {
          id: 1,
          oneTimeRegistrationFee: 40000,
          trainingSessionFee: 30000,
          bundleMonths: 0,
          monthlyBundleFee: 0,
          oneTimeTotal: 70000,
          bundleTotal: 70000,
          recurringOneTimeTotal: 70000,
          recurringBundleTotal: 70000,
          hasBundleOption: false,
        },
      }));
      return;
    }

    // Route: GET /api/gallery
    if (pathname === '/api/gallery' && req.method === 'GET') {
      if (BACKEND_URL) {
        const backendRes = await proxyToBackend('GET', '/api/gallery', {}, null);
        if (backendRes) {
          res.setHeader('Content-Type', backendRes.headers['content-type'] || 'application/json');
          res.writeHead(backendRes.status);
          res.end(backendRes.body);
          return;
        }
      }
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ data: [] }));
      return;
    }

    // Route: GET /api/sponsors
    if (pathname === '/api/sponsors' && req.method === 'GET') {
      if (BACKEND_URL) {
        const backendRes = await proxyToBackend('GET', '/api/sponsors', {}, null);
        if (backendRes) {
          res.setHeader('Content-Type', backendRes.headers['content-type'] || 'application/json');
          res.writeHead(backendRes.status);
          res.end(backendRes.body);
          return;
        }
      }
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify([]));
      return;
    }

    // Admin endpoints - proxy to backend or return empty data
    const adminEndpoints = [
      { path: /^\/api\/admin\/users$/, methods: ['GET'] },
      { path: /^\/api\/admin\/gallery/, methods: ['GET', 'POST', 'DELETE'] },
      { path: /^\/api\/admin\/registrations/, methods: ['GET', 'PUT', 'POST'] },
      { path: /^\/api\/admin\/sponsors/, methods: ['GET', 'POST', 'DELETE'] },
      { path: /^\/api\/admin\/staff/, methods: ['POST', 'PUT', 'DELETE'] },
      { path: /^\/api\/admin\/.*/, methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    ];

    const isAdminEndpoint = adminEndpoints.some(ep => ep.path.test(pathname) && ep.methods.includes(req.method));

    if (isAdminEndpoint) {
      // Check auth first
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'No token' }));
        return;
      }

      const token = authHeader.split(' ')[1];
      let user;
      try {
        user = jwt.verify(token, SECRET);
        if (!user.isAdmin) {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(403);
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }
      } catch {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Invalid token' }));
        return;
      }

      // Try to proxy to backend
      if (BACKEND_URL) {
        let body = '';
        if (req.method !== 'GET' && req.method !== 'DELETE') {
          body = await new Promise((resolve) => {
            let data = '';
            req.on('data', chunk => { data += chunk; });
            req.on('end', () => resolve(data));
          });
        }

        const backendRes = await proxyToBackend(req.method, pathname, req.headers, body);
        if (backendRes) {
          res.setHeader('Content-Type', backendRes.headers['content-type'] || 'application/json');
          res.writeHead(backendRes.status);
          res.end(backendRes.body);
          return;
        }
      }

      // Fallback: return appropriate empty response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      if (pathname === '/api/admin/users') {
        res.end(JSON.stringify({ data: [] }));
      } else if (pathname === '/api/admin/gallery') {
        res.end(JSON.stringify({ data: [] }));
      } else if (pathname === '/api/admin/registrations') {
        res.end(JSON.stringify({ data: [] }));
      } else if (pathname === '/api/admin/sponsors') {
        res.end(JSON.stringify([]));
      } else {
        res.end(JSON.stringify({ data: [] }));
      }
      return;
    }

    // 404
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('API error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

module.exports = handleRequest;
