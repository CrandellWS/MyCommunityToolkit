/**
 * MyPrize Streamer Toolkit - Settings Modal
 * Comprehensive settings UI with theme customization and widget configuration
 * @module SettingsModal
 */

const SettingsModal = (() => {
  'use strict';

  /**
   * Default settings structure
   * @type {Object}
   */
  const defaultSettings = {
    theme: {
      preset: 'dark',
      primaryColor: '#3b82f6',
      accentColor: '#22c55e',
      borderRadius: 'lg',
      fontFamily: 'sans',
      enableAnimations: true,
      enableGlow: true,
      compactMode: false,
      highContrast: false,
    },
    overlay: {
      enabled: false,
      background: 'transparent',
      chromakeyColor: '#00ff00',
      position: 'bottom-right',
      scale: 1,
    },
    widgets: {
      refreshInterval: 30000,
      showHeaders: true,
      animateChanges: true,
    },
    api: {
      cacheEnabled: true,
      cacheDuration: 30000,
    },
  };

  let modalInstance = null;
  let currentSettings = { ...defaultSettings };
  let onSaveCallback = null;

  /**
   * Settings Modal Class
   * @class
   */
  class SettingsModalComponent {
    /**
     * Create a settings modal
     * @param {Object} options - Configuration options
     * @param {Function} [options.onSave] - Callback when settings are saved
     * @param {Object} [options.initialSettings] - Initial settings values
     */
    constructor(options = {}) {
      this.isOpen = false;
      this.activeTab = 'theme';

      if (options.initialSettings) {
        currentSettings = this.mergeSettings(currentSettings, options.initialSettings);
      }

      if (options.onSave) {
        onSaveCallback = options.onSave;
      }

      this.init();
    }

    /**
     * Deep merge settings objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     * @private
     */
    mergeSettings(target, source) {
      const result = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.mergeSettings(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    }

    /**
     * Initialize the modal
     * @private
     */
    init() {
      // Create modal container if it doesn't exist
      if (!document.getElementById('settings-modal')) {
        const modalHtml = this.createModalHtml();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
      }

      this.modal = document.getElementById('settings-modal');
      this.bindEvents();
      this.loadSettings();
    }

    /**
     * Create modal HTML structure
     * @returns {string} Modal HTML
     * @private
     */
    createModalHtml() {
      return `
        <div id="settings-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title" hidden>
          <div class="modal-container settings-modal">
            <div class="modal-header">
              <h2 id="settings-title" class="modal-title">
                <span aria-hidden="true">&#9881;</span>
                Settings
              </h2>
              <button class="btn btn-ghost btn-sm modal-close" aria-label="Close settings">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div class="modal-body">
              <nav class="settings-tabs" role="tablist" aria-label="Settings sections">
                <button class="tab-btn active" role="tab" aria-selected="true" aria-controls="tab-theme" data-tab="theme">
                  <span aria-hidden="true">&#127912;</span>
                  Theme
                </button>
                <button class="tab-btn" role="tab" aria-selected="false" aria-controls="tab-overlay" data-tab="overlay">
                  <span aria-hidden="true">&#128250;</span>
                  Overlay
                </button>
                <button class="tab-btn" role="tab" aria-selected="false" aria-controls="tab-widgets" data-tab="widgets">
                  <span aria-hidden="true">&#128300;</span>
                  Widgets
                </button>
                <button class="tab-btn" role="tab" aria-selected="false" aria-controls="tab-export" data-tab="export">
                  <span aria-hidden="true">&#128230;</span>
                  Export
                </button>
              </nav>

              <div class="settings-content">
                <!-- Theme Tab -->
                <div id="tab-theme" class="tab-panel active" role="tabpanel" aria-labelledby="tab-theme">
                  <div class="settings-section">
                    <h3 class="settings-section-title">Theme Preset</h3>
                    <div class="theme-presets" role="radiogroup" aria-label="Theme presets">
                      <label class="theme-preset-option">
                        <input type="radio" name="theme-preset" value="light" aria-label="Light theme">
                        <span class="theme-preview light"></span>
                        <span class="theme-label">Light</span>
                      </label>
                      <label class="theme-preset-option">
                        <input type="radio" name="theme-preset" value="dark" aria-label="Dark theme">
                        <span class="theme-preview dark"></span>
                        <span class="theme-label">Dark</span>
                      </label>
                      <label class="theme-preset-option">
                        <input type="radio" name="theme-preset" value="neon" aria-label="Neon theme">
                        <span class="theme-preview neon"></span>
                        <span class="theme-label">Neon</span>
                      </label>
                      <label class="theme-preset-option">
                        <input type="radio" name="theme-preset" value="sunset" aria-label="Sunset theme">
                        <span class="theme-preview sunset"></span>
                        <span class="theme-label">Sunset</span>
                      </label>
                      <label class="theme-preset-option">
                        <input type="radio" name="theme-preset" value="forest" aria-label="Forest theme">
                        <span class="theme-preview forest"></span>
                        <span class="theme-label">Forest</span>
                      </label>
                    </div>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">Custom Colors</h3>
                    <div class="settings-row">
                      <label for="primary-color" class="settings-label">Primary Color</label>
                      <input type="color" id="primary-color" class="color-input" aria-describedby="primary-color-desc">
                      <span id="primary-color-desc" class="sr-only">Choose the primary brand color</span>
                    </div>
                    <div class="settings-row">
                      <label for="accent-color" class="settings-label">Accent Color</label>
                      <input type="color" id="accent-color" class="color-input" aria-describedby="accent-color-desc">
                      <span id="accent-color-desc" class="sr-only">Choose the secondary accent color</span>
                    </div>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">Appearance</h3>
                    <div class="settings-row">
                      <label for="border-radius" class="settings-label">Border Radius</label>
                      <select id="border-radius" class="settings-select">
                        <option value="none">None</option>
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                        <option value="full">Full (Pill)</option>
                      </select>
                    </div>
                    <div class="settings-row">
                      <label for="font-family" class="settings-label">Font Family</label>
                      <select id="font-family" class="settings-select">
                        <option value="sans">System Sans</option>
                        <option value="mono">Monospace</option>
                        <option value="display">Display</option>
                      </select>
                    </div>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">Effects</h3>
                    <div class="settings-row toggle-row">
                      <label for="enable-animations" class="settings-label">Enable Animations</label>
                      <button id="enable-animations" class="toggle" role="switch" aria-checked="true">
                        <span class="toggle-slider"></span>
                      </button>
                    </div>
                    <div class="settings-row toggle-row">
                      <label for="enable-glow" class="settings-label">Enable Glow Effects</label>
                      <button id="enable-glow" class="toggle" role="switch" aria-checked="true">
                        <span class="toggle-slider"></span>
                      </button>
                    </div>
                    <div class="settings-row toggle-row">
                      <label for="compact-mode" class="settings-label">Compact Mode</label>
                      <button id="compact-mode" class="toggle" role="switch" aria-checked="false">
                        <span class="toggle-slider"></span>
                      </button>
                    </div>
                    <div class="settings-row toggle-row">
                      <label for="high-contrast" class="settings-label">High Contrast</label>
                      <button id="high-contrast" class="toggle" role="switch" aria-checked="false">
                        <span class="toggle-slider"></span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Overlay Tab -->
                <div id="tab-overlay" class="tab-panel" role="tabpanel" aria-labelledby="tab-overlay" hidden>
                  <div class="settings-section">
                    <h3 class="settings-section-title">Overlay Mode</h3>
                    <div class="settings-row toggle-row">
                      <label for="overlay-enabled" class="settings-label">Enable Overlay Mode</label>
                      <button id="overlay-enabled" class="toggle" role="switch" aria-checked="false">
                        <span class="toggle-slider"></span>
                      </button>
                    </div>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">Background</h3>
                    <div class="settings-row">
                      <label for="overlay-background" class="settings-label">Background Type</label>
                      <select id="overlay-background" class="settings-select">
                        <option value="transparent">Transparent</option>
                        <option value="chromakey">Chromakey</option>
                        <option value="solid">Solid Color</option>
                        <option value="blur">Blur Glass</option>
                      </select>
                    </div>
                    <div class="settings-row chromakey-row">
                      <label for="chromakey-color" class="settings-label">Chromakey Color</label>
                      <input type="color" id="chromakey-color" class="color-input" value="#00ff00">
                    </div>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">Position & Scale</h3>
                    <div class="settings-row">
                      <label for="overlay-position" class="settings-label">Position</label>
                      <select id="overlay-position" class="settings-select">
                        <option value="top-left">Top Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="center">Center</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>
                    <div class="settings-row">
                      <label for="overlay-scale" class="settings-label">Scale</label>
                      <input type="range" id="overlay-scale" min="0.5" max="2" step="0.1" value="1" class="settings-range">
                      <span class="range-value" aria-live="polite">1x</span>
                    </div>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">OBS Browser Source URLs</h3>
                    <div class="overlay-urls">
                      <div class="url-item">
                        <span class="url-label">Big Wins</span>
                        <input type="text" readonly class="url-input" value="demos/overlay-big-wins.html" aria-label="Big Wins overlay URL">
                        <button class="btn btn-ghost btn-sm copy-url" aria-label="Copy URL">
                          <span aria-hidden="true">&#128203;</span>
                        </button>
                      </div>
                      <div class="url-item">
                        <span class="url-label">Leaderboard</span>
                        <input type="text" readonly class="url-input" value="demos/overlay-leaderboard.html" aria-label="Leaderboard overlay URL">
                        <button class="btn btn-ghost btn-sm copy-url" aria-label="Copy URL">
                          <span aria-hidden="true">&#128203;</span>
                        </button>
                      </div>
                      <div class="url-item">
                        <span class="url-label">Momentum</span>
                        <input type="text" readonly class="url-input" value="demos/overlay-momentum.html" aria-label="Momentum overlay URL">
                        <button class="btn btn-ghost btn-sm copy-url" aria-label="Copy URL">
                          <span aria-hidden="true">&#128203;</span>
                        </button>
                      </div>
                      <div class="url-item">
                        <span class="url-label">Stats</span>
                        <input type="text" readonly class="url-input" value="demos/overlay-stats.html" aria-label="Stats overlay URL">
                        <button class="btn btn-ghost btn-sm copy-url" aria-label="Copy URL">
                          <span aria-hidden="true">&#128203;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Widgets Tab -->
                <div id="tab-widgets" class="tab-panel" role="tabpanel" aria-labelledby="tab-widgets" hidden>
                  <div class="settings-section">
                    <h3 class="settings-section-title">General</h3>
                    <div class="settings-row">
                      <label for="refresh-interval" class="settings-label">Refresh Interval</label>
                      <select id="refresh-interval" class="settings-select">
                        <option value="10000">10 seconds</option>
                        <option value="30000">30 seconds</option>
                        <option value="60000">1 minute</option>
                        <option value="120000">2 minutes</option>
                        <option value="300000">5 minutes</option>
                      </select>
                    </div>
                    <div class="settings-row toggle-row">
                      <label for="show-headers" class="settings-label">Show Widget Headers</label>
                      <button id="show-headers" class="toggle" role="switch" aria-checked="true">
                        <span class="toggle-slider"></span>
                      </button>
                    </div>
                    <div class="settings-row toggle-row">
                      <label for="animate-changes" class="settings-label">Animate Value Changes</label>
                      <button id="animate-changes" class="toggle" role="switch" aria-checked="true">
                        <span class="toggle-slider"></span>
                      </button>
                    </div>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">API Settings</h3>
                    <div class="settings-row toggle-row">
                      <label for="cache-enabled" class="settings-label">Enable Caching</label>
                      <button id="cache-enabled" class="toggle" role="switch" aria-checked="true">
                        <span class="toggle-slider"></span>
                      </button>
                    </div>
                    <div class="settings-row">
                      <label for="cache-duration" class="settings-label">Cache Duration</label>
                      <select id="cache-duration" class="settings-select">
                        <option value="15000">15 seconds</option>
                        <option value="30000">30 seconds</option>
                        <option value="60000">1 minute</option>
                        <option value="120000">2 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Export Tab -->
                <div id="tab-export" class="tab-panel" role="tabpanel" aria-labelledby="tab-export" hidden>
                  <div class="settings-section">
                    <h3 class="settings-section-title">Export Settings</h3>
                    <p class="settings-description">Download your current settings as a JSON file to use on another device or as a backup.</p>
                    <button class="btn btn-primary" id="export-settings">
                      <span aria-hidden="true">&#128190;</span>
                      Export Settings
                    </button>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">Import Settings</h3>
                    <p class="settings-description">Import a previously exported settings file.</p>
                    <label class="btn btn-secondary file-input-label">
                      <span aria-hidden="true">&#128194;</span>
                      Import Settings
                      <input type="file" id="import-settings" accept=".json" class="sr-only">
                    </label>
                  </div>

                  <div class="settings-section">
                    <h3 class="settings-section-title">Reset to Defaults</h3>
                    <p class="settings-description">Reset all settings to their default values. This cannot be undone.</p>
                    <button class="btn btn-ghost text-error" id="reset-settings">
                      <span aria-hidden="true">&#9888;</span>
                      Reset All Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-ghost" id="cancel-settings">Cancel</button>
              <button class="btn btn-primary" id="save-settings">Save Changes</button>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * Bind event listeners
     * @private
     */
    bindEvents() {
      // Close button
      this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
      this.modal.querySelector('#cancel-settings').addEventListener('click', () => this.close());

      // Overlay click to close
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });

      // Escape key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });

      // Tab navigation
      this.modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const tabs = Array.from(this.modal.querySelectorAll('.tab-btn'));
            const currentIndex = tabs.indexOf(btn);
            const nextIndex = e.key === 'ArrowRight'
              ? (currentIndex + 1) % tabs.length
              : (currentIndex - 1 + tabs.length) % tabs.length;
            tabs[nextIndex].focus();
            tabs[nextIndex].click();
          }
        });
      });

      // Toggle buttons
      this.modal.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
          const isChecked = toggle.getAttribute('aria-checked') === 'true';
          toggle.setAttribute('aria-checked', !isChecked);
          toggle.classList.toggle('active', !isChecked);
        });
        toggle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle.click();
          }
        });
      });

      // Range input
      const scaleRange = this.modal.querySelector('#overlay-scale');
      const scaleValue = this.modal.querySelector('.range-value');
      if (scaleRange && scaleValue) {
        scaleRange.addEventListener('input', () => {
          scaleValue.textContent = `${scaleRange.value}x`;
        });
      }

      // Copy URL buttons
      this.modal.querySelectorAll('.copy-url').forEach(btn => {
        btn.addEventListener('click', () => {
          const input = btn.previousElementSibling;
          navigator.clipboard.writeText(input.value);
          btn.innerHTML = '<span aria-hidden="true">&#10003;</span>';
          setTimeout(() => {
            btn.innerHTML = '<span aria-hidden="true">&#128203;</span>';
          }, 2000);
        });
      });

      // Save button
      this.modal.querySelector('#save-settings').addEventListener('click', () => this.save());

      // Export button
      this.modal.querySelector('#export-settings').addEventListener('click', () => this.exportSettings());

      // Import button
      this.modal.querySelector('#import-settings').addEventListener('change', (e) => this.importSettings(e));

      // Reset button
      this.modal.querySelector('#reset-settings').addEventListener('click', () => this.resetSettings());
    }

    /**
     * Switch to a different tab
     * @param {string} tabId - Tab identifier
     */
    switchTab(tabId) {
      // Update tab buttons
      this.modal.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
      });

      // Update tab panels
      this.modal.querySelectorAll('.tab-panel').forEach(panel => {
        const isActive = panel.id === `tab-${tabId}`;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
      });

      this.activeTab = tabId;
    }

    /**
     * Open the modal
     */
    open() {
      this.modal.hidden = false;
      this.modal.classList.add('visible');
      this.isOpen = true;

      // Focus first focusable element
      const firstFocusable = this.modal.querySelector('button, [href], input, select');
      if (firstFocusable) firstFocusable.focus();

      // Trap focus in modal
      this.trapFocus();
    }

    /**
     * Close the modal
     */
    close() {
      this.modal.classList.remove('visible');
      this.isOpen = false;

      setTimeout(() => {
        this.modal.hidden = true;
      }, 200);
    }

    /**
     * Trap focus within the modal
     * @private
     */
    trapFocus() {
      const focusableElements = this.modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      this.modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || !this.isOpen) return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }

    /**
     * Load settings from storage and populate form
     */
    loadSettings() {
      // Load from localStorage
      const stored = localStorage.getItem('myprize-settings');
      if (stored) {
        try {
          currentSettings = this.mergeSettings(defaultSettings, JSON.parse(stored));
        } catch (e) {
          console.error('[SettingsModal] Failed to parse stored settings:', e);
        }
      }

      this.populateForm();
    }

    /**
     * Populate form with current settings
     * @private
     */
    populateForm() {
      // Theme preset
      const themeRadio = this.modal.querySelector(`input[name="theme-preset"][value="${currentSettings.theme.preset}"]`);
      if (themeRadio) themeRadio.checked = true;

      // Colors
      this.modal.querySelector('#primary-color').value = currentSettings.theme.primaryColor;
      this.modal.querySelector('#accent-color').value = currentSettings.theme.accentColor;

      // Selects
      this.modal.querySelector('#border-radius').value = currentSettings.theme.borderRadius;
      this.modal.querySelector('#font-family').value = currentSettings.theme.fontFamily;

      // Toggles
      this.setToggle('#enable-animations', currentSettings.theme.enableAnimations);
      this.setToggle('#enable-glow', currentSettings.theme.enableGlow);
      this.setToggle('#compact-mode', currentSettings.theme.compactMode);
      this.setToggle('#high-contrast', currentSettings.theme.highContrast);

      // Overlay settings
      this.setToggle('#overlay-enabled', currentSettings.overlay.enabled);
      this.modal.querySelector('#overlay-background').value = currentSettings.overlay.background;
      this.modal.querySelector('#chromakey-color').value = currentSettings.overlay.chromakeyColor;
      this.modal.querySelector('#overlay-position').value = currentSettings.overlay.position;
      this.modal.querySelector('#overlay-scale').value = currentSettings.overlay.scale;
      this.modal.querySelector('.range-value').textContent = `${currentSettings.overlay.scale}x`;

      // Widget settings
      this.modal.querySelector('#refresh-interval').value = currentSettings.widgets.refreshInterval;
      this.setToggle('#show-headers', currentSettings.widgets.showHeaders);
      this.setToggle('#animate-changes', currentSettings.widgets.animateChanges);

      // API settings
      this.setToggle('#cache-enabled', currentSettings.api.cacheEnabled);
      this.modal.querySelector('#cache-duration').value = currentSettings.api.cacheDuration;
    }

    /**
     * Set toggle state
     * @param {string} selector - Toggle selector
     * @param {boolean} value - Toggle value
     * @private
     */
    setToggle(selector, value) {
      const toggle = this.modal.querySelector(selector);
      if (toggle) {
        toggle.setAttribute('aria-checked', value);
        toggle.classList.toggle('active', value);
      }
    }

    /**
     * Get toggle state
     * @param {string} selector - Toggle selector
     * @returns {boolean} Toggle value
     * @private
     */
    getToggle(selector) {
      const toggle = this.modal.querySelector(selector);
      return toggle ? toggle.getAttribute('aria-checked') === 'true' : false;
    }

    /**
     * Save settings
     */
    save() {
      // Collect settings from form
      const themePreset = this.modal.querySelector('input[name="theme-preset"]:checked');

      currentSettings = {
        theme: {
          preset: themePreset ? themePreset.value : 'dark',
          primaryColor: this.modal.querySelector('#primary-color').value,
          accentColor: this.modal.querySelector('#accent-color').value,
          borderRadius: this.modal.querySelector('#border-radius').value,
          fontFamily: this.modal.querySelector('#font-family').value,
          enableAnimations: this.getToggle('#enable-animations'),
          enableGlow: this.getToggle('#enable-glow'),
          compactMode: this.getToggle('#compact-mode'),
          highContrast: this.getToggle('#high-contrast'),
        },
        overlay: {
          enabled: this.getToggle('#overlay-enabled'),
          background: this.modal.querySelector('#overlay-background').value,
          chromakeyColor: this.modal.querySelector('#chromakey-color').value,
          position: this.modal.querySelector('#overlay-position').value,
          scale: parseFloat(this.modal.querySelector('#overlay-scale').value),
        },
        widgets: {
          refreshInterval: parseInt(this.modal.querySelector('#refresh-interval').value, 10),
          showHeaders: this.getToggle('#show-headers'),
          animateChanges: this.getToggle('#animate-changes'),
        },
        api: {
          cacheEnabled: this.getToggle('#cache-enabled'),
          cacheDuration: parseInt(this.modal.querySelector('#cache-duration').value, 10),
        },
      };

      // Save to localStorage
      localStorage.setItem('myprize-settings', JSON.stringify(currentSettings));

      // Apply settings
      this.applySettings();

      // Callback
      if (onSaveCallback) {
        onSaveCallback(currentSettings);
      }

      this.close();
    }

    /**
     * Apply settings to the page
     * @private
     */
    applySettings() {
      const root = document.documentElement;

      // Apply theme
      root.setAttribute('data-theme', currentSettings.theme.preset);

      // Apply custom colors
      root.style.setProperty('--color-primary-500', currentSettings.theme.primaryColor);
      root.style.setProperty('--color-accent-500', currentSettings.theme.accentColor);

      // Apply border radius
      const radiusMap = {
        none: '0',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      };
      root.style.setProperty('--radius-lg', radiusMap[currentSettings.theme.borderRadius] || '0.5rem');

      // Apply font family
      const fontMap = {
        sans: 'var(--font-family-sans)',
        mono: 'var(--font-family-mono)',
        display: 'var(--font-family-display)',
      };
      document.body.style.fontFamily = fontMap[currentSettings.theme.fontFamily] || 'var(--font-family-sans)';

      // Apply effects
      document.body.classList.toggle('no-animations', !currentSettings.theme.enableAnimations);
      document.body.classList.toggle('no-glow', !currentSettings.theme.enableGlow);
      document.body.classList.toggle('compact-mode', currentSettings.theme.compactMode);
      document.body.classList.toggle('high-contrast', currentSettings.theme.highContrast);

      // Apply overlay mode
      document.body.classList.toggle('overlay-mode', currentSettings.overlay.enabled);
    }

    /**
     * Export settings to JSON file
     */
    exportSettings() {
      const dataStr = JSON.stringify(currentSettings, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'myprize-toolkit-settings.json';
      link.click();

      URL.revokeObjectURL(url);
    }

    /**
     * Import settings from JSON file
     * @param {Event} e - File input change event
     */
    importSettings(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          currentSettings = this.mergeSettings(defaultSettings, imported);
          this.populateForm();
          this.save();
        } catch (err) {
          console.error('[SettingsModal] Failed to import settings:', err);
          alert('Failed to import settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
      if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
        currentSettings = { ...defaultSettings };
        localStorage.removeItem('myprize-settings');
        this.populateForm();
        this.applySettings();
      }
    }

    /**
     * Get current settings
     * @returns {Object} Current settings
     */
    getSettings() {
      return { ...currentSettings };
    }
  }

  /**
   * Create and return the singleton modal instance
   * @param {Object} options - Configuration options
   * @returns {SettingsModalComponent} Modal instance
   */
  function create(options) {
    if (!modalInstance) {
      modalInstance = new SettingsModalComponent(options);
    }
    return modalInstance;
  }

  /**
   * Open the settings modal
   */
  function open() {
    if (!modalInstance) {
      modalInstance = new SettingsModalComponent();
    }
    modalInstance.open();
  }

  /**
   * Close the settings modal
   */
  function close() {
    if (modalInstance) {
      modalInstance.close();
    }
  }

  /**
   * Get current settings
   * @returns {Object} Current settings
   */
  function getSettings() {
    return { ...currentSettings };
  }

  // Public API
  return {
    create,
    open,
    close,
    getSettings,
    SettingsModalComponent,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsModal;
}
