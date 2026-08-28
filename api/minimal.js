/**
 * Vercel Serverless Functions API Handler with Turso Database
 * Handles all backend operations for Vercel-only deployment
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query, run } = require('./db');

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';

// ─────────────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────

function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 ? parts[1] : null;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// RESPONSE HELPERS
// ─────────────────────────────────────────────────────────────────────────

function jsonResponse(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ─────────────────────────────────────────────────────────────────────────
// REQUEST BODY PARSER
// ─────────────────────────────────────────────────────────────────────────

function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}


// ─────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────

async function handleLogin(req, res) {
  const body = await getRequestBody(req);
  const { username, password } = body;

  if (!username || !password) {
    return jsonResponse(res, 400, { error: 'Username and password required' });
  }

  try {
    const rows = await query(
      'SELECT id, username, password, isAdmin, isStaff FROM User WHERE LOWER(username) = LOWER(?)',
      [username]
    );

    if (!rows.length) {
      return jsonResponse(res, 401, { error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return jsonResponse(res, 401, { error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin, isStaff: user.isStaff },
      SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    jsonResponse(res, 200, { token });
  } catch (err) {
    console.error('Login error:', err.message);
    
    // Check if it's a database connection error
    if (err.message.includes('no such table') || err.message.includes('not connected')) {
      return jsonResponse(res, 503, { error: 'Database not initialized. Check TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN environment variables.' });
    }
    
    jsonResponse(res, 400, { error: 'Login failed. Please try again.' });
  }
}

async function handleStaffLogin(req, res) {
  const body = await getRequestBody(req);
  const { username, password } = body;

  if (!username || !password) {
    return jsonResponse(res, 400, { error: 'Username and password required' });
  }

  try {
    const rows = await query(
      'SELECT id, username, password, isAdmin, isStaff FROM User WHERE LOWER(username) = LOWER(?) AND isStaff = 1',
      [username]
    );

    if (!rows.length) {
      return jsonResponse(res, 401, { error: 'Invalid staff credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return jsonResponse(res, 401, { error: 'Invalid staff credentials' });
    }

    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin, isStaff: user.isStaff },
      SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    jsonResponse(res, 200, { token });
  } catch (err) {
    console.error('Staff login error:', err.message);
    
    // Check if it's a database connection error
    if (err.message.includes('no such table') || err.message.includes('not connected')) {
      return jsonResponse(res, 503, { error: 'Database not initialized. Check TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN environment variables.' });
    }
    
    jsonResponse(res, 400, { error: 'Login failed. Please try again.' });
  }
}

async function handleGetTrainingEvent(req, res) {
  try {
    const rows = await query('SELECT * FROM TrainingEvent WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');
    
    if (rows.length) {
      jsonResponse(res, 200, { data: rows[0] });
    } else {
      // Return default event
      jsonResponse(res, 200, {
        data: {
          id: 1,
          title: 'Next Training Session',
          dateLabel: 'April 4, 2026',
          venue: 'International School Ibadan, University of Ibadan',
          note: 'Open to all new registrants',
          isActive: 1,
        },
      });
    }
  } catch (err) {
    console.error('Get training event error:', err);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleUpdateTrainingEvent(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const { title, dateLabel, venue, note } = body;

  if (!title || !dateLabel || !venue) {
    return jsonResponse(res, 400, { error: 'Title, date label, and venue are required' });
  }

  try {
    // Get or create active event
    const rows = await query('SELECT id FROM TrainingEvent WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');
    
    if (rows.length) {
      const eventId = rows[0].id;
      await run(
        'UPDATE TrainingEvent SET title = ?, dateLabel = ?, venue = ?, note = ? WHERE id = ?',
        [title, dateLabel, venue, note || '', eventId]
      );
      jsonResponse(res, 200, { message: 'Training event updated successfully' });
    } else {
      // Create new event
      await run(
        'INSERT INTO TrainingEvent (title, dateLabel, venue, note, isActive) VALUES (?, ?, ?, ?, 1)',
        [title, dateLabel, venue, note || '']
      );
      jsonResponse(res, 200, { message: 'Training event created successfully' });
    }
  } catch (err) {
    console.error('Update training event error:', err);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetPaymentConfig(req, res) {
  try {
    const rows = await query('SELECT * FROM PaymentConfig WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');
    
    if (rows.length) {
      const config = rows[0];
      jsonResponse(res, 200, {
        data: {
          ...config,
          hasBundleOption: Number(config.monthlyBundleFee || 0) > 0,
        },
      });
    } else {
      // Return default config
      jsonResponse(res, 200, {
        data: {
          id: 1,
          oneTimeRegistrationFee: 40000,
          trainingSessionFee: 30000,
          bundleMonths: 0,
          monthlyBundleFee: 0,
          hasBundleOption: false,
        },
      });
    }
  } catch (err) {
    console.error('Get payment config error:', err);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleDeleteGallery(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return jsonResponse(res, 400, { error: 'Gallery ID is required' });
  }

  try {
    await run('DELETE FROM GalleryMedia WHERE id = ?', [id]);
    jsonResponse(res, 200, { message: 'Gallery media deleted successfully' });
  } catch (err) {
    console.error('Delete gallery error:', err);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetPublicGallery(req, res) {
  try {
    const rows = await query('SELECT * FROM GalleryMedia WHERE isPublished = 1 ORDER BY createdAt DESC');
    console.log('✅ Fetched gallery items:', rows.length, 'items');
    if (rows.length > 0) {
      console.log('📸 First item:', rows[0]);
    }
    jsonResponse(res, 200, { data: rows });
  } catch (err) {
    console.error('❌ Get gallery error:', err.message);
    jsonResponse(res, 200, { data: [] });
  }
}

async function handleGetAdminGallery(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query('SELECT * FROM GalleryMedia ORDER BY createdAt DESC');
    console.log('✅ Admin fetched gallery items:', rows.length, 'items');
    jsonResponse(res, 200, { data: rows });
  } catch (err) {
    console.error('❌ Get admin gallery error:', err.message);
    jsonResponse(res, 200, { data: [] });
  }
}

async function handleGetPublicSponsors(req, res) {
  try {
    const rows = await query('SELECT * FROM Sponsor WHERE isPublished = 1 ORDER BY createdAt DESC');
    jsonResponse(res, 200, rows);
  } catch (err) {
    console.error('Get sponsors error:', err);
    jsonResponse(res, 200, []);
  }
}

async function handleGetAdminSponsors(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query('SELECT * FROM Sponsor ORDER BY createdAt DESC');
    jsonResponse(res, 200, rows);
  } catch (err) {
    console.error('Get admin sponsors error:', err);
    jsonResponse(res, 200, []);
  }
}

async function handleGetAdminUsers(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query('SELECT id, username, email, parentName, phone, isAdmin, isStaff, createdAt FROM User');
    jsonResponse(res, 200, { data: rows });
  } catch (err) {
    console.error('Get users error:', err);
    jsonResponse(res, 200, { data: [] });
  }
}

async function handleGetAdminRegistrations(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query(`
      SELECT r.*, u.parentName, u.email, u.phone, b.amountDue, b.registrationFee, b.trainingSessionFee, 
             b.bundleMonths, b.bundleFee, b.paymentMode, b.selectedAmount, b.paid, b.paymentConfirmedAt
      FROM Registration r
      LEFT JOIN User u ON r.userId = u.id
      LEFT JOIN BillingInfo b ON r.id = b.registrationId
      ORDER BY r.createdAt DESC
    `);
    jsonResponse(res, 200, { data: rows });
  } catch (err) {
    console.error('Get registrations error:', err);
    jsonResponse(res, 200, { data: [] });
  }
}

async function handleUploadGallery(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      // JSON request (for YouTube URLs)
      const body = await getRequestBody(req);
      const { title, caption, youtubeUrl } = body;

      if (!title) {
        return jsonResponse(res, 400, { error: 'Media title is required' });
      }

      if (!youtubeUrl) {
        return jsonResponse(res, 400, { error: 'YouTube URL is required' });
      }

      if (!/youtube\.com\/watch|youtu\.be\//.test(youtubeUrl)) {
        return jsonResponse(res, 400, { error: 'Invalid YouTube URL' });
      }

      // Insert into database
      const insertResult = await run(
        `INSERT INTO GalleryMedia (title, caption, mediaType, mediaUrl, mimeType, isPublished, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [title, caption || '', 'video', youtubeUrl, 'youtube', 1]
      );

      console.log('✅ Gallery upload inserted:', { title, youtubeUrl });

      // Fetch all gallery items to ensure fresh data
      const allRows = await query(
        'SELECT * FROM GalleryMedia WHERE isPublished = 1 ORDER BY createdAt DESC LIMIT 1'
      );

      if (allRows.length > 0) {
        const created = allRows[0];
        console.log('✅ Gallery upload confirmed:', created);
        return jsonResponse(res, 200, { message: 'Media uploaded successfully', data: created });
      }

      // Fallback: return the object we just created
      const fallback = { title, caption: caption || '', mediaType: 'video', mediaUrl: youtubeUrl, mimeType: 'youtube', isPublished: 1 };
      console.log('⚠️ Could not retrieve inserted record, returning fallback:', fallback);
      return jsonResponse(res, 200, { message: 'Media uploaded successfully', data: fallback });
    } else {
      // For multipart form data (file uploads), we need busboy or similar
      // For now, return error with instructions to use JSON with YouTube URL
      return jsonResponse(res, 400, {
        error: 'File uploads require external storage setup. Use YouTube URLs for now.',
      });
    }
  } catch (err) {
    console.error('❌ Upload gallery error:', err.message);
    return jsonResponse(res, 400, { error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  try {
    corsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // ─── PUBLIC ENDPOINTS ────────────────────────────────────────────────

    // POST /api/login
    if (pathname === '/api/login' && req.method === 'POST') {
      return handleLogin(req, res);
    }

    // POST /api/staff/login
    if (pathname === '/api/staff/login' && req.method === 'POST') {
      return handleStaffLogin(req, res);
    }

    // GET /api/training-event
    if (pathname === '/api/training-event' && req.method === 'GET') {
      return handleGetTrainingEvent(req, res);
    }

    // GET /api/gallery
    if (pathname === '/api/gallery' && req.method === 'GET') {
      return handleGetPublicGallery(req, res);
    }

    // GET /api/sponsors
    if (pathname === '/api/sponsors' && req.method === 'GET') {
      return handleGetPublicSponsors(req, res);
    }

    // GET /api/payment-config
    if (pathname === '/api/payment-config' && req.method === 'GET') {
      return handleGetPaymentConfig(req, res);
    }

    // ─── ADMIN ENDPOINTS (require auth) ──────────────────────────────────

    const authHeader = req.headers.authorization;
    if (!authHeader && pathname.startsWith('/api/admin/')) {
      return jsonResponse(res, 401, { error: 'No token' });
    }

    const token = authHeader ? extractToken(authHeader) : null;
    const user = token ? verifyToken(token) : null;

    if (!user && pathname.startsWith('/api/admin/')) {
      return jsonResponse(res, 401, { error: 'Invalid token' });
    }

    // PUT /api/admin/training-event
    if (pathname === '/api/admin/training-event' && req.method === 'PUT') {
      return handleUpdateTrainingEvent(req, res, user);
    }

    // GET /api/admin/gallery
    if (pathname === '/api/admin/gallery' && req.method === 'GET') {
      return handleGetAdminGallery(req, res, user);
    }

    // POST /api/admin/gallery/upload
    if (pathname === '/api/admin/gallery/upload' && req.method === 'POST') {
      return handleUploadGallery(req, res, user);
    }

    // DELETE /api/admin/gallery/:id
    if (pathname.match(/^\/api\/admin\/gallery\/\d+$/) && req.method === 'DELETE') {
      return handleDeleteGallery(req, res, user);
    }

    // GET /api/admin/sponsors
    if (pathname === '/api/admin/sponsors' && req.method === 'GET') {
      return handleGetAdminSponsors(req, res, user);
    }

    // GET /api/admin/users
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      return handleGetAdminUsers(req, res, user);
    }

    // GET /api/admin/registrations
    if (pathname === '/api/admin/registrations' && req.method === 'GET') {
      return handleGetAdminRegistrations(req, res, user);
    }

    // 404
    jsonResponse(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('API error:', error);
    jsonResponse(res, 500, { error: 'Internal server error' });
  }
}

module.exports = handleRequest;
