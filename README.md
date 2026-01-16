# MyPrize Streamer Toolkit

A beautiful, modern widget library for streamers to display real-time statistics, achievements, and activity from the MyPrize platform.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

---

## Table of Contents

1. [Overview & Features](#1-overview--features)
2. [Quick Start](#2-quick-start)
3. [Installation Methods](#3-installation-methods)
4. [Configuration Options](#4-configuration-options)
5. [Widget Reference](#5-widget-reference)
6. [Theming Guide](#6-theming-guide)
7. [OBS Integration](#7-obs-integration)
8. [API Reference](#8-api-reference)
9. [Examples](#9-examples)
10. [Contributing](#10-contributing)

---

## 1. Overview & Features

The MyPrize Streamer Toolkit is a **zero-dependency**, vanilla JavaScript widget library designed specifically for streamers. It provides real-time widgets that display statistics, big wins, leaderboards, and more from the MyPrize API.

### Features

- **Configurable Theming** - 5 built-in themes (Light, Dark, Neon, Sunset, Forest) + custom colors
- **Micro-interactions** - Smooth 60fps animations and delightful feedback
- **Live Widgets** - Real-time stats, big wins, leaderboards, game carousels, user profiles
- **OBS Ready** - Optimized overlays with transparent backgrounds and chromakey support
- **Accessible** - Full ARIA labels, keyboard navigation, reduced motion support
- **Responsive** - Mobile-first design that works on all screen sizes
- **No Build Required** - Just open HTML in browser, no npm/webpack needed
- **Lightweight** - Under 50KB core bundle size

### Widget Types

| Widget | Description |
|--------|-------------|
| StatCard | Single statistic with trend indicator |
| BigWins | Real-time big wins feed with animations |
| Leaderboard | Ranked player list with podium styling |
| GameCarousel | Horizontal scrolling game showcase |
| UserProfile | Public profile card with stats and badges |
| MomentumMeter | Visual room activity indicator |
| MissionsList | Active missions with progress bars |
| RateLimitMonitor | API usage tracking |

---

## 2. Quick Start

Get up and running in 3 simple steps:

### Step 1: Include the Files

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <!-- Styles (required) -->
  <link rel="stylesheet" href="src/styles/design-system.css">
  <link rel="stylesheet" href="src/styles/animations.css">
  <link rel="stylesheet" href="src/styles/components.css">
</head>
<body>
  <!-- Your widget container -->
  <div id="my-widget"></div>

  <!-- Scripts (required) -->
  <script src="src/utils/api-client.js"></script>
  <script src="src/components/widgets.js"></script>

  <!-- Optional: Additional widgets -->
  <script src="src/components/leaderboard.js"></script>
  <script src="src/components/game-carousel.js"></script>
  <script src="src/components/user-profile.js"></script>
</body>
</html>
```

### Step 2: Add a Container

```html
<div id="big-wins"></div>
```

### Step 3: Initialize the Widget

```html
<script>
  Widgets.create('big-wins', '#big-wins', {
    roomId: 'your-room-id',
    limit: 5,
    refreshInterval: 30000
  });
</script>
```

That's it! Open your HTML file in a browser and the widget will render.

---

## 3. Installation Methods

### Method A: Direct Download (Recommended)

1. Download or clone this repository
2. Copy the `src/` folder to your project
3. Include the files as shown in Quick Start

### Method B: CDN (Coming Soon)

```html
<!-- Not yet available -->
<link rel="stylesheet" href="https://cdn.example.com/myprize-toolkit/1.0.0/styles.min.css">
<script src="https://cdn.example.com/myprize-toolkit/1.0.0/toolkit.min.js"></script>
```

### Method C: npm (Coming Soon)

```bash
npm install myprize-streamer-toolkit
```

---

## 4. Configuration Options

### Global Configuration

```javascript
// Initialize theme on page load
ThemeConfig.init();

// Set individual options
ThemeConfig.set('theme', 'dark');
ThemeConfig.set('primaryColor', '#8b5cf6');

// Set multiple options at once
ThemeConfig.set({
  theme: 'neon',
  primaryColor: '#00ffff',
  accentColor: '#ff00ff',
  animations: true,
  glowEffects: true
});
```

### Theme Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | string | `'light'` | Preset theme: light, dark, neon, sunset, forest |
| `primaryColor` | string | `'#3b82f6'` | Primary brand color (hex) |
| `accentColor` | string | `'#22c55e'` | Secondary accent color (hex) |
| `borderRadius` | string | `'lg'` | Border radius: none, sm, md, lg, xl, full |
| `fontFamily` | string | `'sans'` | Font: sans, mono, display |
| `animations` | boolean | `true` | Enable/disable animations |
| `glowEffects` | boolean | `true` | Enable/disable glow effects |
| `compactMode` | boolean | `false` | Reduce spacing for compact layouts |
| `reducedMotion` | boolean | `false` | Respect prefers-reduced-motion |

### Widget Common Options

All widgets support these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `refreshInterval` | number | `60000` | Auto-refresh interval in ms (0 = disabled) |
| `animate` | boolean | `true` | Enable widget animations |
| `showHeader` | boolean | `true` | Show widget header/title |
| `theme` | string | `'auto'` | Widget-specific theme override |

---

## 5. Widget Reference

### StatCard

Display a single statistic with trend indicator.

```javascript
Widgets.create('stat', '#container', {
  title: 'Active Viewers',
  icon: '&#128065;',       // HTML entity or emoji
  value: 1247,
  previousValue: 1180,    // For trend calculation
  prefix: '',             // e.g., '$'
  suffix: '',             // e.g., '%'
  color: 'primary',       // primary, accent, success, warning, error
  fetchFn: async () => {  // Optional: fetch data dynamically
    const data = await MyPrizeAPI.users.getStats();
    return data.activeUserCount;
  }
});
```

### BigWins

Real-time big wins feed with animations.

```javascript
Widgets.create('big-wins', '#container', {
  title: 'Big Wins',
  limit: 5,               // Number of wins to show
  roomId: null,           // Filter by room (optional)
  minMultiplier: 10,      // Minimum multiplier to show
  showGame: true,         // Show game name
  showUser: true,         // Show username
  refreshInterval: 30000
});
```

### Leaderboard

Ranked player list with podium styling for top 3.

```javascript
Leaderboard.create('#container', {
  title: 'Top Players',
  limit: 10,
  roomId: null,           // Filter by room (optional)
  missionId: null,        // Get leaderboard for specific mission
  showAvatars: true,
  showPodium: true,       // Special styling for top 3
  animateChanges: true,   // Animate rank changes
  highlightUser: null     // Username to highlight
});
```

### GameCarousel

Horizontal scrolling game showcase with touch support.

```javascript
GameCarousel.create('#container', {
  title: 'Popular Games',
  limit: 20,
  roomId: null,           // Get room's recent games
  provider: null,         // Filter by provider
  showArrows: true,       // Navigation arrows
  showDots: false,        // Pagination dots
  autoScroll: false,      // Auto-scroll carousel
  autoScrollInterval: 5000,
  cardWidth: 180,
  gap: 16,
  showProvider: true,
  showMultiplier: true
});
```

### UserProfile

Public profile card with stats and achievement badges.

```javascript
UserProfile.create('#container', {
  userId: null,           // User ID (or use username)
  username: 'StreamerPro', // Username (alternative)
  showAvatar: true,
  showStats: true,
  showBadges: true,
  showJoinDate: true,
  animateStats: true,     // Animated stat counters
  compact: false          // Compact layout mode
});
```

### MomentumMeter

Visual indicator of room activity level (0-100 scale).

```javascript
Widgets.create('momentum', '#container', {
  roomId: 'room-123',     // Required for real data
  showLabels: true,       // Cold/Neutral/Hot labels
  showValue: true         // Numeric value display
});
```

### MissionsList

Active missions with progress bars.

```javascript
Widgets.create('missions', '#container', {
  title: 'Active Missions',
  roomId: null,           // Filter by room
  limit: 5,
  showProgress: true      // Show progress bars
});
```

### RateLimitMonitor

API usage tracking display.

```javascript
Widgets.create('rate-limit', '#container', {
  showWarningAt: 70,      // Yellow threshold (%)
  showDangerAt: 90        // Red threshold (%)
});
```

---

## 6. Theming Guide

### Using Built-in Themes

Set the theme via HTML attribute or JavaScript:

```html
<html data-theme="dark">
```

```javascript
ThemeConfig.set('theme', 'neon');
```

### Available Themes

| Theme | Description |
|-------|-------------|
| `light` | Clean, bright theme with blue accents |
| `dark` | Dark background with subtle shadows |
| `neon` | Cyberpunk-style with cyan/magenta glows |
| `sunset` | Warm orange and pink gradients |
| `forest` | Nature-inspired greens |

### Custom Colors

Override any color via CSS custom properties:

```css
:root {
  --color-primary-500: #8b5cf6;
  --color-accent-500: #f59e0b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

Or via JavaScript:

```javascript
ThemeConfig.set('primaryColor', '#8b5cf6');
ThemeConfig.set('accentColor', '#f59e0b');
```

### CSS Custom Properties Reference

See `src/styles/design-system.css` for the complete list. Key properties:

```css
/* Colors */
--color-primary-500: #3b82f6;
--color-accent-500: #22c55e;
--color-neutral-900: #0f172a;

/* Typography */
--font-size-base: 1rem;
--font-weight-bold: 700;

/* Spacing */
--space-4: 1rem;
--space-8: 2rem;

/* Border Radius */
--radius-lg: 0.5rem;
--radius-full: 9999px;

/* Shadows */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

/* Animation */
--duration-normal: 200ms;
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

---

## 7. OBS Integration

### Overlay Pages

Use dedicated overlay pages optimized for OBS browser sources:

| Page | Description |
|------|-------------|
| `demos/overlay-big-wins.html` | Big wins feed overlay |
| `demos/overlay-leaderboard.html` | Leaderboard overlay |
| `demos/overlay-momentum.html` | Momentum meter overlay |
| `demos/overlay-stats.html` | Stats row overlay |
| `demos/streamer-overlay.html` | Combined multi-widget overlay |

### URL Parameters

Configure overlays via URL parameters:

```
demos/overlay-big-wins.html?room=your-room-id&limit=5&position=bottom-right&theme=dark-glass&scale=1.25
```

| Parameter | Values | Description |
|-----------|--------|-------------|
| `room` | Room ID | Filter data to your room |
| `limit` | 1-20 | Number of items to show |
| `position` | top-left, top-center, top-right, bottom-left, bottom-center, bottom-right, center | Widget position |
| `theme` | dark-glass, neon | Overlay theme |
| `scale` | 0.5-2 | Scale factor |
| `chromakey` | green, blue, magenta, transparent | Background for chroma keying |
| `refresh` | milliseconds | Refresh interval |
| `demo` | true/false | Enable demo mode with fake data |

### OBS Setup

1. Add a Browser Source in OBS
2. Set URL to your overlay page (e.g., `file:///path/to/demos/overlay-big-wins.html`)
3. Set width/height to match your desired size
4. Enable "Shutdown source when not visible" for performance
5. Check "Refresh browser when scene becomes active"

### Transparent Background

All overlay pages have transparent backgrounds by default. For chromakey:

```
?chromakey=green
```

---

## 8. API Reference

### MyPrizeAPI Client

The toolkit includes a robust API client with caching and rate limiting.

#### Endpoints

```javascript
// Rooms
MyPrizeAPI.rooms.list(params)
MyPrizeAPI.rooms.get(id)
MyPrizeAPI.rooms.getBySlug(slug)
MyPrizeAPI.rooms.getRecentGames(roomId, params)

// Users
MyPrizeAPI.users.get(id)
MyPrizeAPI.users.getStats(params)

// Games
MyPrizeAPI.igames.list(params)
MyPrizeAPI.igames.get(id)
MyPrizeAPI.igames.getByProvider(provider, params)

// Missions
MyPrizeAPI.missions.list(params)
MyPrizeAPI.missions.get(id)
MyPrizeAPI.missions.getByRoom(roomId, params)
MyPrizeAPI.missions.getLeaderboard(missionId)

// Bets
MyPrizeAPI.bets.getBig(params)
MyPrizeAPI.bets.getLucky(params)
MyPrizeAPI.bets.getRecent(params)
MyPrizeAPI.bets.getWins(params)

// Content
MyPrizeAPI.content.getBanners(params)
MyPrizeAPI.content.getLivestreams(params)

// System
MyPrizeAPI.system.health()
MyPrizeAPI.system.getFeatures()
```

#### Query Parameters

All list endpoints support:

| Parameter | Description |
|-----------|-------------|
| `page` | Page number (1-100) |
| `page_size` | Items per page (1-100) |
| `sort_field` | Field to sort by |
| `sort_dir` | Sort direction: asc/desc |
| `search_field` | Field to search |
| `search_value` | Search query |
| `equals_field` | Field for exact match |
| `equals_value` | Value for exact match |

#### Rate Limiting

```javascript
// Get current status
const status = MyPrizeAPI.getRateLimitStatus();
console.log(`${status.used}/${status.limit} (${status.percentage}%)`);
console.log(`Resets in ${status.resetsIn / 1000} seconds`);

// Listen for rate limit events
MyPrizeAPI.on('rateLimit', (data) => {
  if (data.remaining < 100) {
    console.warn('Running low on API requests!');
  }
});
```

#### Error Handling

```javascript
try {
  const data = await MyPrizeAPI.rooms.get('invalid-id');
} catch (error) {
  console.error(error.code);    // e.g., 'HTTP_404'
  console.error(error.message); // Error description
  console.error(error.status);  // HTTP status code
}

// Listen for all errors
MyPrizeAPI.on('error', (data) => {
  console.error('API Error:', data.error);
});
```

---

## 9. Examples

### Basic Dashboard

See `demos/basic-dashboard.html` for a complete example:

```javascript
// Initialize multiple widgets
Widgets.create('stat', '#stat-viewers', {
  title: 'Active Viewers',
  icon: '&#128065;',
  color: 'primary',
  fetchFn: async () => {
    const data = await MyPrizeAPI.users.getStats();
    return data.activeUserCount;
  }
});

Widgets.create('big-wins', '#big-wins', {
  title: 'Big Wins',
  limit: 5,
  refreshInterval: 30000
});

Leaderboard.create('#leaderboard', {
  title: 'Top Players',
  limit: 10,
  showPodium: true
});

GameCarousel.create('#games', {
  title: 'Popular Games',
  limit: 15
});
```

### Custom Theme Demo

See `demos/custom-theme.html` for a live theme customizer.

### Minimal Integration

See `demos/minimal-widget.html` for the simplest possible integration.

### Full Streamer Overlay

See `demos/streamer-overlay.html` for a complete OBS-ready overlay with multiple widgets.

---

## 10. Contributing

### Development Setup

1. Clone the repository
2. Open `index.html` in a browser
3. Make changes to files in `src/`
4. Refresh browser to see changes

### Code Standards

- **JavaScript**: ES6+, const over let, async/await, JSDoc comments
- **CSS**: BEM-like naming, CSS custom properties, mobile-first
- **HTML**: Semantic elements, ARIA attributes, no inline styles

### Testing

- Test in Chrome, Firefox, Safari, Edge
- Test at 375px, 768px, 1024px viewport widths
- Test with keyboard navigation
- Test with screen reader
- Test with `prefers-reduced-motion`

### Pull Request Guidelines

1. Create a feature branch
2. Follow existing code style
3. Add JSDoc comments for new functions
4. Test across browsers
5. Update README if needed
6. Submit PR with clear description

---

## License

MIT License - feel free to use in your projects!

## Credits

Built for the MyPrize streamer community.

---

**Happy Streaming!**
