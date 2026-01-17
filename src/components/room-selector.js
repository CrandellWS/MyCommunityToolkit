/**
 * MyPrize Streamer Toolkit - Room Selector Component
 * Allows users to search and select a room by slug
 */
console.log('[RoomSelector] Module loading...');

const RoomSelector = (() => {
  'use strict';

  // State
  let currentRoom = null;
  let availableRooms = [];
  let isLoading = false;
  let apiAvailable = true;
  const listeners = new Set();

  /**
   * Initialize the room selector
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   */
  function init(container, options = {}) {
    const containerEl = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!containerEl) {
      console.error('[RoomSelector] Container not found');
      return;
    }

    const opts = {
      placeholder: 'Enter room slug (e.g., gwaslots)',
      showSuggestions: true,
      autoLoadFromUrl: true,
      urlParam: 'room',
      storageKey: 'myprize_selected_room',
      ...options,
    };

    // Render the component
    render(containerEl, opts);

    // Try to load rooms list
    loadAvailableRooms();

    // Check URL param or storage for initial room
    if (opts.autoLoadFromUrl) {
      const urlRoom = getUrlParam(opts.urlParam);
      if (urlRoom) {
        selectRoomBySlug(urlRoom);
      } else {
        // Try to load from storage
        const stored = loadFromStorage(opts.storageKey);
        if (stored) {
          currentRoom = stored;
          updateDisplay(containerEl);
          notifyListeners();
        }
      }
    }
  }

  /**
   * Render the room selector UI
   */
  function render(container, opts) {
    container.innerHTML = `
      <div class="room-selector card">
        <div class="room-selector-header">
          <h3 class="room-selector-title">
            <span class="room-icon">&#127968;</span>
            Select Room
          </h3>
          <div class="room-selector-status">
            <span class="status-dot"></span>
            <span class="status-text">No room selected</span>
          </div>
        </div>

        <div class="room-selector-body">
          <div class="room-input-wrapper">
            <input type="text"
                   class="room-input"
                   placeholder="${opts.placeholder}"
                   autocomplete="off"
                   spellcheck="false">
            <button class="btn btn-primary room-search-btn" title="Search">
              <span>&#128269;</span>
            </button>
          </div>

          <div class="room-suggestions" style="display: none;"></div>

          <div class="room-error" style="display: none;"></div>
        </div>

        <div class="room-selected" style="display: none;">
          <div class="room-info">
            <img class="room-avatar" src="" alt="">
            <div class="room-details">
              <span class="room-name"></span>
              <span class="room-slug text-muted"></span>
            </div>
          </div>
          <div class="room-stats">
            <span class="room-viewers">
              <span class="viewer-icon">&#128065;</span>
              <span class="viewer-count">0</span>
            </span>
            <span class="room-stream-status"></span>
          </div>
          <button class="btn btn-secondary btn-sm room-change-btn" title="Change room">
            Change
          </button>
          <button class="btn btn-ghost btn-sm room-clear-btn" title="Clear selection">
            &#10005;
          </button>
        </div>
      </div>
    `;

    // Bind events
    const input = container.querySelector('.room-input');
    const searchBtn = container.querySelector('.room-search-btn');
    const clearBtn = container.querySelector('.room-clear-btn');
    const suggestions = container.querySelector('.room-suggestions');

    input.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (value.length >= 2 && opts.showSuggestions) {
        showSuggestions(container, value);
      } else {
        hideSuggestions(container);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = input.value.trim();
        if (value) {
          selectRoomBySlug(value, container);
        }
      } else if (e.key === 'Escape') {
        hideSuggestions(container);
      }
    });

    searchBtn.addEventListener('click', () => {
      const value = input.value.trim();
      if (value) {
        selectRoomBySlug(value, container);
      }
    });

    clearBtn.addEventListener('click', () => {
      clearRoom(container);
    });

    const changeBtn = container.querySelector('.room-change-btn');
    changeBtn.addEventListener('click', () => {
      showChangeMode(container);
    });

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        hideSuggestions(container);
      }
    });
  }

  /**
   * Load available rooms from API
   */
  async function loadAvailableRooms() {
    try {
      isLoading = true;
      const response = await MyPrizeAPI.rooms.list({ page_size: 100 });
      availableRooms = response.results || response.data || [];
      apiAvailable = true;
      console.log(`[RoomSelector] Loaded ${availableRooms.length} rooms`);
    } catch (error) {
      console.warn('[RoomSelector] Failed to load rooms list:', error.message);
      apiAvailable = false;
      availableRooms = [];
    } finally {
      isLoading = false;
    }
  }

  /**
   * Show room suggestions based on input
   */
  function showSuggestions(container, query) {
    const suggestionsEl = container.querySelector('.room-suggestions');
    if (!suggestionsEl) return;

    const lowerQuery = query.toLowerCase();
    const matches = availableRooms.filter(room =>
      room.name?.toLowerCase().includes(lowerQuery) ||
      room.url_path?.toLowerCase().includes(lowerQuery) ||
      room.creator_username?.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);

    if (matches.length === 0) {
      if (apiAvailable) {
        suggestionsEl.innerHTML = `
          <div class="suggestion-empty">
            No rooms found. You can still enter a slug manually.
          </div>
        `;
      } else {
        suggestionsEl.innerHTML = `
          <div class="suggestion-empty suggestion-warning">
            Room list unavailable. Enter your room slug and press Enter.
          </div>
        `;
      }
    } else {
      suggestionsEl.innerHTML = matches.map(room => `
        <div class="suggestion-item" data-slug="${room.url_path}">
          <img class="suggestion-avatar"
               src="${room.avatar || ''}"
               alt=""
               onerror="this.style.display='none'">
          <div class="suggestion-info">
            <span class="suggestion-name">${escapeHtml(room.name)}</span>
            <span class="suggestion-slug text-muted">${room.url_path}</span>
          </div>
          <span class="suggestion-status ${room.stream_status === 'online' ? 'online' : ''}">
            ${room.stream_status === 'online' ? 'LIVE' : ''}
          </span>
        </div>
      `).join('');

      // Bind click events
      suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const slug = item.dataset.slug;
          selectRoomBySlug(slug, container);
          hideSuggestions(container);
        });
      });
    }

    suggestionsEl.style.display = 'block';
  }

  /**
   * Hide suggestions dropdown
   */
  function hideSuggestions(container) {
    const suggestionsEl = container.querySelector('.room-suggestions');
    if (suggestionsEl) {
      suggestionsEl.style.display = 'none';
    }
  }

  /**
   * Select a room by slug
   */
  async function selectRoomBySlug(slug, container) {
    const normalizedSlug = slug.toLowerCase().trim();

    // Find container if not provided
    if (!container) {
      container = document.querySelector('.room-selector')?.parentElement;
    }

    setLoading(container, true);
    hideError(container);

    try {
      // Look up room by slug
      const room = await MyPrizeAPI.rooms.getBySlug(normalizedSlug);

      currentRoom = {
        id: room.id,
        slug: room.url_path,
        name: room.name,
        avatar: room.avatar,
        streamStatus: room.stream_status,
        viewerCount: room.current_user_count || 0,
        creatorUsername: room.creator_username,
        description: room.description,
        followerCount: room.follower_count,
        lastGame: room.last_igame_played_name,
        socialAccounts: room.creator_social_accounts || [],
      };

      // Save to storage
      saveToStorage('myprize_selected_room', currentRoom);

      // Update URL
      updateUrlParam('room', normalizedSlug);

      // Update display
      updateDisplay(container);

      // Clear input
      if (container) {
        const input = container.querySelector('.room-input');
        if (input) input.value = '';
        hideSuggestions(container);
      }

      // Notify listeners
      notifyListeners();

      console.log('[RoomSelector] Room selected:', currentRoom.name, currentRoom.id);

    } catch (error) {
      console.error('[RoomSelector] Failed to load room:', error);
      showError(container, `Room "${normalizedSlug}" not found. Check the slug and try again.`);
    } finally {
      setLoading(container, false);
    }
  }

  /**
   * Show change mode - display input while keeping current room
   */
  function showChangeMode(container) {
    if (!container) return;

    const inputWrapper = container.querySelector('.room-selector-body');
    const selectedEl = container.querySelector('.room-selected');
    const input = container.querySelector('.room-input');

    // Show both input and current selection
    if (inputWrapper) inputWrapper.style.display = 'block';
    if (selectedEl) selectedEl.style.opacity = '0.5';
    if (input) {
      input.value = '';
      input.focus();
      input.placeholder = 'Enter new room slug...';
    }
  }

  /**
   * Clear the selected room
   */
  function clearRoom(container) {
    currentRoom = null;
    localStorage.removeItem('myprize_selected_room');
    removeUrlParam('room');
    updateDisplay(container);
    notifyListeners();
  }

  /**
   * Update the display based on current state
   */
  function updateDisplay(container) {
    if (!container) return;

    const inputWrapper = container.querySelector('.room-selector-body');
    const selectedEl = container.querySelector('.room-selected');
    const statusDot = container.querySelector('.status-dot');
    const statusText = container.querySelector('.status-text');

    if (currentRoom) {
      // Show selected room
      if (inputWrapper) inputWrapper.style.display = 'none';
      if (selectedEl) {
        selectedEl.style.display = 'flex';
        selectedEl.style.opacity = '1';

        const avatar = selectedEl.querySelector('.room-avatar');
        const name = selectedEl.querySelector('.room-name');
        const slug = selectedEl.querySelector('.room-slug');
        const viewers = selectedEl.querySelector('.viewer-count');
        const streamStatus = selectedEl.querySelector('.room-stream-status');

        if (avatar) {
          avatar.src = currentRoom.avatar || '';
          avatar.style.display = currentRoom.avatar ? 'block' : 'none';
        }
        if (name) name.textContent = currentRoom.name;
        if (slug) slug.textContent = `/${currentRoom.slug}`;
        if (viewers) viewers.textContent = currentRoom.viewerCount;
        if (streamStatus) {
          const isLive = currentRoom.streamStatus === 'online';
          streamStatus.textContent = isLive ? 'LIVE' : 'Offline';
          streamStatus.className = `room-stream-status ${isLive ? 'live' : 'offline'}`;
        }
      }

      if (statusDot) statusDot.className = 'status-dot connected';
      if (statusText) statusText.textContent = currentRoom.name;

    } else {
      // Show input
      if (inputWrapper) inputWrapper.style.display = 'block';
      if (selectedEl) selectedEl.style.display = 'none';
      if (statusDot) statusDot.className = 'status-dot';
      if (statusText) statusText.textContent = 'No room selected';
    }
  }

  /**
   * Set loading state
   */
  function setLoading(container, loading) {
    if (!container) return;
    const btn = container.querySelector('.room-search-btn');
    const input = container.querySelector('.room-input');

    if (btn) {
      btn.disabled = loading;
      btn.innerHTML = loading ? '<span class="spinner"></span>' : '<span>&#128269;</span>';
    }
    if (input) {
      input.disabled = loading;
    }
  }

  /**
   * Show error message
   */
  function showError(container, message) {
    if (!container) return;
    const errorEl = container.querySelector('.room-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  /**
   * Hide error message
   */
  function hideError(container) {
    if (!container) return;
    const errorEl = container.querySelector('.room-error');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  // URL helpers
  function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function updateUrlParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.replaceState({}, '', url);
  }

  function removeUrlParam(name) {
    const url = new URL(window.location);
    url.searchParams.delete(name);
    window.history.replaceState({}, '', url);
  }

  // Storage helpers
  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('[RoomSelector] Failed to save to storage:', e);
    }
  }

  function loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  // Event helpers
  function subscribe(callback) {
    listeners.add(callback);
    // Immediately call with current room if exists
    if (currentRoom) {
      callback(currentRoom);
    }
    return () => listeners.delete(callback);
  }

  function notifyListeners() {
    listeners.forEach(callback => {
      try {
        callback(currentRoom);
      } catch (e) {
        console.error('[RoomSelector] Listener error:', e);
      }
    });
  }

  // Utility
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Get current room
   */
  function getRoom() {
    return currentRoom;
  }

  /**
   * Get room ID (convenience method)
   */
  function getRoomId() {
    return currentRoom?.id || null;
  }

  /**
   * Get room slug (convenience method)
   */
  function getRoomSlug() {
    return currentRoom?.slug || null;
  }

  // Public API
  return {
    init,
    getRoom,
    getRoomId,
    getRoomSlug,
    selectRoomBySlug,
    clearRoom,
    subscribe,
    loadAvailableRooms,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoomSelector;
}
