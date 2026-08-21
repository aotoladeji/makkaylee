/**
 * Minimal Vercel Function API Handler
 * No dependencies on Sequelize or sqlite3.
 * Handles critical endpoints with fallback data.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';

// Hardcoded seeded user
const DEFAULT_USER = {
  id: 1,
  username: 'admin',
  passwordHash: '$2b$10$KTU6mVnY8eA4fDb68N5Vu.CvBr/gDgUwGM8yFYUVwsV2GtBRcRyhC', // oladeji
  isAdmin: true,
  isStaff: false,
};

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
          if (username === DEFAULT_USER.username) {
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
