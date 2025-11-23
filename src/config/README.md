# Global Color Configuration

This directory contains the global color configuration for FutrMarket. Change colors here to update the entire website theme.

## Files

### `colors.js`
JavaScript object containing all Tailwind CSS class names for colors. Use this when you need to reference colors in JavaScript/React components.

**Usage:**
```jsx
import colors from '/src/config/colors.js';

<div className={colors.background.primary}>
  Content
</div>
```

### `theme.css`
CSS variables for all colors. This is the **recommended way** to change colors globally.

**To change colors, edit the CSS variables in `theme.css`:**

```css
:root {
  --bg-primary: rgb(3, 7, 18);        /* Main background - change this! */
  --bg-secondary: rgb(17, 24, 39);    /* Cards, modals - change this! */
  /* ... etc */
}
```

Then use them in your components:
```jsx
<div style={{ backgroundColor: 'var(--bg-primary)' }}>
  Content
</div>
```

Or use Tailwind's arbitrary values:
```jsx
<div className="bg-[var(--bg-primary)]">
  Content
</div>
```

## Quick Color Change Guide

### To change the main background color:
1. Open `src/config/theme.css`
2. Change `--bg-primary` value
3. Save and rebuild

### To change card/modal backgrounds:
1. Open `src/config/theme.css`
2. Change `--bg-secondary` value
3. Save and rebuild

### To change navbar backgrounds:
1. Open `src/config/theme.css`
2. Change `--bg-header` and `--bg-navbar` values
3. Save and rebuild

### To change text colors:
1. Open `src/config/theme.css`
2. Find the specific text color variable you want to change:
   - `--text-primary` - Main body text, headings, titles
   - `--text-card-title` - Market card question text
   - `--text-nav` - Navigation links
   - `--text-link` - Clickable links
   - `--text-button-primary` - Primary button text
   - `--text-input` - Input field text
   - `--text-footer` - Footer text
   - `--text-success` - Success messages
   - `--text-error` - Error messages
   - And many more (see `theme.css` for full list)
3. Change the RGB value
4. Save and rebuild

## Current Color Scheme

- **Primary Background**: Dark gray (`rgb(3, 7, 18)`) - gray-950
- **Secondary Background**: Medium dark gray (`rgb(17, 24, 39)`) - gray-900
- **Footer**: Black (`rgb(0, 0, 0)`)
- **Text Primary**: Light gray (`rgb(243, 244, 246)`) - gray-100
- **Accent Blue**: `rgb(37, 99, 235)` - blue-600

## Text Color Variables Reference

All text colors are organized by purpose with clear descriptions:

### Main Content Text
- `--text-primary` - Main body text, headings, titles (page titles, card titles)
- `--text-secondary` - Secondary text, descriptions (subtitles, descriptions)
- `--text-tertiary` - Tertiary text, less important info (metadata, timestamps)
- `--text-muted` - Muted text, disabled states (placeholder text, disabled buttons)
- `--text-white` - Pure white text (high contrast text, buttons)

### Navigation & UI
- `--text-nav` - Navigation links text
- `--text-nav-hover` - Navigation hover state
- `--text-nav-active` - Active navigation item (current page indicator)
- `--text-link` - Regular links (clickable links, external links)
- `--text-link-hover` - Link hover state

### Market Cards
- `--text-card-title` - Card/question title (market card question text)
- `--text-card-meta` - Card metadata (dates, timestamps on cards)
- `--text-card-price` - Price text (YES/NO prices on market cards)
- `--text-card-label` - Card labels ("YES", "NO" labels)

### Status & Badges
- `--text-status-live` - Live status indicator ("LIVE" badges, active status)
- `--text-status-resolved` - Resolved status (closed/resolved market text)
- `--text-badge-category` - Category badges (category tags on cards)

### Buttons & Actions
- `--text-button-primary` - Primary button text (main action buttons)
- `--text-button-secondary` - Secondary button text (secondary buttons)
- `--text-button-disabled` - Disabled button text (disabled/inactive buttons)

### Forms & Inputs
- `--text-input` - Input field text (text in input fields, search bars)
- `--text-input-placeholder` - Placeholder text (input placeholders)
- `--text-input-label` - Form labels (form field labels)

### Footer
- `--text-footer` - Footer text (footer links and text)
- `--text-footer-hover` - Footer link hover (footer links on hover)
- `--text-footer-copyright` - Footer copyright (copyright text, disclaimers)

### Modals & Overlays
- `--text-modal-title` - Modal title (modal/dialog titles)
- `--text-modal-body` - Modal body text (modal content text)

### Success, Warning, Error
- `--text-success` - Success messages (success notifications, positive feedback)
- `--text-warning` - Warning messages (warning notifications, caution text)
- `--text-error` - Error messages (error notifications, validation errors)

## Notes

- CSS variables are automatically imported via `src/style.css`
- The `colors.js` file provides Tailwind class names for reference
- All components should eventually use CSS variables for easy theming
- Changes require a rebuild of the frontend to take effect
- Each text color variable has a specific purpose - check the comments in `theme.css` for details

