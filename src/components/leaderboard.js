/**
 * MyPrize Streamer Toolkit - Leaderboard Widget
 * Displays mission rankings with animated rank changes
 * @module Leaderboard
 */

const Leaderboard = (() => {
  'use strict';

  /**
   * Default configuration options
   * @type {Object}
   */
  const defaultOptions = {
    title: 'Leaderboard',
    limit: 10,
    roomId: null,
    missionId: null,
    showAvatars: true,
    showPodium: true,
    animateChanges: true,
    refreshInterval: 30000,
    showHeader: true,
    highlightUser: null,
    animate: true,
  };

  /**
   * Medal icons for top 3 positions
   * @type {string[]}
   */
  const MEDALS = ['gold', 'silver', 'bronze'];

  /**
   * Leaderboard Widget Class
   * @class
   */
  class LeaderboardWidget {
    /**
     * Create a leaderboard widget
     * @param {string|HTMLElement} container - Container selector or element
     * @param {Object} options - Configuration options
     * @param {string} [options.title='Leaderboard'] - Widget title
     * @param {number} [options.limit=10] - Number of entries to display
     * @param {string} [options.roomId] - Room ID to filter by
     * @param {string} [options.missionId] - Mission ID to get leaderboard for
     * @param {boolean} [options.showAvatars=true] - Show user avatars
     * @param {boolean} [options.showPodium=true] - Show podium styling for top 3
     * @param {boolean} [options.animateChanges=true] - Animate rank changes
     * @param {number} [options.refreshInterval=30000] - Auto-refresh interval in ms
     * @param {boolean} [options.showHeader=true] - Show widget header
     * @param {string} [options.highlightUser] - Username to highlight
     */
    constructor(container, options = {}) {
      this.container = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!this.container) {
        throw new Error('Leaderboard container not found');
      }

      this.options = { ...defaultOptions, ...options };
      this.id = 'leaderboard-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      this.refreshTimer = null;
      this.isLoading = false;
      this.hasError = false;
      this.data = [];
      this.previousData = [];

      this.init();
    }

    /**
     * Initialize the widget
     * @private
     */
    init() {
      this.container.classList.add('widget', 'widget-leaderboard');
      this.container.setAttribute('data-widget-id', this.id);
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-label', this.options.title);

      this.render();
      this.startRefresh();
    }

    /**
     * Render the widget structure
     * @private
     */
    render() {
      this.container.innerHTML = `
        <div class="leaderboard-widget card" role="list" aria-label="${this.options.title} rankings">
          ${this.options.showHeader ? `
            <div class="card-header">
              <h3 class="card-title">
                <span class="leaderboard-icon" aria-hidden="true">&#127942;</span>
                <span>${this.options.title}</span>
              </h3>
              <button class="btn btn-ghost btn-sm leaderboard-refresh"
                      aria-label="Refresh leaderboard"
                      title="Refresh">
                <span aria-hidden="true">&#8635;</span>
              </button>
            </div>
          ` : ''}
          <div class="card-body">
            <div class="leaderboard-list" role="list" aria-live="polite"></div>
          </div>
        </div>
      `;

      // Bind refresh button
      const refreshBtn = this.container.querySelector('.leaderboard-refresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.refresh());
        refreshBtn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.refresh();
          }
        });
      }

      this.refresh();
    }

    /**
     * Refresh leaderboard data from API
     * @returns {Promise<void>}
     */
    async refresh() {
      if (this.isLoading) return;

      this.setLoading(true);

      try {
        let entries = [];

        if (this.options.missionId) {
          // Fetch mission leaderboard
          const response = await MyPrizeAPI.missions.getLeaderboard(this.options.missionId);
          entries = this.normalizeLeaderboardData(response);
        } else {
          // Fetch general bets data as leaderboard (wins by user)
          const response = await MyPrizeAPI.bets.getWins({
            page_size: this.options.limit * 2,
            room_id: this.options.roomId,
          });
          entries = this.aggregateWinsToLeaderboard(Array.isArray(response) ? response : response.data || []);
        }

        // Store previous data for animation comparison
        this.previousData = [...this.data];
        this.data = entries.slice(0, this.options.limit);

        this.renderEntries();
        this.setError(null);

      } catch (error) {
        console.error('[Leaderboard] Refresh error:', error);
        this.setError(error);
        this.renderError();
      } finally {
        this.setLoading(false);
      }
    }

    /**
     * Normalize leaderboard data from different API response formats
     * @param {Object|Array} response - API response
     * @returns {Array} Normalized entries
     * @private
     */
    normalizeLeaderboardData(response) {
      const data = response.data || response.leaderboard || response.results || response;
      if (!Array.isArray(data)) return [];

      return data.map((entry, index) => ({
        rank: entry.rank || index + 1,
        username: entry.username || entry.user?.username || entry.name || 'Anonymous',
        score: entry.score || entry.points || entry.total || entry.amount || 0,
        avatar: entry.avatar || entry.user?.avatar || null,
        userId: entry.user_id || entry.userId || entry.id,
        change: entry.change || 0,
      }));
    }

    /**
     * Aggregate wins data into a leaderboard format
     * @param {Array} wins - Array of win records
     * @returns {Array} Aggregated leaderboard
     * @private
     */
    aggregateWinsToLeaderboard(wins) {
      const userTotals = new Map();

      wins.forEach(win => {
        const username = win.username || win.user?.username || 'Anonymous';
        const amount = win.amount_won || win.amount || 0;
        const avatar = win.avatar || win.user?.avatar || null;

        if (userTotals.has(username)) {
          const existing = userTotals.get(username);
          existing.score += amount;
          existing.wins++;
        } else {
          userTotals.set(username, {
            username,
            score: amount,
            avatar,
            wins: 1,
          });
        }
      });

      // Convert to array and sort by score
      const entries = Array.from(userTotals.values())
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      // Calculate rank changes if we have previous data
      if (this.previousData.length > 0) {
        const previousRanks = new Map(this.previousData.map(e => [e.username, e.rank]));
        entries.forEach(entry => {
          const prevRank = previousRanks.get(entry.username);
          entry.change = prevRank ? prevRank - entry.rank : 0;
        });
      }

      return entries;
    }

    /**
     * Render leaderboard entries
     * @private
     */
    renderEntries() {
      const listEl = this.container.querySelector('.leaderboard-list');
      if (!listEl) return;

      if (this.data.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state" role="status">
            <p class="text-muted">No rankings available</p>
          </div>
        `;
        return;
      }

      // Build previous rank map for animations
      const previousRanks = new Map(this.previousData.map(e => [e.username, e.rank]));

      listEl.innerHTML = this.data.map((entry, index) => {
        const isTopThree = entry.rank <= 3;
        const isHighlighted = this.options.highlightUser &&
          entry.username.toLowerCase() === this.options.highlightUser.toLowerCase();

        // Determine rank change animation
        const prevRank = previousRanks.get(entry.username);
        let changeClass = '';
        let changeIcon = '';

        if (this.options.animateChanges && prevRank !== undefined) {
          if (prevRank > entry.rank) {
            changeClass = 'rank-up';
            changeIcon = `<span class="rank-change-icon up" aria-label="Moved up">&#9650;</span>`;
          } else if (prevRank < entry.rank) {
            changeClass = 'rank-down';
            changeIcon = `<span class="rank-change-icon down" aria-label="Moved down">&#9660;</span>`;
          }
        }

        const animationDelay = this.options.animate ? index * 50 : 0;
        const medalClass = isTopThree && this.options.showPodium ? `podium-${MEDALS[entry.rank - 1]}` : '';

        return `
          <div class="leaderboard-entry ${medalClass} ${changeClass} ${isHighlighted ? 'highlighted' : ''}"
               role="listitem"
               aria-label="Rank ${entry.rank}: ${entry.username} with ${this.formatScore(entry.score)} points"
               style="animation-delay: ${animationDelay}ms"
               tabindex="0">
            <div class="entry-rank">
              ${this.renderRankBadge(entry.rank)}
              ${changeIcon}
            </div>
            <div class="entry-user">
              ${this.options.showAvatars ? `
                <div class="entry-avatar" aria-hidden="true">
                  ${entry.avatar
                    ? `<img src="${entry.avatar}" alt="" loading="lazy">`
                    : `<span class="avatar-placeholder">${entry.username.charAt(0).toUpperCase()}</span>`
                  }
                </div>
              ` : ''}
              <span class="entry-username">${this.escapeHtml(entry.username)}</span>
            </div>
            <div class="entry-score">
              <span class="score-value">${this.formatScore(entry.score)}</span>
              <span class="score-label">pts</span>
            </div>
          </div>
        `;
      }).join('');

      // Add entrance animations
      if (this.options.animate) {
        listEl.querySelectorAll('.leaderboard-entry').forEach((el, i) => {
          el.classList.add('animate-fade-in-left');
        });
      }
    }

    /**
     * Render rank badge with medal for top 3
     * @param {number} rank - Player rank
     * @returns {string} HTML for rank badge
     * @private
     */
    renderRankBadge(rank) {
      if (rank <= 3 && this.options.showPodium) {
        const medals = [
          '<span class="medal gold" aria-label="First place">&#129351;</span>',
          '<span class="medal silver" aria-label="Second place">&#129352;</span>',
          '<span class="medal bronze" aria-label="Third place">&#129353;</span>',
        ];
        return medals[rank - 1];
      }
      return `<span class="rank-number">${rank}</span>`;
    }

    /**
     * Format score for display
     * @param {number} score - Raw score
     * @returns {string} Formatted score
     * @private
     */
    formatScore(score) {
      if (score >= 1000000) {
        return (score / 1000000).toFixed(1) + 'M';
      }
      if (score >= 1000) {
        return (score / 1000).toFixed(1) + 'K';
      }
      return new Intl.NumberFormat().format(Math.round(score));
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
      const listEl = this.container.querySelector('.leaderboard-list');
      if (listEl) {
        listEl.innerHTML = `
          <div class="error-state" role="alert">
            <p class="text-error">Failed to load leaderboard</p>
            <button class="btn btn-sm btn-secondary leaderboard-retry"
                    aria-label="Retry loading leaderboard">
              Retry
            </button>
          </div>
        `;

        const retryBtn = listEl.querySelector('.leaderboard-retry');
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

      const refreshBtn = this.container.querySelector('.leaderboard-refresh');
      if (refreshBtn) {
        refreshBtn.disabled = isLoading;
        refreshBtn.setAttribute('aria-busy', isLoading);
      }

      if (isLoading) {
        const listEl = this.container.querySelector('.leaderboard-list');
        if (listEl && this.data.length === 0) {
          listEl.innerHTML = this.createSkeletonLoader();
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
      return Array(5).fill(0).map((_, i) => `
        <div class="leaderboard-entry skeleton-entry" style="animation-delay: ${i * 50}ms">
          <div class="skeleton skeleton-rank"></div>
          <div class="entry-user">
            <div class="skeleton skeleton-avatar"></div>
            <div class="skeleton skeleton-text"></div>
          </div>
          <div class="skeleton skeleton-score"></div>
        </div>
      `).join('');
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
      this.container.classList.remove('widget', 'widget-leaderboard');
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
      this.render();
    }

    /**
     * Highlight a specific user
     * @param {string} username - Username to highlight
     */
    highlightUser(username) {
      this.options.highlightUser = username;
      this.renderEntries();
    }

    /**
     * Get current leaderboard data
     * @returns {Array} Current leaderboard entries
     */
    getData() {
      return [...this.data];
    }
  }

  /**
   * Create a new leaderboard widget
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   * @returns {LeaderboardWidget} Widget instance
   */
  function create(container, options) {
    return new LeaderboardWidget(container, options);
  }

  // Public API
  return {
    create,
    LeaderboardWidget,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Leaderboard;
}
