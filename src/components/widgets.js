/**
 * MyPrize Streamer Toolkit - Widget Components
 * Reusable, configurable widgets for streamer dashboards
 */

const Widgets = (() => {
  'use strict';

  // Widget registry
  const registry = new Map();

  // Default widget options
  const defaultOptions = {
    refreshInterval: 60000, // 1 minute
    animate: true,
    showHeader: true,
    theme: 'auto',
  };

  /**
   * Base Widget Class
   */
  class Widget {
    constructor(container, options = {}) {
      this.container = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!this.container) {
        throw new Error('Widget container not found');
      }

      this.options = { ...defaultOptions, ...options };
      this.id = 'widget-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      this.refreshTimer = null;
      this.isLoading = false;
      this.hasError = false;
      this.data = null;

      this.init();
    }

    init() {
      this.container.classList.add('widget', `widget-${this.constructor.name.toLowerCase()}`);
      this.container.setAttribute('data-widget-id', this.id);
      registry.set(this.id, this);

      this.render();
      this.startRefresh();
    }

    async render() {
      // Override in subclass
    }

    async refresh() {
      // Override in subclass
    }

    startRefresh() {
      if (this.options.refreshInterval > 0) {
        this.refreshTimer = setInterval(() => this.refresh(), this.options.refreshInterval);
      }
    }

    stopRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }

    setLoading(isLoading) {
      this.isLoading = isLoading;
      this.container.classList.toggle('widget-loading', isLoading);
    }

    setError(error) {
      this.hasError = !!error;
      this.container.classList.toggle('widget-error', this.hasError);
    }

    destroy() {
      this.stopRefresh();
      registry.delete(this.id);
      this.container.innerHTML = '';
      this.container.classList.remove('widget');
    }

    // Utility: Format number with commas
    formatNumber(num) {
      if (num === null || num === undefined) return '-';
      return new Intl.NumberFormat().format(num);
    }

    // Utility: Format currency (handles SC, GC, USD)
    formatCurrency(amount, currency = 'USD') {
      if (amount === null || amount === undefined) return '-';
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);

      // Custom currency symbols for MyPrize currencies
      const symbols = { SC: 'SC ', GC: 'GC ', USD: '$' };
      const symbol = symbols[currency] || `${currency} `;
      return currency === 'USD' ? `${symbol}${formatted}` : `${symbol}${formatted}`;
    }

    // Utility: Format relative time
    formatRelativeTime(date) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const diff = (new Date(date) - new Date()) / 1000;

      if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
      if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
      if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
      return rtf.format(Math.round(diff / 86400), 'day');
    }

    // Create skeleton loader
    createSkeleton(type = 'text', count = 1) {
      const skeletons = [];
      for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        if (type === 'text') {
          skeleton.style.height = '1em';
          skeleton.style.marginBottom = '0.5em';
          if (i === count - 1) skeleton.style.width = '80%';
        } else if (type === 'circle') {
          skeleton.style.width = '40px';
          skeleton.style.height = '40px';
          skeleton.style.borderRadius = '50%';
        }
        skeletons.push(skeleton);
      }
      return skeletons;
    }
  }

  /**
   * Stat Card Widget
   * Displays a single statistic with optional trend indicator
   */
  class StatCard extends Widget {
    constructor(container, options = {}) {
      super(container, {
        title: 'Stat',
        value: 0,
        previousValue: null,
        suffix: '',
        prefix: '',
        icon: null,
        color: 'primary',
        fetchFn: null,
        ...options,
      });
    }

    async render() {
      const { title, icon, color } = this.options;

      this.container.innerHTML = `
        <div class="stat-card card">
          ${this.options.showHeader ? `
            <div class="stat-card-header">
              ${icon ? `<span class="stat-card-icon">${icon}</span>` : ''}
              <span class="stat-card-title">${title}</span>
            </div>
          ` : ''}
          <div class="stat-card-body">
            <div class="stat-card-value text-${color}">
              <span class="value-prefix">${this.options.prefix}</span>
              <span class="value-number">-</span>
              <span class="value-suffix">${this.options.suffix}</span>
            </div>
            <div class="stat-card-change"></div>
          </div>
        </div>
      `;

      await this.refresh();
    }

    async refresh() {
      if (this.isLoading) return;

      this.setLoading(true);

      try {
        let value = this.options.value;
        let previousValue = this.options.previousValue;

        if (this.options.fetchFn) {
          const result = await this.options.fetchFn();
          value = result.value ?? result;
          previousValue = result.previousValue ?? this.data?.value;
        }

        this.data = { value, previousValue };
        this.updateDisplay(value, previousValue);
        this.setError(null);

      } catch (error) {
        console.error('[StatCard] Refresh error:', error);
        this.setError(error);
      } finally {
        this.setLoading(false);
      }
    }

    updateDisplay(value, previousValue) {
      const valueEl = this.container.querySelector('.value-number');
      const changeEl = this.container.querySelector('.stat-card-change');

      if (valueEl) {
        // Animate number change
        if (this.options.animate && this.data?.value !== undefined) {
          this.animateValue(valueEl, this.data.value, value);
        } else {
          valueEl.textContent = this.formatNumber(value);
        }
      }

      if (changeEl && previousValue !== null && previousValue !== undefined) {
        const diff = value - previousValue;
        const percentChange = previousValue !== 0
          ? ((diff / previousValue) * 100).toFixed(1)
          : 0;

        const isPositive = diff > 0;
        const isNegative = diff < 0;

        changeEl.innerHTML = `
          <span class="change-indicator ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}">
            ${isPositive ? '↑' : isNegative ? '↓' : '→'}
            ${Math.abs(percentChange)}%
          </span>
        `;
      }
    }

    animateValue(element, from, to, duration = 500) {
      const startTime = performance.now();
      const diff = to - from;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = from + (diff * easeOut);

        element.textContent = this.formatNumber(Math.round(current));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }

  /**
   * Big Wins Widget
   * Displays recent big wins with animations
   */
  class BigWins extends Widget {
    constructor(container, options = {}) {
      super(container, {
        title: 'Big Wins',
        limit: 5,
        roomId: null,
        minMultiplier: 10,
        showGame: true,
        showUser: true,
        ...options,
        refreshInterval: options.refreshInterval || 30000,
      });

      this.previousWins = [];
    }

    async render() {
      this.container.innerHTML = `
        <div class="big-wins-widget card">
          ${this.options.showHeader ? `
            <div class="card-header">
              <h3 class="card-title">
                <span class="status-dot live"></span>
                ${this.options.title}
              </h3>
            </div>
          ` : ''}
          <div class="card-body">
            <div class="wins-list"></div>
          </div>
        </div>
      `;

      await this.refresh();
    }

    async refresh() {
      if (this.isLoading) return;

      this.setLoading(true);

      try {
        const params = {
          page_size: this.options.limit,
        };

        if (this.options.roomId) {
          params.room_id = this.options.roomId;
        }

        const response = await MyPrizeAPI.bets.getBig(params);
        // API returns array directly for bets
        const wins = Array.isArray(response) ? response : (response.data || response.bets || []);

        this.renderWins(wins);
        this.previousWins = wins;
        this.setError(null);

      } catch (error) {
        console.error('[BigWins] Refresh error:', error);
        this.setError(error);
        this.renderError();
      } finally {
        this.setLoading(false);
      }
    }

    renderWins(wins) {
      const listEl = this.container.querySelector('.wins-list');
      if (!listEl) return;

      if (wins.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <p class="text-muted">No big wins yet</p>
          </div>
        `;
        return;
      }

      // Use bet_id as unique identifier (API returns bet_id, not id)
      const newWinIds = new Set(wins.map(w => w.bet_id || w.id));
      const previousIds = new Set(this.previousWins.map(w => w.bet_id || w.id));

      listEl.innerHTML = wins.map((win, index) => {
        const isNew = !previousIds.has(win.bet_id || win.id);
        const animationDelay = index * 50;

        // API uses 'igame' not 'game', and 'username' directly not 'user.username'
        const gameName = win.igame?.name || win.game?.name || 'Unknown Game';
        const gameImage = win.igame?.image || win.game?.image;
        const username = win.username || win.user?.username || 'Anonymous';
        const amount = win.amount_won || win.amount || 0;

        return `
          <div class="win-item ${isNew ? 'animate-fade-in-left' : ''}"
               style="animation-delay: ${animationDelay}ms">
            <div class="win-game">
              ${gameImage ? `<img src="${gameImage}" alt="${gameName}" class="win-game-image">` : ''}
              <div class="win-game-info">
                ${this.options.showGame ? `<span class="win-game-name">${gameName}</span>` : ''}
                ${this.options.showUser ? `<span class="win-username">${username}</span>` : ''}
              </div>
            </div>
            <div class="win-details">
              <span class="win-multiplier badge badge-success">
                ${win.multiplier?.toFixed(1) || '?'}x
              </span>
              <span class="win-amount ${isNew ? 'animate-pop-in' : ''}">
                ${this.formatCurrency(amount, win.currency)}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }

    renderError() {
      const listEl = this.container.querySelector('.wins-list');
      if (listEl) {
        listEl.innerHTML = `
          <div class="error-state">
            <p class="text-error">Failed to load wins</p>
            <button class="btn btn-sm btn-secondary" onclick="this.closest('.widget').widget?.refresh()">
              Retry
            </button>
          </div>
        `;
      }
    }
  }

  /**
   * Momentum Meter Widget
   * Visual indicator of room activity level
   */
  class MomentumMeter extends Widget {
    constructor(container, options = {}) {
      super(container, {
        roomId: null,
        showLabels: true,
        showValue: true,
        ...options,
        refreshInterval: options.refreshInterval || 60000,
      });

      this.momentum = 50; // 0-100 scale
      this.history = [];
    }

    async render() {
      this.container.innerHTML = `
        <div class="momentum-widget card">
          ${this.options.showHeader ? `
            <div class="card-header">
              <h3 class="card-title">Room Momentum</h3>
              <span class="momentum-status badge"></span>
            </div>
          ` : ''}
          <div class="card-body">
            <div class="momentum-meter">
              <div class="momentum-bar">
                <div class="momentum-indicator" style="left: 50%"></div>
              </div>
              ${this.options.showLabels ? `
                <div class="momentum-labels">
                  <span>Cold</span>
                  <span>Neutral</span>
                  <span>Hot</span>
                </div>
              ` : ''}
            </div>
            ${this.options.showValue ? `
              <div class="momentum-value">
                <span class="momentum-number">50</span>
                <span class="momentum-label text-muted">/ 100</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      await this.refresh();
    }

    async refresh() {
      if (this.isLoading || !this.options.roomId) return;

      this.setLoading(true);

      try {
        // Fetch room data and recent bets to calculate momentum
        const [roomData, recentBets] = await Promise.all([
          MyPrizeAPI.rooms.get(this.options.roomId),
          MyPrizeAPI.bets.getRecent({ room_id: this.options.roomId, page_size: 50 }),
        ]);

        // Calculate momentum based on activity
        const momentum = this.calculateMomentum(roomData, recentBets);
        this.updateMomentum(momentum);
        this.setError(null);

      } catch (error) {
        console.error('[MomentumMeter] Refresh error:', error);
        this.setError(error);
      } finally {
        this.setLoading(false);
      }
    }

    calculateMomentum(roomData, recentBets) {
      // Simple momentum calculation based on:
      // - Number of recent bets
      // - Average bet size
      // - Big win frequency

      const bets = recentBets.data || recentBets.bets || [];
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      // Count recent activity
      const recentActivity = bets.filter(bet => {
        const betTime = new Date(bet.created_at || bet.timestamp).getTime();
        return betTime > fiveMinutesAgo;
      });

      const activityScore = Math.min(recentActivity.length * 2, 40);

      // Big win bonus
      const bigWins = bets.filter(bet => (bet.multiplier || 0) > 10);
      const bigWinScore = Math.min(bigWins.length * 10, 30);

      // Room viewer bonus (if available)
      const viewerScore = Math.min((roomData.viewers || 0) / 10, 30);

      // Calculate total momentum (0-100)
      const totalMomentum = Math.min(activityScore + bigWinScore + viewerScore, 100);

      return Math.round(totalMomentum);
    }

    updateMomentum(newMomentum) {
      const oldMomentum = this.momentum;
      this.momentum = newMomentum;
      this.history.push({ value: newMomentum, timestamp: Date.now() });

      // Keep last 60 data points
      if (this.history.length > 60) {
        this.history.shift();
      }

      // Animate the indicator
      const indicator = this.container.querySelector('.momentum-indicator');
      const numberEl = this.container.querySelector('.momentum-number');
      const statusBadge = this.container.querySelector('.momentum-status');

      if (indicator) {
        indicator.style.left = `${newMomentum}%`;
        indicator.style.borderColor = this.getMomentumColor(newMomentum);
      }

      if (numberEl && this.options.animate) {
        this.animateNumber(numberEl, oldMomentum, newMomentum);
      } else if (numberEl) {
        numberEl.textContent = newMomentum;
      }

      if (statusBadge) {
        const status = this.getMomentumStatus(newMomentum);
        statusBadge.textContent = status.label;
        statusBadge.className = `momentum-status badge badge-${status.type}`;
      }
    }

    getMomentumColor(value) {
      if (value < 25) return 'var(--color-info)';
      if (value < 50) return 'var(--color-success)';
      if (value < 75) return 'var(--color-warning)';
      return 'var(--color-error)';
    }

    getMomentumStatus(value) {
      if (value < 25) return { label: 'Cold', type: 'info' };
      if (value < 50) return { label: 'Warming Up', type: 'success' };
      if (value < 75) return { label: 'Hot', type: 'warning' };
      return { label: 'On Fire!', type: 'error' };
    }

    animateNumber(element, from, to, duration = 500) {
      const startTime = performance.now();
      const diff = to - from;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = from + (diff * easeOut);

        element.textContent = Math.round(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }

  /**
   * Rate Limit Monitor Widget
   * Shows current API usage
   */
  class RateLimitMonitor extends Widget {
    constructor(container, options = {}) {
      super(container, {
        showWarningAt: 70,
        showDangerAt: 90,
        ...options,
        refreshInterval: options.refreshInterval || 5000,
      });
    }

    async render() {
      this.container.innerHTML = `
        <div class="rate-limit-widget card">
          ${this.options.showHeader ? `
            <div class="card-header">
              <h3 class="card-title">API Usage</h3>
            </div>
          ` : ''}
          <div class="card-body">
            <div class="rate-limit-display">
              <div class="rate-limit-text">
                <span class="rate-limit-used">0</span>
                <span class="rate-limit-separator">/</span>
                <span class="rate-limit-total">5,000</span>
              </div>
              <div class="rate-limit-percentage">0%</div>
            </div>
            <div class="progress">
              <div class="progress-bar" style="width: 0%"></div>
            </div>
            <div class="rate-limit-reset text-muted text-sm">
              Resets in <span class="reset-time">5:00</span>
            </div>
          </div>
        </div>
      `;

      this.refresh();
    }

    refresh() {
      const status = MyPrizeAPI.getRateLimitStatus();
      this.updateDisplay(status);
    }

    updateDisplay(status) {
      const usedEl = this.container.querySelector('.rate-limit-used');
      const totalEl = this.container.querySelector('.rate-limit-total');
      const percentEl = this.container.querySelector('.rate-limit-percentage');
      const progressBar = this.container.querySelector('.progress-bar');
      const resetEl = this.container.querySelector('.reset-time');

      if (usedEl) usedEl.textContent = this.formatNumber(status.used);
      if (totalEl) totalEl.textContent = this.formatNumber(status.limit);
      if (percentEl) percentEl.textContent = `${status.percentage.toFixed(1)}%`;

      if (progressBar) {
        progressBar.style.width = `${status.percentage}%`;

        // Update color based on thresholds
        progressBar.classList.remove('bg-success', 'bg-warning', 'bg-error');
        if (status.percentage >= this.options.showDangerAt) {
          progressBar.classList.add('bg-error');
        } else if (status.percentage >= this.options.showWarningAt) {
          progressBar.classList.add('bg-warning');
        } else {
          progressBar.classList.add('bg-success');
        }
      }

      if (resetEl) {
        const minutes = Math.floor(status.resetsIn / 60000);
        const seconds = Math.floor((status.resetsIn % 60000) / 1000);
        resetEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  }

  /**
   * Missions List Widget
   * Displays active missions with progress
   */
  class MissionsList extends Widget {
    constructor(container, options = {}) {
      super(container, {
        title: 'Active Missions',
        roomId: null,
        limit: 5,
        showProgress: true,
        ...options,
        refreshInterval: options.refreshInterval || 60000,
      });
    }

    async render() {
      this.container.innerHTML = `
        <div class="missions-widget card">
          ${this.options.showHeader ? `
            <div class="card-header">
              <h3 class="card-title">${this.options.title}</h3>
            </div>
          ` : ''}
          <div class="card-body">
            <div class="missions-list"></div>
          </div>
        </div>
      `;

      await this.refresh();
    }

    async refresh() {
      if (this.isLoading) return;

      this.setLoading(true);

      try {
        const params = {
          status: 'active',
          page_size: this.options.limit,
        };

        if (this.options.roomId) {
          params.room_id = this.options.roomId;
        }

        const response = await MyPrizeAPI.missions.list(params);
        const missions = response.data || response.missions || [];

        this.renderMissions(missions);
        this.setError(null);

      } catch (error) {
        console.error('[MissionsList] Refresh error:', error);
        this.setError(error);
      } finally {
        this.setLoading(false);
      }
    }

    renderMissions(missions) {
      const listEl = this.container.querySelector('.missions-list');
      if (!listEl) return;

      if (missions.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <p class="text-muted">No active missions</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = missions.map((mission, index) => {
        const progress = mission.progress || 0;
        const total = mission.total || 100;
        const percentage = Math.min((progress / total) * 100, 100);

        return `
          <div class="mission-item list-item animate-fade-in-up" style="animation-delay: ${index * 50}ms">
            <div class="mission-icon list-item-icon">
              ${mission.images?.icon ? `<img src="${mission.images.icon}" alt="">` : '🎯'}
            </div>
            <div class="mission-content list-item-content">
              <div class="mission-name list-item-title">${mission.name}</div>
              ${this.options.showProgress ? `
                <div class="mission-progress">
                  <div class="progress" style="height: 6px;">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                  </div>
                  <span class="mission-progress-text text-sm text-muted">
                    ${progress} / ${total}
                  </span>
                </div>
              ` : ''}
            </div>
            <div class="mission-reward list-item-action">
              ${mission.reward ? `
                <span class="badge badge-primary">${mission.reward}</span>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Widget factory
  function create(type, container, options) {
    const widgetClasses = {
      stat: StatCard,
      'stat-card': StatCard,
      'big-wins': BigWins,
      bigwins: BigWins,
      momentum: MomentumMeter,
      'momentum-meter': MomentumMeter,
      'rate-limit': RateLimitMonitor,
      ratelimit: RateLimitMonitor,
      missions: MissionsList,
      'missions-list': MissionsList,
    };

    const WidgetClass = widgetClasses[type.toLowerCase()];
    if (!WidgetClass) {
      throw new Error(`Unknown widget type: ${type}`);
    }

    return new WidgetClass(container, options);
  }

  // Get widget by ID
  function get(id) {
    return registry.get(id);
  }

  // Get all widgets
  function getAll() {
    return Array.from(registry.values());
  }

  // Destroy all widgets
  function destroyAll() {
    registry.forEach(widget => widget.destroy());
  }

  // Public API
  return {
    create,
    get,
    getAll,
    destroyAll,

    // Widget classes for direct instantiation
    Widget,
    StatCard,
    BigWins,
    MomentumMeter,
    RateLimitMonitor,
    MissionsList,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Widgets;
}
