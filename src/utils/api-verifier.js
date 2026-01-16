/**
 * MyPrize Streamer Toolkit - API Verification Module
 * Tests API endpoints and validates response schemas
 * Respects rate limits and provides mock data fallback
 */

const APIVerifier = (() => {
  'use strict';

  // Test configuration
  const config = {
    baseUrl: 'https://myprize.us/api',
    timeout: 10000,
    delayBetweenTests: 2000, // 2 seconds between API calls to respect rate limits
    maxTestsPerRun: 10,      // Limit tests per verification run
    useMockOnFailure: true,  // Fall back to mock data if API unreachable
  };

  // Test results storage
  const results = {
    timestamp: null,
    apiReachable: null,
    endpoints: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    },
  };

  // Expected response schemas (simplified validators)
  const schemas = {
    room: {
      required: ['id', 'name'],
      optional: ['stream_status', 'url_path', 'avatar', 'current_user_count', 'creator_username'],
    },
    roomList: {
      required: ['results'],
      pagination: ['page', 'page_size'],
    },
    mission: {
      required: ['id', 'name'],
      optional: ['status', 'details', 'dates', 'images'],
    },
    missionList: {
      required: ['results'],
    },
    bet: {
      required: ['id'],
      optional: ['amount', 'currency', 'multiplier', 'game', 'user', 'room'],
    },
    betList: {
      required: ['data'],
    },
    igame: {
      required: ['id', 'name'],
      optional: ['provider', 'url_path', 'images'],
    },
    igameList: {
      required: ['results'],
    },
    user: {
      required: ['id', 'username'],
      optional: ['avatar', 'is_referred_by_caller'],
    },
  };

  // Mock data for development/testing when API is unreachable
  const mockData = {
    rooms: {
      results: [
        {
          id: 'mock-room-001',
          name: 'Demo Room',
          stream_status: 'offline',
          url_path: 'demo-room',
          avatar: null,
          current_user_count: 42,
          creator_username: 'DemoStreamer',
          is_creator_verified: true,
          follower_count: 1250,
        },
        {
          id: 'mock-room-002',
          name: 'Test Casino',
          stream_status: 'live',
          url_path: 'test-casino',
          current_user_count: 156,
          creator_username: 'TestUser',
        },
      ],
      page: 1,
      page_size: 20,
    },
    room: {
      id: 'mock-room-001',
      name: 'Demo Room',
      stream_status: 'offline',
      stream_thumbnail: null,
      stream_title: 'Welcome to Demo Room',
      description: 'A demonstration room for testing',
      url_path: 'demo-room',
      avatar: null,
      images: {
        header: null,
        mobile: null,
        desktop: null,
      },
      current_user_count: 42,
      creator_username: 'DemoStreamer',
      is_creator_verified: true,
      follower_count: 1250,
      missions: [],
    },
    missions: {
      results: [
        {
          id: 'mock-mission-001',
          name: 'First Steps',
          status: 'active',
          details: { description: 'Complete your first bet' },
          dates: { start: '2026-01-01', end: '2026-12-31' },
        },
        {
          id: 'mock-mission-002',
          name: 'High Roller',
          status: 'active',
          details: { description: 'Place 100 bets' },
        },
      ],
      page: 1,
      page_size: 20,
    },
    bets: {
      data: [
        {
          id: 'mock-bet-001',
          amount: 500,
          currency: 'GC',
          multiplier: 15.5,
          game: { id: 'game-001', name: 'Sweet Bonanza', provider: 'pragmatic' },
          user: { id: 'user-001', username: 'LuckyPlayer' },
          room: { id: 'mock-room-001', name: 'Demo Room' },
          created_at: new Date().toISOString(),
        },
        {
          id: 'mock-bet-002',
          amount: 1000,
          currency: 'SC',
          multiplier: 25.0,
          game: { id: 'game-002', name: 'Gates of Olympus', provider: 'pragmatic' },
          user: { id: 'user-002', username: 'WinStreak' },
          room: { id: 'mock-room-001', name: 'Demo Room' },
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: 'mock-bet-003',
          amount: 250,
          currency: 'GC',
          multiplier: 50.0,
          game: { id: 'game-003', name: 'Big Bass Bonanza', provider: 'pragmatic' },
          user: { id: 'user-003', username: 'BigFish' },
          room: { id: 'mock-room-002', name: 'Test Casino' },
          created_at: new Date(Date.now() - 120000).toISOString(),
        },
      ],
    },
    igames: {
      results: [
        {
          id: 'game-001',
          name: 'Sweet Bonanza',
          provider: 'pragmatic',
          url_path: 'sweet-bonanza',
          images: { thumbnail: null },
        },
        {
          id: 'game-002',
          name: 'Gates of Olympus',
          provider: 'pragmatic',
          url_path: 'gates-of-olympus',
        },
        {
          id: 'game-003',
          name: 'Big Bass Bonanza',
          provider: 'pragmatic',
          url_path: 'big-bass-bonanza',
        },
      ],
      page: 1,
      page_size: 20,
    },
    user: {
      id: 'mock-user-001',
      username: 'DemoUser',
      avatar: null,
      is_referred_by_caller: false,
    },
    jurisdiction: {
      status: 'ok',
      region: 'US',
      features: ['rooms', 'missions', 'igames'],
    },
  };

  /**
   * Check if API is reachable
   * @returns {Promise<boolean>}
   */
  async function checkAPIReachable() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(`${config.baseUrl}/jurisdiction`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if we got JSON back (not HTML redirect)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('[APIVerifier] API returned non-JSON response (possibly redirecting)');
        return false;
      }

      return response.ok;
    } catch (error) {
      console.log('[APIVerifier] API unreachable:', error.message);
      return false;
    }
  }

  /**
   * Validate response against schema
   * @param {Object} data - Response data
   * @param {Object} schema - Expected schema
   * @returns {Object} Validation result
   */
  function validateSchema(data, schema) {
    const errors = [];
    const warnings = [];

    if (!data || typeof data !== 'object') {
      errors.push('Response is not an object');
      return { valid: false, errors, warnings };
    }

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Check pagination fields if expected
    if (schema.pagination) {
      for (const field of schema.pagination) {
        if (!(field in data)) {
          warnings.push(`Missing pagination field: ${field}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Test a single endpoint
   * @param {string} name - Test name
   * @param {string} endpoint - API endpoint
   * @param {string} schemaName - Schema to validate against
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Test result
   */
  async function testEndpoint(name, endpoint, schemaName, options = {}) {
    const result = {
      name,
      endpoint,
      status: 'pending',
      responseTime: null,
      statusCode: null,
      schemaValid: null,
      errors: [],
      warnings: [],
      data: null,
    };

    try {
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      result.responseTime = Math.round(performance.now() - startTime);
      result.statusCode = response.status;

      // Check for redirect (API returning HTML)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        result.status = 'skipped';
        result.errors.push('API returned non-JSON response (may be redirecting to main site)');
        return result;
      }

      if (!response.ok) {
        result.status = 'failed';
        result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
        return result;
      }

      const data = await response.json();
      result.data = data;

      // Validate schema
      const schema = schemas[schemaName];
      if (schema) {
        const validation = validateSchema(data, schema);
        result.schemaValid = validation.valid;
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      }

      result.status = result.errors.length === 0 ? 'passed' : 'failed';

    } catch (error) {
      result.status = 'failed';
      if (error.name === 'AbortError') {
        result.errors.push('Request timed out');
      } else {
        result.errors.push(error.message);
      }
    }

    return result;
  }

  /**
   * Sleep helper
   * @param {number} ms - Milliseconds to sleep
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run verification tests
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async function verify(options = {}) {
    const {
      testSlug = null, // Optional room slug for testing (e.g., 'gwaslots')
      verbose = true,
    } = options;

    results.timestamp = new Date().toISOString();
    results.endpoints = {};
    results.summary = { total: 0, passed: 0, failed: 0, skipped: 0 };

    if (verbose) {
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║           MyPrize API Verification Suite                      ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('');
    }

    // Step 1: Check if API is reachable
    if (verbose) console.log('🔍 Checking API connectivity...');
    results.apiReachable = await checkAPIReachable();

    if (!results.apiReachable) {
      if (verbose) {
        console.log('⚠️  API is not reachable (may require browser/CORS context)');
        console.log('📦 Using mock data for development');
      }
      results.summary.skipped = 999; // Indicate all tests skipped
      return results;
    }

    if (verbose) console.log('✅ API is reachable\n');

    // Step 2: Define tests
    const tests = [
      { name: 'Health Check', endpoint: '/jurisdiction', schema: null },
      { name: 'List Rooms', endpoint: '/rooms?page_size=5', schema: 'roomList' },
      { name: 'List Missions', endpoint: '/missions?page_size=5', schema: 'missionList' },
      { name: 'Big Wins', endpoint: '/bets/tracked/type/big?page_size=5', schema: 'betList' },
      { name: 'Recent Bets', endpoint: '/bets/tracked/type/recent?page_size=5', schema: 'betList' },
      { name: 'List Games', endpoint: '/igames?page_size=5', schema: 'igameList' },
    ];

    // Add room-specific tests if slug provided
    if (testSlug) {
      tests.push({
        name: `Room by Slug (${testSlug})`,
        endpoint: `/rooms/slug/${testSlug}`,
        schema: 'room',
      });
    }

    // Step 3: Run tests with rate limit respect
    for (let i = 0; i < Math.min(tests.length, config.maxTestsPerRun); i++) {
      const test = tests[i];

      if (verbose) console.log(`🧪 Testing: ${test.name}...`);

      const result = await testEndpoint(test.name, test.endpoint, test.schema);
      results.endpoints[test.name] = result;
      results.summary.total++;

      if (result.status === 'passed') {
        results.summary.passed++;
        if (verbose) console.log(`   ✅ Passed (${result.responseTime}ms)`);
      } else if (result.status === 'skipped') {
        results.summary.skipped++;
        if (verbose) console.log(`   ⏭️  Skipped: ${result.errors[0]}`);
      } else {
        results.summary.failed++;
        if (verbose) console.log(`   ❌ Failed: ${result.errors.join(', ')}`);
      }

      // Respect rate limits - wait between requests
      if (i < tests.length - 1) {
        await sleep(config.delayBetweenTests);
      }
    }

    // Step 4: Summary
    if (verbose) {
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('📊 VERIFICATION SUMMARY');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`   Total:   ${results.summary.total}`);
      console.log(`   Passed:  ${results.summary.passed} ✅`);
      console.log(`   Failed:  ${results.summary.failed} ❌`);
      console.log(`   Skipped: ${results.summary.skipped} ⏭️`);
      console.log('═══════════════════════════════════════════════════════════════\n');
    }

    return results;
  }

  /**
   * Get mock data for an endpoint
   * @param {string} endpoint - Endpoint type
   * @returns {Object} Mock data
   */
  function getMockData(endpoint) {
    const mockMap = {
      '/rooms': mockData.rooms,
      '/rooms/slug/': mockData.room,
      '/missions': mockData.missions,
      '/bets/tracked/type/big': mockData.bets,
      '/bets/tracked/type/recent': mockData.bets,
      '/bets/tracked/type/lucky': mockData.bets,
      '/bets/tracked/type/wins': mockData.bets,
      '/igames': mockData.igames,
      '/user/': mockData.user,
      '/jurisdiction': mockData.jurisdiction,
    };

    // Find matching mock
    for (const [key, value] of Object.entries(mockMap)) {
      if (endpoint.startsWith(key)) {
        return JSON.parse(JSON.stringify(value)); // Deep clone
      }
    }

    return null;
  }

  /**
   * Check if mock mode should be used
   * @returns {boolean}
   */
  function shouldUseMock() {
    return results.apiReachable === false && config.useMockOnFailure;
  }

  /**
   * Get last verification results
   * @returns {Object}
   */
  function getResults() {
    return { ...results };
  }

  /**
   * Configure verifier
   * @param {Object} options
   */
  function configure(options) {
    Object.assign(config, options);
  }

  /**
   * Generate verification report as markdown
   * @returns {string}
   */
  function generateReport() {
    let report = `# API Verification Report\n\n`;
    report += `**Generated:** ${results.timestamp || 'Not run'}\n`;
    report += `**API Reachable:** ${results.apiReachable ? 'Yes ✅' : 'No ⚠️'}\n\n`;

    if (!results.apiReachable) {
      report += `> ⚠️ API was not reachable. This may be due to CORS restrictions or network issues.\n`;
      report += `> The toolkit will use mock data for development.\n\n`;
      return report;
    }

    report += `## Summary\n\n`;
    report += `| Metric | Count |\n`;
    report += `|--------|-------|\n`;
    report += `| Total Tests | ${results.summary.total} |\n`;
    report += `| Passed | ${results.summary.passed} |\n`;
    report += `| Failed | ${results.summary.failed} |\n`;
    report += `| Skipped | ${results.summary.skipped} |\n\n`;

    report += `## Endpoint Results\n\n`;

    for (const [name, result] of Object.entries(results.endpoints)) {
      const icon = result.status === 'passed' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
      report += `### ${icon} ${name}\n\n`;
      report += `- **Endpoint:** \`${result.endpoint}\`\n`;
      report += `- **Status:** ${result.status}\n`;
      report += `- **Response Time:** ${result.responseTime || 'N/A'}ms\n`;
      report += `- **HTTP Status:** ${result.statusCode || 'N/A'}\n`;

      if (result.errors.length > 0) {
        report += `- **Errors:**\n`;
        result.errors.forEach(e => report += `  - ${e}\n`);
      }

      if (result.warnings.length > 0) {
        report += `- **Warnings:**\n`;
        result.warnings.forEach(w => report += `  - ${w}\n`);
      }

      report += `\n`;
    }

    return report;
  }

  // Public API
  return {
    verify,
    checkAPIReachable,
    getMockData,
    shouldUseMock,
    getResults,
    generateReport,
    configure,
    schemas,
    mockData,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIVerifier;
}
