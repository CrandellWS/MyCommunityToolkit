/**
 * MyPrize Streamer Toolkit - Theme Configuration System
 * Provides runtime theming, persistence, and customization
 */

const ThemeConfig = (() => {
  'use strict';

  // Default theme configuration
  const DEFAULT_CONFIG = {
    theme: 'light', // 'light', 'dark', 'neon', 'sunset', 'forest', 'system'
    primaryColor: '#3b82f6',
    accentColor: '#22c55e',
    borderRadius: 'default', // 'none', 'subtle', 'default', 'rounded', 'pill'
    fontFamily: 'inter', // 'inter', 'system', 'mono'
    animations: true,
    reducedMotion: false,
    glowEffects: true,
    compactMode: false,
    highContrast: false,
  };

  // Storage key
  const STORAGE_KEY = 'myprize_theme_config';

  // Current configuration
  let currentConfig = { ...DEFAULT_CONFIG };

  // Event listeners
  const listeners = new Set();

  /**
   * Initialize the theme system
   */
  function init() {
    // Load saved config
    loadFromStorage();

    // Listen for system preference changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      darkModeQuery.addEventListener('change', (e) => {
        if (currentConfig.theme === 'system') {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });

      reducedMotionQuery.addEventListener('change', (e) => {
        if (e.matches) {
          set('reducedMotion', true);
        }
      });

      // Check initial reduced motion preference
      if (reducedMotionQuery.matches && !currentConfig.reducedMotion) {
        currentConfig.reducedMotion = true;
      }
    }

    // Apply initial config
    apply();

    console.log('[ThemeConfig] Initialized', currentConfig);
  }

  /**
   * Load configuration from localStorage
   */
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        currentConfig = { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('[ThemeConfig] Failed to load from storage:', e);
    }
  }

  /**
   * Save configuration to localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
    } catch (e) {
      console.warn('[ThemeConfig] Failed to save to storage:', e);
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current config
   */
  function get(key) {
    if (key) {
      return currentConfig[key];
    }
    return { ...currentConfig };
  }

  /**
   * Set configuration value(s)
   * @param {string|Object} keyOrConfig - Key name or config object
   * @param {any} value - Value (if key provided)
   */
  function set(keyOrConfig, value) {
    if (typeof keyOrConfig === 'string') {
      currentConfig[keyOrConfig] = value;
    } else if (typeof keyOrConfig === 'object') {
      currentConfig = { ...currentConfig, ...keyOrConfig };
    }

    saveToStorage();
    apply();
    notifyListeners();
  }

  /**
   * Reset to default configuration
   */
  function reset() {
    currentConfig = { ...DEFAULT_CONFIG };
    saveToStorage();
    apply();
    notifyListeners();
  }

  /**
   * Apply current configuration to DOM
   */
  function apply() {
    const root = document.documentElement;

    // Apply theme
    let effectiveTheme = currentConfig.theme;
    if (effectiveTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(effectiveTheme);

    // Apply custom colors
    if (currentConfig.primaryColor) {
      applyColor('primary', currentConfig.primaryColor);
    }
    if (currentConfig.accentColor) {
      applyColor('accent', currentConfig.accentColor);
    }

    // Apply border radius
    applyBorderRadius(currentConfig.borderRadius);

    // Apply font family
    applyFontFamily(currentConfig.fontFamily);

    // Apply animation preferences
    root.classList.toggle('no-animations', !currentConfig.animations || currentConfig.reducedMotion);
    root.classList.toggle('reduced-motion', currentConfig.reducedMotion);
    root.classList.toggle('no-glow', !currentConfig.glowEffects);
    root.classList.toggle('compact', currentConfig.compactMode);
    root.classList.toggle('high-contrast', currentConfig.highContrast);
  }

  /**
   * Apply a theme
   * @param {string} theme - Theme name
   */
  function applyTheme(theme) {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('dark', 'light');
    root.removeAttribute('data-theme');

    // Apply new theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (['neon', 'sunset', 'forest'].includes(theme)) {
      root.setAttribute('data-theme', theme);
    }
  }

  /**
   * Apply a custom color
   * @param {string} type - 'primary' or 'accent'
   * @param {string} hex - Hex color value
   */
  function applyColor(type, hex) {
    const root = document.documentElement;

    // Convert hex to RGB
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    // Generate color scale
    const scale = generateColorScale(rgb);

    // Apply to CSS custom properties
    Object.entries(scale).forEach(([shade, color]) => {
      root.style.setProperty(`--color-${type}-${shade}`, color);
    });

    // Apply glow color
    const glowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
    root.style.setProperty(`--color-glow-${type}`, glowColor);
  }

  /**
   * Convert hex to RGB
   * @param {string} hex - Hex color
   * @returns {Object} RGB values
   */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Generate a color scale from a base RGB
   * @param {Object} rgb - Base RGB values
   * @returns {Object} Color scale
   */
  function generateColorScale(rgb) {
    const { r, g, b } = rgb;

    // Simplified scale generation
    return {
      50: `rgb(${lerp(r, 255, 0.95)}, ${lerp(g, 255, 0.95)}, ${lerp(b, 255, 0.95)})`,
      100: `rgb(${lerp(r, 255, 0.9)}, ${lerp(g, 255, 0.9)}, ${lerp(b, 255, 0.9)})`,
      200: `rgb(${lerp(r, 255, 0.75)}, ${lerp(g, 255, 0.75)}, ${lerp(b, 255, 0.75)})`,
      300: `rgb(${lerp(r, 255, 0.5)}, ${lerp(g, 255, 0.5)}, ${lerp(b, 255, 0.5)})`,
      400: `rgb(${lerp(r, 255, 0.25)}, ${lerp(g, 255, 0.25)}, ${lerp(b, 255, 0.25)})`,
      500: `rgb(${r}, ${g}, ${b})`,
      600: `rgb(${lerp(r, 0, 0.1)}, ${lerp(g, 0, 0.1)}, ${lerp(b, 0, 0.1)})`,
      700: `rgb(${lerp(r, 0, 0.25)}, ${lerp(g, 0, 0.25)}, ${lerp(b, 0, 0.25)})`,
      800: `rgb(${lerp(r, 0, 0.4)}, ${lerp(g, 0, 0.4)}, ${lerp(b, 0, 0.4)})`,
      900: `rgb(${lerp(r, 0, 0.55)}, ${lerp(g, 0, 0.55)}, ${lerp(b, 0, 0.55)})`,
    };
  }

  /**
   * Linear interpolation
   */
  function lerp(start, end, t) {
    return Math.round(start + (end - start) * t);
  }

  /**
   * Apply border radius preset
   * @param {string} preset - Preset name
   */
  function applyBorderRadius(preset) {
    const root = document.documentElement;
    const presets = {
      none: { sm: '0', md: '0', lg: '0', xl: '0', '2xl': '0' },
      subtle: { sm: '2px', md: '4px', lg: '6px', xl: '8px', '2xl': '12px' },
      default: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem' },
      rounded: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', '2xl': '2rem' },
      pill: { sm: '9999px', md: '9999px', lg: '9999px', xl: '9999px', '2xl': '9999px' },
    };

    const values = presets[preset] || presets.default;
    Object.entries(values).forEach(([size, value]) => {
      root.style.setProperty(`--radius-${size}`, value);
    });
  }

  /**
   * Apply font family preset
   * @param {string} preset - Preset name
   */
  function applyFontFamily(preset) {
    const root = document.documentElement;
    const presets = {
      inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    };

    const fontFamily = presets[preset] || presets.inter;
    root.style.setProperty('--font-family-sans', fontFamily);
  }

  /**
   * Subscribe to config changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  /**
   * Notify all listeners of config change
   */
  function notifyListeners() {
    listeners.forEach(callback => {
      try {
        callback(currentConfig);
      } catch (e) {
        console.error('[ThemeConfig] Listener error:', e);
      }
    });
  }

  /**
   * Get available themes
   * @returns {Array} Theme options
   */
  function getThemes() {
    return [
      { id: 'light', name: 'Light', icon: '☀️' },
      { id: 'dark', name: 'Dark', icon: '🌙' },
      { id: 'system', name: 'System', icon: '💻' },
      { id: 'neon', name: 'Neon', icon: '🔮' },
      { id: 'sunset', name: 'Sunset', icon: '🌅' },
      { id: 'forest', name: 'Forest', icon: '🌲' },
    ];
  }

  /**
   * Export config as JSON string
   * @returns {string} JSON config
   */
  function exportConfig() {
    return JSON.stringify(currentConfig, null, 2);
  }

  /**
   * Import config from JSON string
   * @param {string} json - JSON config string
   */
  function importConfig(json) {
    try {
      const parsed = JSON.parse(json);
      set(parsed);
    } catch (e) {
      console.error('[ThemeConfig] Failed to import config:', e);
      throw new Error('Invalid configuration format');
    }
  }

  // Public API
  return {
    init,
    get,
    set,
    reset,
    apply,
    subscribe,
    getThemes,
    exportConfig,
    importConfig,
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeConfig.init());
} else {
  ThemeConfig.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeConfig;
}
