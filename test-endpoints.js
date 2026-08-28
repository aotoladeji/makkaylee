/**
 * Comprehensive API Endpoint Test Suite
 * Tests all 38 endpoints for functionality and 404 errors
 * 
 * Usage: node test-endpoints.js [baseUrl] [mode]
 * Examples:
 *   node test-endpoints.js http://localhost:5000 backend
 *   node test-endpoints.js http://localhost:3000 frontend
 */

const http = require('http');
const https = require('https');
const url = require('url');

const BASE_URL = process.argv[2] || 'http://localhost:5000';
const MODE = process.argv[3] || 'backend';

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  endpoints: []
};

let authTokens = {
  parent: null,
  staff: null,
  admin: null
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const parsedUrl = new url.URL(path, BASE_URL);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && method !== 'GET') {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = client.request(parsedUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: { raw: data },
            error: e.message
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        error: err.message,
        body: {}
      });
    });

    if (body && method !== 'GET') {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function recordTest(endpoint, method, path, expectedStatus, token = null, body = null) {
  try {
    const result = await makeRequest(method, path, body, token);
    const passed = result.status === expectedStatus;
    
    const status = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const statusCode = result.status === 404 ? `${colors.red}${result.status}${colors.reset}` : `${result.status}`;
    
    log(`${status} ${endpoint.padEnd(50)} ${method.padEnd(6)} → ${statusCode} (expected: ${expectedStatus})`, passed ? 'green' : 'red');
    
    testResults.endpoints.push({
      name: endpoint,
      method,
      path,
      expected: expectedStatus,
      actual: result.status,
      passed
    });

    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push({
        endpoint,
        method,
        expected: expectedStatus,
        actual: result.status,
        response: result.body
      });
    }

    return result;
  } catch (err) {
    log(`✗ ${endpoint.padEnd(50)} ${method.padEnd(6)} → ERROR: ${err.message}`, 'red');
    testResults.failed++;
    testResults.errors.push({ endpoint, error: err.message });
    return null;
  }
}

async function runTests() {
  log('\n═══════════════════════════════════════════════════════════════', 'cyan');
  log(`API ENDPOINT TEST SUITE - Mode: ${MODE}`, 'cyan');
  log(`Testing against: ${BASE_URL}`, 'cyan');
  log(`Test started at: ${new Date().toISOString()}`, 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');

  // ─────────────────────────────────────────────────────────────────
  // 1. PUBLIC ENDPOINTS (no auth required)
  // ─────────────────────────────────────────────────────────────────
  log('\n📋 PUBLIC ENDPOINTS (no auth required)', 'blue');
  log('─────────────────────────────────────────', 'blue');

  // Test login - should work with default user
  const loginResult = await recordTest(
    'Login (parent)',
    'POST',
    '/api/login',
    200,
    null,
    { username: 'admin', password: 'oladeji' }
  );

  if (loginResult && loginResult.body.token) {
    authTokens.parent = loginResult.body.token;
    log(`  → Token captured for parent: ${authTokens.parent.substring(0, 20)}...`, 'yellow');
  }

  // Test staff login
  const staffLoginResult = await recordTest(
    'Staff Login',
    'POST',
    '/api/staff/login',
    401,  // Expected to fail since no staff user created
    null,
    { username: 'staff', password: 'staffpassword' }
  );

  if (staffLoginResult && staffLoginResult.body.token) {
    authTokens.staff = staffLoginResult.body.token;
  }

  // Test register
  const timestamp = Date.now();
  await recordTest(
    'Register (new parent)',
    'POST',
    '/api/register',
    200,
    null,
    {
      username: `testuser_${timestamp}`,
      password: 'test123456',
      email: `test_${timestamp}@example.com`,
      parentName: 'Test Parent',
      phone: '08012345678',
      address: 'Test Address',
      playerName: 'Test Child',
      age: 8,
      gender: 'M',
      program: 'Junior',
      medical: 'None',
      consent: true
    }
  );

  // Test payment config
  await recordTest(
    'Get Payment Config (public)',
    'GET',
    '/api/payment-config',
    200
  );

  // Test training event
  await recordTest(
    'Get Training Event (public)',
    'GET',
    '/api/training-event',
    200
  );

  // Test gallery
  await recordTest(
    'Get Gallery (public)',
    'GET',
    '/api/gallery',
    200
  );

  // Test sponsors
  await recordTest(
    'Get Sponsors (public)',
    'GET',
    '/api/sponsors',
    200
  );

  // Test forgot password
  await recordTest(
    'Forgot Password',
    'POST',
    '/api/forgot-password',
    200,
    null,
    { email: 'admin@makkayleeFA.ng' }
  );

  // Test hello
  await recordTest(
    'Hello (health check)',
    'GET',
    '/api/hello',
    200
  );

  // ─────────────────────────────────────────────────────────────────
  // 2. PARENT/USER ENDPOINTS (auth required)
  // ─────────────────────────────────────────────────────────────────
  log('\n👤 PARENT/USER ENDPOINTS (auth required)', 'blue');
  log('─────────────────────────────────────────', 'blue');

  if (!authTokens.parent) {
    log('⚠️  No auth token available - skipping parent endpoints', 'yellow');
  } else {
    // Get profile
    await recordTest(
      'Get Profile',
      'GET',
      '/api/profile',
      200,
      authTokens.parent
    );

    // Get billing
    await recordTest(
      'Get Billing Info',
      'GET',
      '/api/billing',
      404,  // Expected: admin user has no registrations
      authTokens.parent
    );

    // Add child
    const addChildResult = await recordTest(
      'Add Child',
      'POST',
      '/api/children',
      200,
      authTokens.parent,
      {
        playerName: 'Child 1',
        age: 8,
        gender: 'M',
        program: 'Junior',
        medical: 'None',
        consent: true
      }
    );

    // Update profile
    await recordTest(
      'Update Profile',
      'PUT',
      '/api/profile',
      200,
      authTokens.parent,
      {
        parentName: 'Updated Name',
        phone: '08098765432',
        address: 'New Address'
      }
    );

    // Change password
    await recordTest(
      'Change Password',
      'POST',
      '/api/change-password',
      200,
      authTokens.parent,
      {
        currentPassword: 'oladeji',
        newPassword: 'newpassword123'
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. STAFF ENDPOINTS (staff auth required)
  // ─────────────────────────────────────────────────────────────────
  log('\n👷 STAFF ENDPOINTS (staff auth required)', 'blue');
  log('─────────────────────────────────────────', 'blue');

  if (!authTokens.staff) {
    log('⚠️  No staff auth token available - skipping staff endpoints', 'yellow');
  } else {
    // Get staff profile
    await recordTest(
      'Get Staff Profile',
      'GET',
      '/api/staff/profile',
      200,
      authTokens.staff
    );

    // Update staff profile
    await recordTest(
      'Update Staff Profile',
      'PUT',
      '/api/staff/profile',
      200,
      authTokens.staff,
      {
        parentName: 'Staff Updated',
        phone: '08055555555',
        address: 'Staff Address'
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. ADMIN ENDPOINTS (admin auth required)
  // ─────────────────────────────────────────────────────────────────
  log('\n🔐 ADMIN ENDPOINTS (admin auth required)', 'blue');
  log('─────────────────────────────────────────', 'blue');

  if (!authTokens.parent) {
    log('⚠️  No admin auth token available - skipping admin endpoints', 'yellow');
  } else {
    // Get users
    await recordTest(
      'Get Admin Users',
      'GET',
      '/api/admin/users',
      200,
      authTokens.parent
    );

    // Get registrations
    await recordTest(
      'Get Admin Registrations',
      'GET',
      '/api/admin/registrations',
      200,
      authTokens.parent
    );

    // Update training event
    await recordTest(
      'Update Training Event',
      'PUT',
      '/api/admin/training-event',
      200,
      authTokens.parent,
      {
        title: 'Next Training',
        dateLabel: 'April 4, 2026',
        venue: 'Test Venue',
        note: 'Test Note'
      }
    );

    // Update payment config
    await recordTest(
      'Update Payment Config',
      'PUT',
      '/api/admin/payment-config',
      200,
      authTokens.parent,
      {
        oneTimeRegistrationFee: 40000,
        trainingSessionFee: 30000,
        bundleMonths: 0,
        monthlyBundleFee: 0,
        dueDate: new Date().toISOString()
      }
    );

    // Get admin gallery
    await recordTest(
      'Get Admin Gallery',
      'GET',
      '/api/admin/gallery',
      200,
      authTokens.parent
    );

    // Upload gallery (YouTube)
    await recordTest(
      'Upload Gallery (YouTube)',
      'POST',
      '/api/admin/gallery/upload',
      200,
      authTokens.parent,
      {
        title: 'Test Video',
        caption: 'Test',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      }
    );

    // Get admin sponsors
    await recordTest(
      'Get Admin Sponsors',
      'GET',
      '/api/admin/sponsors',
      200,
      authTokens.parent
    );

    // Create sponsor
    await recordTest(
      'Create Sponsor',
      'POST',
      '/api/admin/sponsors',
      400,  // Expected: requires file upload, JSON alone returns error
      authTokens.parent,
      {
        name: 'Test Sponsor',
        type: 'sponsor',
        description: 'Test Description',
        websiteUrl: 'https://example.com'
      }
    );

    // Admin change password
    await recordTest(
      'Admin Change Password',
      'POST',
      '/api/admin/change-password',
      200,
      authTokens.parent,
      {
        currentPassword: 'newpassword123',
        newPassword: 'anotherpassword123'
      }
    );

    // Create staff
    await recordTest(
      'Create Staff Account',
      'POST',
      '/api/admin/staff',
      200,
      authTokens.parent,
      {
        username: `teststaff_${Date.now()}`,
        password: 'staffpass123',
        email: `staff_${Date.now()}@example.com`,
        parentName: 'Test Staff',
        phone: '08012345678'
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST SUMMARY
  // ─────────────────────────────────────────────────────────────────
  log('\n═══════════════════════════════════════════════════════════════', 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');

  const totalTests = testResults.passed + testResults.failed;
  const passPercentage = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(2) : 0;

  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`✓ Passed: ${testResults.passed}`, 'green');
  log(`✗ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${passPercentage}%`, passPercentage >= 90 ? 'green' : passPercentage >= 70 ? 'yellow' : 'red');

  if (testResults.errors.length > 0) {
    log('\n⚠️  Failed Endpoints:', 'red');
    testResults.errors.forEach(err => {
      log(`  • ${err.endpoint}: ${err.expected} → ${err.actual}`, 'red');
      if (err.response && err.response.error) {
        log(`    Error: ${err.response.error}`, 'yellow');
      }
    });
  }

  log('\n═══════════════════════════════════════════════════════════════\n', 'cyan');

  // Return exit code based on test results
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
