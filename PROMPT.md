# MyPrize Streamer Toolkit - Ralph Loop Development Prompt

## Ralph Loop Usage

Run from the streamer-toolkit directory:
```bash
# Basic run (will verify API first)
ralph-loop -p PROMPT.md

# Skip API verification
ralph-loop -p PROMPT.md --skip-api-check

# With specific iterations and timeout
ralph-loop -i 5 -t 20 -p PROMPT.md

# With permission bypass (for sandboxed environments)
ralph-loop -p PROMPT.md --permission-mode bypassPermissions

# Dry run (see what would happen)
ralph-loop -p PROMPT.md --dry-run
```

The loop will:
1. Verify API connectivity (unless skipped)
2. Run Claude with this prompt
3. Check for TASK_COMPLETE marker
4. Repeat until complete or max iterations reached

---

## Mission

Continue developing the MyPrize Streamer Toolkit into a production-ready, feature-complete widget library for streamers. The foundation has been built - now refine, enhance, and polish every aspect until it's truly epic.

---

## Current State

### Completed ✅
1. **Ralph Loop Script** - `/home/aiuser/.local/bin/ralph-loop` (executable)
2. **Design System** - `src/styles/design-system.css` (CSS custom properties, theming engine)
3. **Animations** - `src/styles/animations.css` (micro-interactions, keyframes)
4. **Components CSS** - `src/styles/components.css` (buttons, cards, toasts, etc.)
5. **Theme Config** - `src/config/theme-config.js` (runtime theming, persistence)
6. **Toast System** - `src/components/toast.js` (notifications with animations)
7. **API Client** - `src/utils/api-client.js` (MyPrize API with caching, rate limiting)
8. **Widgets** - `src/components/widgets.js` (StatCard, BigWins, MomentumMeter, etc.)
9. **Demo Page** - `index.html` (interactive showcase)

### Needs Work 🔧
- More widget types (leaderboards, game recommendations, user profiles)
- Mobile responsiveness improvements
- Accessibility enhancements (ARIA, keyboard navigation)
- OBS/Streaming overlay optimizations
- Embeddable widget generator
- Configuration UI panel
- Export/import themes
- Documentation and usage examples
- Unit tests
- Performance optimization
- Bundle/build system

---

## Phase 1: Widget Enhancement (Priority)

### Task 1.1: Leaderboard Widget
Create a new leaderboard widget that displays mission rankings.

**File:** `src/components/leaderboard.js`

**Requirements:**
- Display top N users with rank, username, avatar, score
- Animated rank changes (slide up/down)
- Highlight current user if provided
- Podium mode for top 3 (special styling)
- Configurable: limit, roomId, missionId, showAvatars, animateChanges

**Visual Design:**
```
┌─────────────────────────────────┐
│  🏆 Leaderboard                 │
├─────────────────────────────────┤
│  🥇 1. PlayerOne      12,450 pts│
│  🥈 2. StreamKing     11,890 pts│
│  🥉 3. LuckyDraw       9,340 pts│
│  4. CoolPlayer        8,120 pts │
│  5. WinStreak         7,650 pts │
└─────────────────────────────────┘
```

### Task 1.2: Game Carousel Widget
Create a horizontal scrolling game carousel showing recent/popular games.

**File:** `src/components/game-carousel.js`

**Requirements:**
- Smooth horizontal scroll with momentum
- Game cards with image, name, provider, popularity
- Hover effects showing multiplier range
- Touch/swipe support
- Arrow navigation buttons
- Auto-scroll option

### Task 1.3: User Profile Card Widget
Display a user's public profile with stats.

**File:** `src/components/user-profile.js`

**Requirements:**
- Avatar, username, join date
- Key stats: total bets, wins, favorite games
- Achievement badges
- Animated stat counters
- Skeleton loading state

---

## Phase 2: OBS Overlay Mode

### Task 2.1: Overlay Styles
Create specialized styles for OBS browser sources.

**File:** `src/styles/overlay.css`

**Requirements:**
- Transparent backgrounds
- Chromakey-friendly colors (pure green/blue options)
- Larger text for stream visibility
- High contrast modes
- Reduced animation options (performance)
- Fixed positioning for specific overlay regions

### Task 2.2: Overlay Configuration
Add overlay-specific config options.

**Additions to theme-config.js:**
```javascript
overlay: {
  mode: false,           // Enable overlay mode
  background: 'transparent', // transparent, chromakey, solid
  chromakeyColor: '#00ff00',
  position: 'bottom-right',
  scale: 1.5,
  textShadow: true,
}
```

### Task 2.3: Single Widget Pages
Create standalone HTML pages for each widget type optimized for OBS.

**Files:**
- `demos/overlay-big-wins.html`
- `demos/overlay-momentum.html`
- `demos/overlay-leaderboard.html`
- `demos/overlay-stats.html`

---

## Phase 3: Accessibility & Polish

### Task 3.1: ARIA Labels
Add comprehensive ARIA attributes to all components.

**Requirements:**
- `role` attributes for custom widgets
- `aria-live` regions for dynamic content
- `aria-label` for icon-only buttons
- Focus management for modals/dropdowns
- Screen reader announcements for toasts

### Task 3.2: Keyboard Navigation
Implement full keyboard support.

**Requirements:**
- Tab navigation through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals/dropdowns
- Arrow keys for carousels/lists
- Focus visible styles

### Task 3.3: Reduced Motion
Respect `prefers-reduced-motion` preference.

**Already Started** - Enhance with:
- Instant transitions instead of animations
- Static alternatives to animated elements
- User toggle in settings

---

## Phase 4: Configuration Panel

### Task 4.1: Settings Modal
Create a comprehensive settings modal UI.

**File:** `src/components/settings-modal.js`

**Requirements:**
- Tabbed interface (Theme, Widgets, API, Export)
- Live preview of changes
- Reset to defaults button
- Save/Cancel actions
- Keyboard accessible

### Task 4.2: Widget Configurator
Drag-and-drop widget configuration.

**File:** `src/components/widget-configurator.js`

**Requirements:**
- Visual widget selector
- Property editor panel
- Live preview
- Generate embed code
- Copy to clipboard

---

## Phase 5: Documentation

### Task 5.1: README.md
Create comprehensive documentation.

**File:** `README.md`

**Sections:**
1. Overview & Features
2. Quick Start (3 steps)
3. Installation Methods (CDN, npm, download)
4. Configuration Options
5. Widget Reference
6. Theming Guide
7. OBS Integration
8. API Reference
9. Examples
10. Contributing

### Task 5.2: JSDoc Comments
Add JSDoc comments to all public functions.

### Task 5.3: Example Pages
Create example implementations.

**Files:**
- `demos/basic-dashboard.html`
- `demos/streamer-overlay.html`
- `demos/custom-theme.html`
- `demos/minimal-widget.html`

---

## Technical Requirements

### Must Use
- Vanilla JavaScript (ES6+)
- CSS Custom Properties for theming
- No build tools required (works by opening HTML)
- CDN-friendly structure

### Must NOT Use
- React, Vue, Angular (no frameworks)
- npm dependencies in runtime code
- Backend server (client-side only)
- Webpack, Vite for core functionality

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance Targets
- First paint: <100ms
- Widget render: <50ms
- Animation: 60fps
- Bundle size: <50KB (core)

---

## Code Standards

### JavaScript
- Use `const` over `let`, never `var`
- Arrow functions for callbacks
- async/await over .then()
- Destructuring for object properties
- Template literals for string interpolation
- JSDoc comments on all public functions

### CSS
- BEM-like naming: `.component-element--modifier`
- CSS custom properties for all colors/spacing
- Mobile-first responsive design
- Logical properties (margin-inline, padding-block)
- Reduced motion media queries

### HTML
- Semantic elements (section, article, nav, etc.)
- ARIA attributes where needed
- Progressive enhancement
- No inline styles (except critical path)

---

## Completion Criteria

<promise>
TASK COMPLETE when ALL of the following exist:

1. ✅ **New Widgets Created:**
   - src/components/leaderboard.js (working, animated)
   - src/components/game-carousel.js (smooth scroll, touch support)
   - src/components/user-profile.js (with skeleton loading)

2. ✅ **OBS Overlay Mode:**
   - src/styles/overlay.css (transparent, chromakey)
   - demos/overlay-*.html (4 standalone overlay pages)
   - Overlay mode toggle works in settings

3. ✅ **Accessibility:**
   - All widgets have ARIA labels
   - Full keyboard navigation
   - Reduced motion respected
   - Focus visible on all interactive elements

4. ✅ **Documentation:**
   - README.md with all 10 sections
   - JSDoc comments on public APIs
   - 4 example demo pages

5. ✅ **Polish:**
   - No console errors
   - All animations smooth (60fps)
   - Mobile responsive (tested at 375px, 768px, 1024px)
   - Theme switching instant (<100ms)

6. ✅ **Testing:**
   - index.html loads without errors
   - All widgets render correctly
   - Theme persistence works across reload
   - Toast notifications work
   - API client handles errors gracefully
</promise>

---

## File Structure

```
/home/aiuser/projects/streamer-toolkit/
├── index.html                    # Main demo page
├── README.md                     # Documentation
├── PROMPT.md                     # This file (Ralph Loop prompt)
├── src/
│   ├── components/
│   │   ├── toast.js             ✅ Complete
│   │   ├── widgets.js           ✅ Complete (base widgets)
│   │   ├── leaderboard.js       🔧 To create
│   │   ├── game-carousel.js     🔧 To create
│   │   ├── user-profile.js      🔧 To create
│   │   ├── settings-modal.js    🔧 To create
│   │   └── widget-configurator.js 🔧 To create
│   ├── config/
│   │   └── theme-config.js      ✅ Complete
│   ├── styles/
│   │   ├── design-system.css    ✅ Complete
│   │   ├── animations.css       ✅ Complete
│   │   ├── components.css       ✅ Complete
│   │   └── overlay.css          🔧 To create
│   └── utils/
│       └── api-client.js        ✅ Complete
├── demos/
│   ├── basic-dashboard.html     🔧 To create
│   ├── streamer-overlay.html    🔧 To create
│   ├── overlay-big-wins.html    🔧 To create
│   ├── overlay-momentum.html    🔧 To create
│   ├── overlay-leaderboard.html 🔧 To create
│   └── overlay-stats.html       🔧 To create
├── assets/
│   ├── icons/
│   └── images/
└── dist/                         # Built/bundled files (optional)
```

---

## API Reference

### MyPrize API Endpoints

> **IMPORTANT:** The correct API base URL is `https://myprize.us/api`
> Do NOT use `api.myprize.com` or `api.myprize.us` - these are incorrect.

Base URL: `https://myprize.us/api`

| Endpoint | Description |
|----------|-------------|
| `GET /rooms` | List rooms (returns `{page, page_size, results}`) |
| `GET /rooms/{id}` | Get room details |
| `GET /rooms/slug/{slug}` | Get room by slug |
| `GET /missions` | List missions (returns `{page, page_size, results}`) |
| `GET /missions/{id}/leaderboard` | Mission leaderboard |
| `GET /bets/tracked/type/{type}` | Get bets - **returns array directly** |
| `GET /igames` | List games (returns `{page, page_size, results}`) |
| `GET /stats/users` | Get active user count (`{activeUserCount}`) |
| `GET /jurisdiction` | API health check |

Rate Limit: 5,000 requests / 5 minutes / IP

### Verified API Response Formats

These formats were verified against the live API:

**`/bets/tracked/type/{type}` - Returns ARRAY directly (not wrapped)**
```json
[
  {
    "bet_id": "abc123",
    "username": "PlayerName",
    "igame": {
      "id": "game-id",
      "name": "Game Name",
      "provider": "provider-name"
    },
    "amount_won": 1234.56,
    "multiplier": 150.5,
    "currency": "SC"
  }
]
```

**`/rooms`, `/missions`, `/igames` - Returns wrapped object**
```json
{
  "page": 1,
  "page_size": 20,
  "results": [...]
}
```

**`/stats/users` - Returns stats object**
```json
{
  "activeUserCount": 447
}
```

**Key Field Names (verified):**
- Bets use `bet_id` (not `id`)
- Bets use `username` directly (not `user.username`)
- Bets use `igame` (not `game`)
- Win amount is `amount_won` (not `amount`)

---

## Development Tips

1. **Test frequently** - Open index.html after each change
2. **Use console** - Check for errors constantly
3. **Mobile first** - Start with 375px viewport
4. **Accessibility** - Tab through everything
5. **Performance** - Watch animation frame rate
6. **Theme test** - Switch themes during development

---

## When Stuck

1. Read existing code patterns in completed files
2. Check API-DOCUMENTATION.md in parent project
3. Simplify the approach
4. Break into smaller tasks
5. Test one thing at a time

---

**END OF PROMPT**

When you complete all tasks, create `COMPLETION-REPORT.md` with:
- List of all files created/modified
- Screenshots or descriptions of new features
- Any known issues or limitations
- Recommendations for future improvements
