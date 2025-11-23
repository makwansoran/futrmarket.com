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
2. Change `--text-primary`, `--text-secondary`, etc.
3. Save and rebuild

## Current Color Scheme

- **Primary Background**: Dark gray (`rgb(3, 7, 18)`) - gray-950
- **Secondary Background**: Medium dark gray (`rgb(17, 24, 39)`) - gray-900
- **Footer**: Black (`rgb(0, 0, 0)`)
- **Text Primary**: Light gray (`rgb(243, 244, 246)`) - gray-100
- **Accent Blue**: `rgb(37, 99, 235)` - blue-600

## Notes

- CSS variables are automatically imported via `src/style.css`
- The `colors.js` file provides Tailwind class names for reference
- All components should eventually use CSS variables for easy theming
- Changes require a rebuild of the frontend to take effect

