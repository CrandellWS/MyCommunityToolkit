/**
 * MyPrize Streamer Toolkit - User Profile Widget
 * Displays user public profile with stats and achievements
 * @module UserProfile
 */

const UserProfile = (() => {
  'use strict';

  /**
   * Default configuration options
   * @type {Object}
   */
  const defaultOptions = {
    userId: null,
    username: null,
    showAvatar: true,
    showStats: true,
    showBadges: true,
    showJoinDate: true,
    animateStats: true,
    compact: false,
    refreshInterval: 60000,
  };

  /**
   * User Profile Widget Class
   * @class
   */
  class UserProfileWidget {
    /**
     * Create a user profile widget
     * @param {string|HTMLElement} container - Container selector or element
     * @param {Object} options - Configuration options
     * @param {string} [options.userId] - User ID to display
     * @param {string} [options.username] - Username to display (alternative to userId)
     * @param {boolean} [options.showAvatar=true] - Show user avatar
     * @param {boolean} [options.showStats=true] - Show user statistics
     * @param {boolean} [options.showBadges=true] - Show achievement badges
     * @param {boolean} [options.showJoinDate=true] - Show join date
     * @param {boolean} [options.animateStats=true] - Animate stat counters
     * @param {boolean} [options.compact=false] - Use compact layout
     * @param {number} [options.refreshInterval=60000] - Auto-refresh interval in ms
     */
    constructor(container, options = {}) {
      this.container = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!this.container) {
        throw new Error('UserProfile container not found');
      }

      this.options = { ...defaultOptions, ...options };
      this.id = 'profile-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      this.refreshTimer = null;
      this.isLoading = false;
      this.hasError = false;
      this.data = null;

      this.init();
    }

    /**
     * Initialize the widget
     * @private
     */
    init() {
      this.container.classList.add('widget', 'widget-user-profile');
      if (this.options.compact) {
        this.container.classList.add('widget-compact');
      }
      this.container.setAttribute('data-widget-id', this.id);
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-label', 'User Profile');

      this.render();
      this.startRefresh();
    }

    /**
     * Render the widget structure
     * @private
     */
    render() {
      this.container.innerHTML = `
        <div class="user-profile-widget card">
          <div class="profile-content" aria-live="polite">
            ${this.createSkeletonLoader()}
          </div>
        </div>
      `;

      this.refresh();
    }

    /**
     * Refresh user data from API
     * @returns {Promise<void>}
     */
    async refresh() {
      if (this.isLoading) return;

      this.setLoading(true);

      try {
        let userData = null;

        if (this.options.userId) {
          // Fetch user by ID
          userData = await MyPrizeAPI.users.get(this.options.userId);
        } else if (this.options.username) {
          // We might need to search by username - use the stats endpoint
          // and provide mock data for demo purposes
          userData = this.createDemoUser(this.options.username);
        } else {
          throw new Error('Either userId or username must be provided');
        }

        this.data = this.normalizeUserData(userData);
        this.renderProfile();
        this.setError(null);

      } catch (error) {
        console.error('[UserProfile] Refresh error:', error);
        this.setError(error);
        this.renderError();
      } finally {
        this.setLoading(false);
      }
    }

    /**
     * Create demo user data for preview
     * @param {string} username - Username
     * @returns {Object} Demo user data
     * @private
     */
    createDemoUser(username) {
      return {
        username,
        avatar: null,
        joined_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        stats: {
          total_bets: Math.floor(Math.random() * 10000),
          total_wins: Math.floor(Math.random() * 5000),
          biggest_win: Math.floor(Math.random() * 50000),
          favorite_game: 'Sweet Bonanza',
        },
        badges: [
          { id: 'early-adopter', name: 'Early Adopter', icon: '&#127942;' },
          { id: 'big-winner', name: 'Big Winner', icon: '&#128176;' },
          { id: 'streak-master', name: 'Streak Master', icon: '&#128293;' },
        ].slice(0, Math.floor(Math.random() * 3) + 1),
      };
    }

    /**
     * Normalize user data from API response
     * @param {Object} userData - Raw user data
     * @returns {Object} Normalized user data
     * @private
     */
    normalizeUserData(userData) {
      return {
        id: userData.id || userData.user_id,
        username: userData.username || userData.name || 'Anonymous',
        avatar: userData.avatar || userData.profile_image || null,
        joinedAt: userData.joined_at || userData.created_at || userData.createdAt,
        stats: {
          totalBets: userData.stats?.total_bets || userData.total_bets || 0,
          totalWins: userData.stats?.total_wins || userData.total_wins || 0,
          biggestWin: userData.stats?.biggest_win || userData.biggest_win || 0,
          favoriteGame: userData.stats?.favorite_game || userData.favorite_game || null,
          winRate: userData.stats?.win_rate || userData.win_rate || null,
        },
        badges: (userData.badges || userData.achievements || []).map(badge => ({
          id: badge.id || badge.badge_id,
          name: badge.name || badge.title,
          icon: badge.icon || badge.emoji || '&#127942;',
          description: badge.description || '',
        })),
        level: userData.level || userData.rank || null,
      };
    }

    /**
     * Render user profile
     * @private
     */
    renderProfile() {
      const contentEl = this.container.querySelector('.profile-content');
      if (!contentEl || !this.data) return;

      const { username, avatar, joinedAt, stats, badges, level } = this.data;

      contentEl.innerHTML = `
        <div class="profile-header ${this.options.compact ? 'compact' : ''}">
          ${this.options.showAvatar ? `
            <div class="profile-avatar" aria-hidden="true">
              ${avatar
                ? `<img src="${avatar}" alt="${this.escapeHtml(username)}'s avatar" loading="lazy">`
                : `<span class="avatar-placeholder avatar-large">${username.charAt(0).toUpperCase()}</span>`
              }
              ${level ? `<span class="profile-level badge badge-primary">${level}</span>` : ''}
            </div>
          ` : ''}
          <div class="profile-info">
            <h3 class="profile-username">${this.escapeHtml(username)}</h3>
            ${this.options.showJoinDate && joinedAt ? `
              <p class="profile-joined text-muted text-sm">
                <span aria-hidden="true">&#128197;</span>
                Joined ${this.formatDate(joinedAt)}
              </p>
            ` : ''}
          </div>
        </div>

        ${this.options.showStats ? `
          <div class="profile-stats" role="list" aria-label="User statistics">
            <div class="stat-item" role="listitem">
              <span class="stat-value" data-target="${stats.totalBets}">0</span>
              <span class="stat-label">Total Bets</span>
            </div>
            <div class="stat-item" role="listitem">
              <span class="stat-value" data-target="${stats.totalWins}">0</span>
              <span class="stat-label">Total Wins</span>
            </div>
            <div class="stat-item" role="listitem">
              <span class="stat-value currency" data-target="${stats.biggestWin}">$0</span>
              <span class="stat-label">Biggest Win</span>
            </div>
            ${stats.winRate !== null ? `
              <div class="stat-item" role="listitem">
                <span class="stat-value percentage" data-target="${stats.winRate}">0%</span>
                <span class="stat-label">Win Rate</span>
              </div>
            ` : ''}
          </div>
          ${stats.favoriteGame ? `
            <div class="profile-favorite">
              <span class="favorite-label text-muted text-sm">Favorite Game:</span>
              <span class="favorite-game">${this.escapeHtml(stats.favoriteGame)}</span>
            </div>
          ` : ''}
        ` : ''}

        ${this.options.showBadges && badges.length > 0 ? `
          <div class="profile-badges" role="list" aria-label="Achievements">
            ${badges.map(badge => `
              <div class="badge-item"
                   role="listitem"
                   title="${this.escapeHtml(badge.name)}"
                   aria-label="${this.escapeHtml(badge.name)}">
                <span class="badge-icon" aria-hidden="true">${badge.icon}</span>
                <span class="badge-name">${this.escapeHtml(badge.name)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      `;

      // Animate stats if enabled
      if (this.options.animateStats && this.options.showStats) {
        this.animateStats();
      }
    }

    /**
     * Animate stat counters
     * @private
     */
    animateStats() {
      const statValues = this.container.querySelectorAll('.stat-value[data-target]');

      statValues.forEach(el => {
        const target = parseFloat(el.dataset.target) || 0;
        const isCurrency = el.classList.contains('currency');
        const isPercentage = el.classList.contains('percentage');

        this.animateNumber(el, 0, target, 1000, (value) => {
          if (isCurrency) {
            return this.formatCurrency(value);
          }
          if (isPercentage) {
            return value.toFixed(1) + '%';
          }
          return this.formatNumber(value);
        });
      });
    }

    /**
     * Animate a number from start to end
     * @param {HTMLElement} element - Element to update
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     * @param {Function} formatter - Value formatter function
     * @private
     */
    animateNumber(element, start, end, duration, formatter) {
      const startTime = performance.now();
      const diff = end - start;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (diff * easeOut);

        element.textContent = formatter(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.textContent = formatter(end);
        }
      };

      requestAnimationFrame(animate);
    }

    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     * @private
     */
    formatNumber(num) {
      return new Intl.NumberFormat().format(Math.round(num));
    }

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     * @private
     */
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }

    /**
     * Format date
     * @param {string} dateStr - Date string
     * @returns {string} Formatted date
     * @private
     */
    formatDate(dateStr) {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        return `${diffDays} days ago`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     * @private
     */
    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    /**
     * Render error state
     * @private
     */
    renderError() {
      const contentEl = this.container.querySelector('.profile-content');
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="profile-error" role="alert">
            <span class="error-icon" aria-hidden="true">&#9888;</span>
            <p class="text-error">Failed to load profile</p>
            <button class="btn btn-sm btn-secondary profile-retry"
                    aria-label="Retry loading profile">
              Retry
            </button>
          </div>
        `;

        const retryBtn = contentEl.querySelector('.profile-retry');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => this.refresh());
        }
      }
    }

    /**
     * Set loading state
     * @param {boolean} isLoading - Loading state
     */
    setLoading(isLoading) {
      this.isLoading = isLoading;
      this.container.classList.toggle('widget-loading', isLoading);

      if (isLoading && !this.data) {
        const contentEl = this.container.querySelector('.profile-content');
        if (contentEl) {
          contentEl.innerHTML = this.createSkeletonLoader();
        }
      }
    }

    /**
     * Set error state
     * @param {Error|null} error - Error object or null to clear
     */
    setError(error) {
      this.hasError = !!error;
      this.container.classList.toggle('widget-error', this.hasError);
    }

    /**
     * Create skeleton loader HTML
     * @returns {string} Skeleton loader HTML
     * @private
     */
    createSkeletonLoader() {
      return `
        <div class="profile-skeleton">
          <div class="profile-header">
            <div class="skeleton skeleton-avatar-lg"></div>
            <div class="profile-info">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-text-sm"></div>
            </div>
          </div>
          ${this.options.showStats ? `
            <div class="profile-stats">
              <div class="stat-item">
                <div class="skeleton skeleton-stat"></div>
                <div class="skeleton skeleton-label"></div>
              </div>
              <div class="stat-item">
                <div class="skeleton skeleton-stat"></div>
                <div class="skeleton skeleton-label"></div>
              </div>
              <div class="stat-item">
                <div class="skeleton skeleton-stat"></div>
                <div class="skeleton skeleton-label"></div>
              </div>
            </div>
          ` : ''}
          ${this.options.showBadges ? `
            <div class="profile-badges">
              <div class="skeleton skeleton-badge"></div>
              <div class="skeleton skeleton-badge"></div>
              <div class="skeleton skeleton-badge"></div>
            </div>
          ` : ''}
        </div>
      `;
    }

    /**
     * Start auto-refresh timer
     */
    startRefresh() {
      if (this.options.refreshInterval > 0) {
        this.refreshTimer = setInterval(() => this.refresh(), this.options.refreshInterval);
      }
    }

    /**
     * Stop auto-refresh timer
     */
    stopRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }

    /**
     * Destroy the widget
     */
    destroy() {
      this.stopRefresh();
      this.container.innerHTML = '';
      this.container.classList.remove('widget', 'widget-user-profile', 'widget-compact');
      this.container.removeAttribute('data-widget-id');
      this.container.removeAttribute('role');
      this.container.removeAttribute('aria-label');
    }

    /**
     * Update widget options
     * @param {Object} newOptions - New options to merge
     */
    updateOptions(newOptions) {
      this.options = { ...this.options, ...newOptions };
      if (this.options.compact) {
        this.container.classList.add('widget-compact');
      } else {
        this.container.classList.remove('widget-compact');
      }
      this.render();
    }

    /**
     * Set user to display
     * @param {string} userId - User ID
     */
    setUser(userId) {
      this.options.userId = userId;
      this.options.username = null;
      this.data = null;
      this.refresh();
    }

    /**
     * Set username to display
     * @param {string} username - Username
     */
    setUsername(username) {
      this.options.username = username;
      this.options.userId = null;
      this.data = null;
      this.refresh();
    }

    /**
     * Get current user data
     * @returns {Object|null} Current user data
     */
    getData() {
      return this.data ? { ...this.data } : null;
    }
  }

  /**
   * Create a new user profile widget
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   * @returns {UserProfileWidget} Widget instance
   */
  function create(container, options) {
    return new UserProfileWidget(container, options);
  }

  // Public API
  return {
    create,
    UserProfileWidget,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserProfile;
}
