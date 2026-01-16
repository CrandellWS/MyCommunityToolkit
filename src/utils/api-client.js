/**
 * MyPrize Streamer Toolkit - API Client
 * Robust API client with caching, rate limiting, and error handling
 */

const MyPrizeAPI = (() => {
  'use strict';

  // Configuration
  const config = {
    baseUrl: 'https://myprize.us/api',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    cacheEnabled: true,
    cacheDuration: 30000, // 30 seconds default
    rateLimitPerFiveMinutes: 5000,
  };

  // Request cache
  const cache = new Map();

  // Rate limit tracking
  const rateLimitState = {
    requests: [],
    windowStart: Date.now(),
    remaining: config.rateLimitPerFiveMinutes,
  };

  // Event emitters for state changes
  const listeners = {
    rateLimit: new Set(),
    error: new Set(),
    request: new Set(),
  };

  /**
   * Make an API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async function request(endpoint, options = {}) {
    const {
      method = 'GET',
      params = {},
      headers = {},
      cache: useCache = config.cacheEnabled,
      cacheDuration = config.cacheDuration,
      timeout = config.timeout,
      retries = config.retries,
    } = options;

    // Build URL with query params
    const url = buildUrl(endpoint, params);
    const cacheKey = `${method}:${url}`;

    // Check cache first
    if (useCache && method === 'GET') {
      const cached = getFromCache(cacheKey);
      if (cached) {
        emitEvent('request', { url, method, cached: true });
        return cached;
      }
    }

    // Check rate limit
    if (!checkRateLimit()) {
      const error = new Error('Rate limit exceeded. Please wait before making more requests.');
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.retryAfter = getTimeUntilRateLimitReset();
      emitEvent('rateLimit', { remaining: 0, retryAfter: error.retryAfter });
      throw error;
    }

    // Track request
    trackRequest();

    // Make request with retries
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        emitEvent('request', { url, method, attempt, cached: false });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle rate limit headers
        const remaining = response.headers.get('X-RateLimit-Remaining');
        if (remaining !== null) {
          rateLimitState.remaining = parseInt(remaining, 10);
          emitEvent('rateLimit', { remaining: rateLimitState.remaining });
        }

        // Handle errors
        if (!response.ok) {
          const error = await parseError(response);

          // Retry on 429 (rate limit) or 5xx errors
          if ((response.status === 429 || response.status >= 500) && attempt < retries) {
            const delay = response.status === 429
              ? (parseInt(response.headers.get('Retry-After') || '5', 10) * 1000)
              : config.retryDelay * attempt;
            await sleep(delay);
            continue;
          }

          throw error;
        }

        const data = await response.json();

        // Cache successful GET responses
        if (useCache && method === 'GET') {
          setCache(cacheKey, data, cacheDuration);
        }

        return data;

      } catch (err) {
        lastError = err;

        // Don't retry on abort or non-retryable errors
        if (err.name === 'AbortError') {
          lastError = new Error('Request timed out');
          lastError.code = 'TIMEOUT';
          break;
        }

        if (attempt < retries && isRetryableError(err)) {
          await sleep(config.retryDelay * attempt);
          continue;
        }

        break;
      }
    }

    emitEvent('error', { url, method, error: lastError });
    throw lastError;
  }

  /**
   * Build URL with query parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {string} Full URL
   */
  function buildUrl(endpoint, params) {
    const url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, config.baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Parse error response
   * @param {Response} response - Fetch response
   * @returns {Error} Parsed error
   */
  async function parseError(response) {
    let message = `API Error: ${response.status} ${response.statusText}`;
    let code = `HTTP_${response.status}`;

    try {
      const data = await response.json();
      if (data.message) message = data.message;
      if (data.error) message = data.error;
      if (data.code) code = data.code;
    } catch {
      // Ignore JSON parse errors
    }

    const error = new Error(message);
    error.code = code;
    error.status = response.status;
    return error;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  function isRetryableError(error) {
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.status === 429 ||
      (error.status && error.status >= 500)
    );
  }

  /**
   * Check rate limit
   * @returns {boolean} Whether request is allowed
   */
  function checkRateLimit() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Reset window if needed
    if (now - rateLimitState.windowStart > fiveMinutes) {
      rateLimitState.requests = [];
      rateLimitState.windowStart = now;
      rateLimitState.remaining = config.rateLimitPerFiveMinutes;
    }

    // Clean old requests
    rateLimitState.requests = rateLimitState.requests.filter(
      timestamp => now - timestamp < fiveMinutes
    );

    return rateLimitState.requests.length < config.rateLimitPerFiveMinutes;
  }

  /**
   * Track a request for rate limiting
   */
  function trackRequest() {
    rateLimitState.requests.push(Date.now());
    rateLimitState.remaining = config.rateLimitPerFiveMinutes - rateLimitState.requests.length;
  }

  /**
   * Get time until rate limit resets
   * @returns {number} Milliseconds until reset
   */
  function getTimeUntilRateLimitReset() {
    const fiveMinutes = 5 * 60 * 1000;
    return Math.max(0, fiveMinutes - (Date.now() - rateLimitState.windowStart));
  }

  /**
   * Get current rate limit status
   * @returns {Object} Rate limit status
   */
  function getRateLimitStatus() {
    checkRateLimit(); // Update state
    return {
      remaining: rateLimitState.remaining,
      limit: config.rateLimitPerFiveMinutes,
      used: config.rateLimitPerFiveMinutes - rateLimitState.remaining,
      resetsIn: getTimeUntilRateLimitReset(),
      percentage: ((config.rateLimitPerFiveMinutes - rateLimitState.remaining) / config.rateLimitPerFiveMinutes) * 100,
    };
  }

  // Cache functions
  function getFromCache(key) {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      cache.delete(key);
      return null;
    }
    return item.data;
  }

  function setCache(key, data, duration) {
    cache.set(key, {
      data,
      expires: Date.now() + duration,
    });
  }

  function clearCache() {
    cache.clear();
  }

  // Event emitter functions
  function emitEvent(event, data) {
    listeners[event]?.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`[MyPrizeAPI] Event listener error:`, e);
      }
    });
  }

  function on(event, callback) {
    listeners[event]?.add(callback);
    return () => listeners[event]?.delete(callback);
  }

  // Helper function
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =====================
  // API Endpoint Methods
  // =====================

  // Rooms
  const rooms = {
    list: (params = {}) => request('/rooms', { params }),
    get: (id) => request(`/rooms/${id}`),
    getBySlug: (slug) => request(`/rooms/slug/${slug}`),
    getStats: (id) => request(`/rooms/${id}/stats`),
    getRecentGames: (id, params = {}) => request(`/rooms/${id}/igames/recent`, { params }),
  };

  // Users
  const users = {
    get: (id) => request(`/user/${id}`),
    getStats: (params = {}) => request('/stats/users', { params }),
  };

  // iGames (Casino Games)
  const igames = {
    list: (params = {}) => request('/igames', { params }),
    get: (id) => request(`/igames/${id}`),
    getByProvider: (provider, params = {}) => request('/igames', {
      params: { ...params, equals_field: 'provider', equals_value: provider }
    }),
  };

  // Missions
  const missions = {
    list: (params = {}) => request('/missions', { params }),
    get: (id) => request(`/missions/${id}`),
    getByRoom: (roomId, params = {}) => request('/missions', {
      params: { ...params, room_id: roomId }
    }),
    getLeaderboard: (id) => request(`/missions/${id}/leaderboard`),
  };

  // Bets
  const bets = {
    getBig: (params = {}) => request('/bets/tracked/type/big', { params }),
    getLucky: (params = {}) => request('/bets/tracked/type/lucky', { params }),
    getRecent: (params = {}) => request('/bets/tracked/type/recent', { params }),
    getWins: (params = {}) => request('/bets/tracked/type/wins', { params }),
  };

  // Content
  const content = {
    getBanners: (params = {}) => request('/banners', { params }),
    getLivestreams: (params = {}) => request('/livestreams', { params }),
  };

  // System
  const system = {
    getFeatures: () => request('/features'),
    getJurisdiction: () => request('/jurisdiction'),
    health: () => request('/jurisdiction', { cache: false, timeout: 5000 }),
  };

  // Configure client
  function configure(options) {
    Object.assign(config, options);
  }

  // Public API
  return {
    request,
    configure,
    clearCache,
    getRateLimitStatus,
    on,

    // Namespaced endpoints
    rooms,
    users,
    igames,
    missions,
    bets,
    content,
    system,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MyPrizeAPI;
}
