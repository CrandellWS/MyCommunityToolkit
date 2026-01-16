/**
 * MyPrize Streamer Toolkit - Toast Notification System
 * Beautiful, animated toast notifications with micro-interactions
 */

const Toast = (() => {
  'use strict';

  // Configuration
  const config = {
    position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
    maxToasts: 5,
    defaultDuration: 5000,
    animationDuration: 300,
    pauseOnHover: true,
    showProgress: true,
    closeOnClick: true,
    newestOnTop: true,
  };

  // Container element
  let container = null;

  // Active toasts
  const activeToasts = new Map();

  // Toast counter for unique IDs
  let toastCounter = 0;

  // Icons for toast types
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>`,
    achievement: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z"/>
    </svg>`,
  };

  /**
   * Initialize the toast system
   */
  function init() {
    if (container) return;

    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    updateContainerPosition();
    document.body.appendChild(container);

    // Add styles if not already present
    if (!document.getElementById('toast-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'toast-styles';
      styleEl.textContent = getToastStyles();
      document.head.appendChild(styleEl);
    }
  }

  /**
   * Update container position based on config
   */
  function updateContainerPosition() {
    if (!container) return;

    const positions = {
      'top-right': { top: 'var(--space-4)', right: 'var(--space-4)', bottom: 'auto', left: 'auto' },
      'top-left': { top: 'var(--space-4)', left: 'var(--space-4)', bottom: 'auto', right: 'auto' },
      'bottom-right': { bottom: 'var(--space-4)', right: 'var(--space-4)', top: 'auto', left: 'auto' },
      'bottom-left': { bottom: 'var(--space-4)', left: 'var(--space-4)', top: 'auto', right: 'auto' },
      'top-center': { top: 'var(--space-4)', left: '50%', transform: 'translateX(-50%)', bottom: 'auto', right: 'auto' },
      'bottom-center': { bottom: 'var(--space-4)', left: '50%', transform: 'translateX(-50%)', top: 'auto', right: 'auto' },
    };

    const pos = positions[config.position] || positions['top-right'];
    Object.assign(container.style, pos);
  }

  /**
   * Create and show a toast
   * @param {Object} options - Toast options
   * @returns {string} Toast ID
   */
  function show(options) {
    init();

    const id = `toast-${++toastCounter}`;
    const {
      type = 'info',
      title = '',
      message = '',
      duration = config.defaultDuration,
      icon = null,
      onClick = null,
      onClose = null,
      showClose = true,
      className = '',
      data = {},
    } = typeof options === 'string' ? { message: options } : options;

    // Enforce max toasts
    while (activeToasts.size >= config.maxToasts) {
      const oldestId = activeToasts.keys().next().value;
      dismiss(oldestId);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type} ${className}`.trim();
    toast.setAttribute('role', 'alert');

    // Build toast HTML
    toast.innerHTML = `
      <div class="toast-icon">
        ${icon || icons[type] || icons.info}
      </div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      ${showClose ? `
        <button class="toast-close" aria-label="Close notification">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      ` : ''}
      ${config.showProgress && duration > 0 ? `
        <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
      ` : ''}
    `;

    // Store toast data
    const toastData = {
      id,
      element: toast,
      type,
      duration,
      onClick,
      onClose,
      data,
      timer: null,
      remainingTime: duration,
      startTime: null,
    };
    activeToasts.set(id, toastData);

    // Add event listeners
    if (showClose) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss(id);
      });
    }

    if (config.closeOnClick && onClick === null) {
      toast.addEventListener('click', () => dismiss(id));
      toast.style.cursor = 'pointer';
    } else if (onClick) {
      toast.addEventListener('click', () => onClick(toastData));
      toast.style.cursor = 'pointer';
    }

    if (config.pauseOnHover && duration > 0) {
      toast.addEventListener('mouseenter', () => pauseTimer(id));
      toast.addEventListener('mouseleave', () => resumeTimer(id));
    }

    // Add to container
    if (config.newestOnTop) {
      container.insertBefore(toast, container.firstChild);
    } else {
      container.appendChild(toast);
    }

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-enter');
    });

    // Start auto-dismiss timer
    if (duration > 0) {
      startTimer(id);
    }

    return id;
  }

  /**
   * Start the dismiss timer for a toast
   * @param {string} id - Toast ID
   */
  function startTimer(id) {
    const toastData = activeToasts.get(id);
    if (!toastData) return;

    toastData.startTime = Date.now();
    toastData.timer = setTimeout(() => dismiss(id), toastData.remainingTime);
  }

  /**
   * Pause the dismiss timer
   * @param {string} id - Toast ID
   */
  function pauseTimer(id) {
    const toastData = activeToasts.get(id);
    if (!toastData || !toastData.timer) return;

    clearTimeout(toastData.timer);
    toastData.remainingTime -= Date.now() - toastData.startTime;

    // Pause progress animation
    const progress = toastData.element.querySelector('.toast-progress');
    if (progress) {
      const computed = getComputedStyle(progress);
      progress.style.animationPlayState = 'paused';
    }
  }

  /**
   * Resume the dismiss timer
   * @param {string} id - Toast ID
   */
  function resumeTimer(id) {
    const toastData = activeToasts.get(id);
    if (!toastData || toastData.remainingTime <= 0) return;

    // Resume progress animation
    const progress = toastData.element.querySelector('.toast-progress');
    if (progress) {
      progress.style.animationPlayState = 'running';
    }

    startTimer(id);
  }

  /**
   * Dismiss a toast
   * @param {string} id - Toast ID
   */
  function dismiss(id) {
    const toastData = activeToasts.get(id);
    if (!toastData) return;

    // Clear timer
    if (toastData.timer) {
      clearTimeout(toastData.timer);
    }

    // Trigger exit animation
    const toast = toastData.element;
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');

    // Call onClose callback
    if (toastData.onClose) {
      toastData.onClose(toastData);
    }

    // Remove after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      activeToasts.delete(id);
    }, config.animationDuration);
  }

  /**
   * Dismiss all toasts
   */
  function dismissAll() {
    activeToasts.forEach((_, id) => dismiss(id));
  }

  /**
   * Update a toast
   * @param {string} id - Toast ID
   * @param {Object} options - New options
   */
  function update(id, options) {
    const toastData = activeToasts.get(id);
    if (!toastData) return;

    const { title, message, type } = options;

    if (title !== undefined) {
      const titleEl = toastData.element.querySelector('.toast-title');
      if (titleEl) {
        titleEl.textContent = title;
      }
    }

    if (message !== undefined) {
      const messageEl = toastData.element.querySelector('.toast-message');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }

    if (type !== undefined) {
      toastData.element.className = `toast toast-${type} toast-enter`;
      const iconEl = toastData.element.querySelector('.toast-icon');
      if (iconEl) {
        iconEl.innerHTML = icons[type] || icons.info;
      }
    }
  }

  // Convenience methods
  function success(message, options = {}) {
    return show({ ...options, message, type: 'success', title: options.title || 'Success' });
  }

  function error(message, options = {}) {
    return show({ ...options, message, type: 'error', title: options.title || 'Error' });
  }

  function warning(message, options = {}) {
    return show({ ...options, message, type: 'warning', title: options.title || 'Warning' });
  }

  function info(message, options = {}) {
    return show({ ...options, message, type: 'info', title: options.title || 'Info' });
  }

  function achievement(title, message, options = {}) {
    return show({
      ...options,
      title,
      message,
      type: 'achievement',
      duration: options.duration || 7000,
      className: 'toast-achievement',
    });
  }

  /**
   * Promise-based toast for async operations
   * @param {Promise} promise - Promise to track
   * @param {Object} messages - Messages for loading, success, error states
   * @returns {Promise} The original promise
   */
  async function promise(promiseToTrack, messages = {}) {
    const {
      loading = 'Loading...',
      success: successMsg = 'Success!',
      error: errorMsg = 'Something went wrong',
    } = messages;

    const id = show({
      message: loading,
      type: 'info',
      duration: 0,
      showClose: false,
    });

    try {
      const result = await promiseToTrack;
      update(id, {
        message: typeof successMsg === 'function' ? successMsg(result) : successMsg,
        type: 'success',
      });

      // Start dismiss timer
      const toastData = activeToasts.get(id);
      if (toastData) {
        toastData.remainingTime = config.defaultDuration;
        startTimer(id);
      }

      return result;
    } catch (err) {
      update(id, {
        message: typeof errorMsg === 'function' ? errorMsg(err) : errorMsg,
        type: 'error',
      });

      // Start dismiss timer
      const toastData = activeToasts.get(id);
      if (toastData) {
        toastData.remainingTime = config.defaultDuration;
        startTimer(id);
      }

      throw err;
    }
  }

  /**
   * Configure toast system
   * @param {Object} options - Configuration options
   */
  function configure(options) {
    Object.assign(config, options);
    updateContainerPosition();
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Get toast component styles
   * @returns {string} CSS styles
   */
  function getToastStyles() {
    return `
      .toast-container {
        position: fixed;
        z-index: var(--z-toast, 600);
        display: flex;
        flex-direction: column;
        gap: var(--space-3, 0.75rem);
        pointer-events: none;
        max-width: 400px;
        width: calc(100vw - 2rem);
      }

      .toast {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3, 0.75rem);
        padding: var(--space-4, 1rem);
        background: var(--color-neutral-0, #fff);
        border-radius: var(--radius-lg, 0.5rem);
        box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1));
        pointer-events: auto;
        position: relative;
        overflow: hidden;
        opacity: 0;
        transform: translateX(100%);
        transition: opacity var(--duration-normal, 200ms) var(--ease-out, ease-out),
                    transform var(--duration-normal, 200ms) var(--ease-spring, cubic-bezier(0.175, 0.885, 0.32, 1.275));
      }

      .toast-enter {
        opacity: 1;
        transform: translateX(0);
      }

      .toast-exit {
        opacity: 0;
        transform: translateX(100%);
      }

      .toast-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        padding: 2px;
      }

      .toast-success .toast-icon { background: var(--color-success-bg, #dcfce7); color: var(--color-success, #22c55e); }
      .toast-error .toast-icon { background: var(--color-error-bg, #fee2e2); color: var(--color-error, #ef4444); }
      .toast-warning .toast-icon { background: var(--color-warning-bg, #fef3c7); color: var(--color-warning, #f59e0b); }
      .toast-info .toast-icon { background: var(--color-info-bg, #dbeafe); color: var(--color-info, #3b82f6); }

      .toast-content {
        flex: 1;
        min-width: 0;
      }

      .toast-title {
        font-weight: var(--font-weight-semibold, 600);
        color: var(--color-neutral-900, #0f172a);
        margin-bottom: var(--space-0-5, 0.125rem);
      }

      .toast-message {
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--color-neutral-600, #475569);
        word-wrap: break-word;
      }

      .toast-close {
        flex-shrink: 0;
        padding: var(--space-1, 0.25rem);
        background: transparent;
        border: none;
        color: var(--color-neutral-400, #94a3b8);
        cursor: pointer;
        border-radius: var(--radius-md, 0.375rem);
        transition: all var(--duration-fast, 100ms);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-close:hover {
        background: var(--color-neutral-100, #f1f5f9);
        color: var(--color-neutral-600, #475569);
      }

      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: currentColor;
        opacity: 0.3;
        transform-origin: left;
        animation: toastProgress linear forwards;
      }

      @keyframes toastProgress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }

      /* Achievement Toast */
      .toast-achievement {
        background: linear-gradient(135deg, var(--color-neutral-900, #0f172a), var(--color-neutral-800, #1e293b));
        border: 1px solid rgba(255, 215, 0, 0.3);
      }

      .toast-achievement .toast-icon {
        background: rgba(255, 215, 0, 0.2);
        color: #ffd700;
      }

      .toast-achievement .toast-title {
        color: #ffd700;
      }

      .toast-achievement .toast-message {
        color: var(--color-neutral-300, #cbd5e1);
      }

      .toast-achievement .toast-close {
        color: var(--color-neutral-400, #94a3b8);
      }

      .toast-achievement .toast-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--color-neutral-200, #e2e8f0);
      }

      /* Dark mode */
      .dark .toast {
        background: var(--color-neutral-800, #1e293b);
      }

      .dark .toast-title {
        color: var(--color-neutral-100, #f1f5f9);
      }

      .dark .toast-message {
        color: var(--color-neutral-400, #94a3b8);
      }
    `;
  }

  // Public API
  return {
    show,
    dismiss,
    dismissAll,
    update,
    success,
    error,
    warning,
    info,
    achievement,
    promise,
    configure,
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Toast;
}
