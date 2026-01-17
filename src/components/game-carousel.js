/**
 * MyPrize Streamer Toolkit - Game Carousel Widget
 * Horizontal scrolling game showcase with smooth animations
 * @module GameCarousel
 */
console.log('[GameCarousel] Module loading...');

const GameCarousel = (() => {
  'use strict';

  /**
   * Default configuration options
   * @type {Object}
   */
  const defaultOptions = {
    title: 'Popular Games',
    limit: 20,
    roomId: null,
    provider: null,
    showHeader: true,
    showArrows: true,
    showDots: false,
    autoScroll: false,
    autoScrollInterval: 5000,
    cardWidth: 180,
    gap: 16,
    showProvider: true,
    showMultiplier: true,
    animate: true,
    refreshInterval: 120000,
  };

  /**
   * Game Carousel Widget Class
   * @class
   */
  class GameCarouselWidget {
    /**
     * Create a game carousel widget
     * @param {string|HTMLElement} container - Container selector or element
     * @param {Object} options - Configuration options
     * @param {string} [options.title='Popular Games'] - Widget title
     * @param {number} [options.limit=20] - Number of games to load
     * @param {string} [options.roomId] - Room ID to get recent games for
     * @param {string} [options.provider] - Filter by game provider
     * @param {boolean} [options.showHeader=true] - Show widget header
     * @param {boolean} [options.showArrows=true] - Show navigation arrows
     * @param {boolean} [options.showDots=false] - Show pagination dots
     * @param {boolean} [options.autoScroll=false] - Enable auto-scrolling
     * @param {number} [options.autoScrollInterval=5000] - Auto-scroll interval in ms
     * @param {number} [options.cardWidth=180] - Width of each game card in px
     * @param {number} [options.gap=16] - Gap between cards in px
     * @param {boolean} [options.showProvider=true] - Show game provider
     * @param {boolean} [options.showMultiplier=true] - Show multiplier range
     */
    constructor(container, options = {}) {
      this.container = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!this.container) {
        throw new Error('GameCarousel container not found');
      }

      this.options = { ...defaultOptions, ...options };
      this.id = 'carousel-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      this.refreshTimer = null;
      this.autoScrollTimer = null;
      this.isLoading = false;
      this.hasError = false;
      this.data = [];
      this.scrollPosition = 0;
      this.isDragging = false;
      this.startX = 0;
      this.scrollLeft = 0;

      this.init();
    }

    /**
     * Initialize the widget
     * @private
     */
    init() {
      this.container.classList.add('widget', 'widget-game-carousel');
      this.container.setAttribute('data-widget-id', this.id);
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-label', this.options.title);

      this.render();
      this.bindEvents();
      this.startRefresh();
    }

    /**
     * Render the widget structure
     * @private
     */
    render() {
      this.container.innerHTML = `
        <div class="game-carousel-widget card">
          ${this.options.showHeader ? `
            <div class="card-header">
              <h3 class="card-title">
                <span class="carousel-icon" aria-hidden="true">&#127918;</span>
                <span>${this.options.title}</span>
              </h3>
              ${this.options.showArrows ? `
                <div class="carousel-controls" role="group" aria-label="Carousel navigation">
                  <button class="btn btn-ghost btn-sm carousel-prev"
                          aria-label="Previous games"
                          title="Previous">
                    <span aria-hidden="true">&#10094;</span>
                  </button>
                  <button class="btn btn-ghost btn-sm carousel-next"
                          aria-label="Next games"
                          title="Next">
                    <span aria-hidden="true">&#10095;</span>
                  </button>
                </div>
              ` : ''}
            </div>
          ` : ''}
          <div class="carousel-container">
            <div class="carousel-track"
                 role="list"
                 aria-label="Game list"
                 tabindex="0"></div>
          </div>
          ${this.options.showDots ? `
            <div class="carousel-dots" role="tablist" aria-label="Carousel pages"></div>
          ` : ''}
        </div>
      `;

      this.trackEl = this.container.querySelector('.carousel-track');
      this.refresh();
    }

    /**
     * Bind event listeners
     * @private
     */
    bindEvents() {
      // Navigation buttons
      const prevBtn = this.container.querySelector('.carousel-prev');
      const nextBtn = this.container.querySelector('.carousel-next');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.scrollPrev());
        prevBtn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.scrollPrev();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.scrollNext());
        nextBtn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.scrollNext();
          }
        });
      }

      // Track element events
      if (this.trackEl) {
        // Mouse drag scrolling
        this.trackEl.addEventListener('mousedown', (e) => this.handleDragStart(e));
        this.trackEl.addEventListener('mousemove', (e) => this.handleDragMove(e));
        this.trackEl.addEventListener('mouseup', () => this.handleDragEnd());
        this.trackEl.addEventListener('mouseleave', () => this.handleDragEnd());

        // Touch scrolling
        this.trackEl.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.trackEl.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.trackEl.addEventListener('touchend', () => this.handleDragEnd());

        // Keyboard navigation
        this.trackEl.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Pause auto-scroll on hover
        if (this.options.autoScroll) {
          this.trackEl.addEventListener('mouseenter', () => this.pauseAutoScroll());
          this.trackEl.addEventListener('mouseleave', () => this.resumeAutoScroll());
        }

        // Smooth scroll end detection
        this.trackEl.addEventListener('scroll', () => this.handleScroll());
      }
    }

    /**
     * Handle drag start
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    handleDragStart(e) {
      this.isDragging = true;
      this.startX = e.pageX - this.trackEl.offsetLeft;
      this.scrollLeft = this.trackEl.scrollLeft;
      this.trackEl.style.cursor = 'grabbing';
      this.trackEl.style.userSelect = 'none';
    }

    /**
     * Handle drag move
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    handleDragMove(e) {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - this.trackEl.offsetLeft;
      const walk = (x - this.startX) * 1.5;
      this.trackEl.scrollLeft = this.scrollLeft - walk;
    }

    /**
     * Handle drag end
     * @private
     */
    handleDragEnd() {
      this.isDragging = false;
      if (this.trackEl) {
        this.trackEl.style.cursor = 'grab';
        this.trackEl.style.userSelect = '';
      }
    }

    /**
     * Handle touch start
     * @param {TouchEvent} e - Touch event
     * @private
     */
    handleTouchStart(e) {
      this.isDragging = true;
      this.startX = e.touches[0].pageX - this.trackEl.offsetLeft;
      this.scrollLeft = this.trackEl.scrollLeft;
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e - Touch event
     * @private
     */
    handleTouchMove(e) {
      if (!this.isDragging) return;
      const x = e.touches[0].pageX - this.trackEl.offsetLeft;
      const walk = (x - this.startX) * 1.5;
      this.trackEl.scrollLeft = this.scrollLeft - walk;
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    handleKeydown(e) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.scrollPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.scrollNext();
          break;
        case 'Home':
          e.preventDefault();
          this.scrollToStart();
          break;
        case 'End':
          e.preventDefault();
          this.scrollToEnd();
          break;
      }
    }

    /**
     * Handle scroll event
     * @private
     */
    handleScroll() {
      this.scrollPosition = this.trackEl.scrollLeft;
      this.updateArrowStates();
      if (this.options.showDots) {
        this.updateDots();
      }
    }

    /**
     * Update navigation arrow states
     * @private
     */
    updateArrowStates() {
      const prevBtn = this.container.querySelector('.carousel-prev');
      const nextBtn = this.container.querySelector('.carousel-next');

      if (prevBtn) {
        const atStart = this.trackEl.scrollLeft <= 0;
        prevBtn.disabled = atStart;
        prevBtn.setAttribute('aria-disabled', atStart);
      }

      if (nextBtn) {
        const atEnd = this.trackEl.scrollLeft >= (this.trackEl.scrollWidth - this.trackEl.clientWidth - 10);
        nextBtn.disabled = atEnd;
        nextBtn.setAttribute('aria-disabled', atEnd);
      }
    }

    /**
     * Scroll to previous page
     */
    scrollPrev() {
      const scrollAmount = this.trackEl.clientWidth - this.options.cardWidth;
      this.trackEl.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }

    /**
     * Scroll to next page
     */
    scrollNext() {
      const scrollAmount = this.trackEl.clientWidth - this.options.cardWidth;
      this.trackEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    /**
     * Scroll to start
     */
    scrollToStart() {
      this.trackEl.scrollTo({ left: 0, behavior: 'smooth' });
    }

    /**
     * Scroll to end
     */
    scrollToEnd() {
      this.trackEl.scrollTo({ left: this.trackEl.scrollWidth, behavior: 'smooth' });
    }

    /**
     * Scroll to specific game by index
     * @param {number} index - Game index
     */
    scrollToGame(index) {
      const scrollPosition = index * (this.options.cardWidth + this.options.gap);
      this.trackEl.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }

    /**
     * Refresh game data from API
     * @returns {Promise<void>}
     */
    async refresh() {
      if (this.isLoading) return;

      this.setLoading(true);

      try {
        let games = [];
        const params = { page_size: this.options.limit };

        if (this.options.provider) {
          params.equals_field = 'provider';
          params.equals_value = this.options.provider;
        }

        if (this.options.roomId) {
          // Get room data to find current game
          console.log('[GameCarousel] Fetching room data for:', this.options.roomId);
          const roomData = await MyPrizeAPI.rooms.get(this.options.roomId);
          console.log('[GameCarousel] Room data:', roomData);

          // Get the currently playing game from room data
          if (roomData.last_igame_played_id) {
            console.log('[GameCarousel] Fetching current game:', roomData.last_igame_played_id);
            try {
              const currentGame = await MyPrizeAPI.igames.get(roomData.last_igame_played_id);
              console.log('[GameCarousel] Current game:', currentGame);
              games.push({
                id: currentGame.id,
                name: currentGame.name || 'Unknown Game',
                provider: currentGame.provider || currentGame.studio || 'Unknown',
                image: currentGame.image || currentGame.thumbnail || null,
                urlPath: currentGame.url_path,
                multiplierMin: 1,
                multiplierMax: 100,
                popularity: 999, // High priority for current game
                category: 'Slots',
                isCurrentlyPlaying: true,
              });
            } catch (e) {
              console.warn('[GameCarousel] Could not fetch current game:', e);
            }
          }

          // Fill rest with popular games
          const popularResponse = await MyPrizeAPI.igames.list({ page_size: this.options.limit });
          const popularGames = this.normalizeGameData(popularResponse);

          // Add popular games that aren't already in the list
          const existingIds = new Set(games.map(g => g.id));
          for (const game of popularGames) {
            if (!existingIds.has(game.id) && games.length < this.options.limit) {
              games.push(game);
            }
          }

          this.updateTitle(games[0]?.isCurrentlyPlaying ? 'Now Playing & Popular' : 'Popular Games');
        } else {
          // Get general games list
          const response = await MyPrizeAPI.igames.list(params);
          games = this.normalizeGameData(response);
        }

        this.data = games;
        this.renderGames();
        console.log('[GameCarousel] Rendered', games.length, 'games');
        this.setError(null);

        if (this.options.autoScroll) {
          this.startAutoScroll();
        }

      } catch (error) {
        console.error('[GameCarousel] Refresh error:', error);
        this.setError(error);
        this.renderError();
      } finally {
        this.setLoading(false);
      }
    }

    /**
     * Normalize game data from different API response formats
     * @param {Object|Array} response - API response
     * @returns {Array} Normalized games
     * @private
     */
    normalizeGameData(response) {
      const data = response.igames || response.results || response.data || response.games || response;
      console.log('[GameCarousel] Raw data:', data);
      if (!Array.isArray(data)) {
        console.warn('[GameCarousel] Data is not an array:', typeof data, data);
        return [];
      }

      return data.map(game => {
        // Log first game to see available fields
        if (data.indexOf(game) === 0) {
          console.log('[GameCarousel] Sample game fields:', Object.keys(game), game);
        }
        return {
          id: game.id || game.game_id || game.reference_id,
          name: game.name || game.title || 'Unknown Game',
          provider: game.provider || game.studio || 'Unknown',
          image: game.image || game.thumbnail || game.icon || game.image_url || game.logo || null,
          urlPath: game.url_path || null,
          multiplierMin: game.multiplier_min || game.min_multiplier || 1,
          multiplierMax: game.multiplier_max || game.max_multiplier || 100,
          popularity: game.popularity || game.play_count || 0,
          category: game.category || game.type || 'Slots',
        };
      });
    }

    /**
     * Extract unique games from bets data
     * @param {Array} bets - Array of bet objects
     * @returns {Array} Unique games
     * @private
     */
    extractGamesFromBets(bets) {
      const gameMap = new Map();

      bets.forEach(bet => {
        const igame = bet.igame;
        if (igame && igame.url_path && !gameMap.has(igame.url_path)) {
          gameMap.set(igame.url_path, {
            id: igame.reference_id || igame.url_path,
            name: igame.name || 'Unknown Game',
            provider: igame.provider || igame.studio || 'Unknown',
            image: igame.image || igame.thumbnail || null,
            urlPath: igame.url_path,
            multiplierMin: 1,
            multiplierMax: 100,
            popularity: 0,
            category: 'Slots',
          });
        }
      });

      return Array.from(gameMap.values()).slice(0, this.options.limit);
    }

    /**
     * Render game cards
     * @private
     */
    renderGames() {
      if (!this.trackEl) return;

      if (this.data.length === 0) {
        this.trackEl.innerHTML = `
          <div class="carousel-empty" role="status">
            <p class="text-muted">No games available</p>
          </div>
        `;
        return;
      }

      this.trackEl.innerHTML = this.data.map((game, index) => {
        const animationDelay = this.options.animate ? index * 30 : 0;

        return `
          <div class="game-card ${this.options.animate ? 'animate-fade-in-up' : ''}"
               role="listitem"
               tabindex="0"
               aria-label="${this.escapeHtml(game.name)} by ${game.provider}"
               style="animation-delay: ${animationDelay}ms; min-width: ${this.options.cardWidth}px;"
               data-game-id="${game.id}">
            <div class="game-card-image">
              ${game.image
                ? `<img src="${game.image}" alt="${this.escapeHtml(game.name)}" loading="lazy">`
                : `<div class="game-placeholder" aria-hidden="true">
                    <span>&#127918;</span>
                  </div>`
              }
              ${this.options.showMultiplier ? `
                <div class="game-multiplier" aria-label="Multiplier range ${game.multiplierMin}x to ${game.multiplierMax}x">
                  <span class="multiplier-badge">
                    ${game.multiplierMin}x - ${game.multiplierMax}x
                  </span>
                </div>
              ` : ''}
            </div>
            <div class="game-card-body">
              <h4 class="game-name" title="${this.escapeHtml(game.name)}">
                ${this.escapeHtml(game.name)}
              </h4>
              ${this.options.showProvider ? `
                <span class="game-provider text-muted text-sm">${game.provider}</span>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Set track style for proper scrolling
      this.trackEl.style.gap = `${this.options.gap}px`;
      this.trackEl.style.cursor = 'grab';

      // Update dots if enabled
      if (this.options.showDots) {
        this.renderDots();
      }

      // Update arrow states
      this.updateArrowStates();

      // Add click handlers to cards
      this.trackEl.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!this.isDragging) {
            const gameId = card.dataset.gameId;
            this.handleGameClick(gameId);
          }
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const gameId = card.dataset.gameId;
            this.handleGameClick(gameId);
          }
        });
      });
    }

    /**
     * Handle game card click
     * @param {string} gameId - Game ID
     * @private
     */
    handleGameClick(gameId) {
      const game = this.data.find(g => g.id === gameId);
      if (game) {
        this.container.dispatchEvent(new CustomEvent('gameselect', {
          detail: { game },
          bubbles: true,
        }));
      }
    }

    /**
     * Render pagination dots
     * @private
     */
    renderDots() {
      const dotsContainer = this.container.querySelector('.carousel-dots');
      if (!dotsContainer) return;

      const totalPages = Math.ceil(this.data.length / this.getVisibleCards());

      dotsContainer.innerHTML = Array(totalPages).fill(0).map((_, i) => `
        <button class="carousel-dot ${i === 0 ? 'active' : ''}"
                role="tab"
                aria-label="Go to page ${i + 1}"
                aria-selected="${i === 0}"
                data-page="${i}">
        </button>
      `).join('');

      dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          const page = parseInt(dot.dataset.page, 10);
          this.scrollToPage(page);
        });
      });
    }

    /**
     * Update active dot
     * @private
     */
    updateDots() {
      const dotsContainer = this.container.querySelector('.carousel-dots');
      if (!dotsContainer) return;

      const visibleCards = this.getVisibleCards();
      const currentPage = Math.round(this.trackEl.scrollLeft / (visibleCards * (this.options.cardWidth + this.options.gap)));

      dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        const isActive = i === currentPage;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', isActive);
      });
    }

    /**
     * Scroll to a specific page
     * @param {number} page - Page index
     */
    scrollToPage(page) {
      const visibleCards = this.getVisibleCards();
      const scrollPosition = page * visibleCards * (this.options.cardWidth + this.options.gap);
      this.trackEl.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }

    /**
     * Get number of visible cards
     * @returns {number} Number of visible cards
     * @private
     */
    getVisibleCards() {
      if (!this.trackEl) return 1;
      return Math.floor(this.trackEl.clientWidth / (this.options.cardWidth + this.options.gap));
    }

    /**
     * Start auto-scroll
     * @private
     */
    startAutoScroll() {
      this.stopAutoScroll();
      this.autoScrollTimer = setInterval(() => {
        const atEnd = this.trackEl.scrollLeft >= (this.trackEl.scrollWidth - this.trackEl.clientWidth - 10);
        if (atEnd) {
          this.scrollToStart();
        } else {
          this.scrollNext();
        }
      }, this.options.autoScrollInterval);
    }

    /**
     * Stop auto-scroll
     * @private
     */
    stopAutoScroll() {
      if (this.autoScrollTimer) {
        clearInterval(this.autoScrollTimer);
        this.autoScrollTimer = null;
      }
    }

    /**
     * Pause auto-scroll (on hover)
     * @private
     */
    pauseAutoScroll() {
      this.stopAutoScroll();
    }

    /**
     * Resume auto-scroll (on hover end)
     * @private
     */
    resumeAutoScroll() {
      if (this.options.autoScroll) {
        this.startAutoScroll();
      }
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
      if (this.trackEl) {
        this.trackEl.innerHTML = `
          <div class="carousel-error" role="alert">
            <p class="text-error">Failed to load games</p>
            <button class="btn btn-sm btn-secondary carousel-retry"
                    aria-label="Retry loading games">
              Retry
            </button>
          </div>
        `;

        const retryBtn = this.trackEl.querySelector('.carousel-retry');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => this.refresh());
        }
      }
    }

    /**
     * Update the widget title
     * @param {string} newTitle - New title text
     */
    updateTitle(newTitle) {
      const titleEl = this.container.querySelector('.card-title span:last-child');
      if (titleEl) {
        titleEl.textContent = newTitle;
      }
    }

    /**
     * Set loading state
     * @param {boolean} isLoading - Loading state
     */
    setLoading(isLoading) {
      this.isLoading = isLoading;
      this.container.classList.toggle('widget-loading', isLoading);

      if (isLoading && this.trackEl && this.data.length === 0) {
        this.trackEl.innerHTML = this.createSkeletonLoader();
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
        <div class="game-card skeleton-card" style="animation-delay: ${i * 50}ms; min-width: ${this.options.cardWidth}px;">
          <div class="skeleton skeleton-image"></div>
          <div class="game-card-body">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-provider"></div>
          </div>
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
      this.stopAutoScroll();
      this.container.innerHTML = '';
      this.container.classList.remove('widget', 'widget-game-carousel');
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
      this.bindEvents();
    }

    /**
     * Get current games data
     * @returns {Array} Current games
     */
    getData() {
      return [...this.data];
    }
  }

  /**
   * Create a new game carousel widget
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   * @returns {GameCarouselWidget} Widget instance
   */
  function create(container, options) {
    return new GameCarouselWidget(container, options);
  }

  // Public API
  return {
    create,
    GameCarouselWidget,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameCarousel;
}
