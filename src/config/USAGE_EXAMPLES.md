# Color Configuration Usage Examples

## Method 1: Using CSS Variables (Recommended)

### In React Components with inline styles:
```jsx
function MyComponent() {
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)' }}>
      <p style={{ color: 'var(--text-primary)' }}>Hello World</p>
    </div>
  );
}
```

### In React Components with Tailwind arbitrary values:
```jsx
function MyComponent() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <p>Hello World</p>
    </div>
  );
}
```

### In regular CSS files:
```css
.my-class {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

## Method 2: Using the colors.js object (For Tailwind classes)

```jsx
import colors from '/src/config/colors.js';

function MyComponent() {
  return (
    <div className={colors.background.primary}>
      <p className={colors.text.primary}>Hello World</p>
    </div>
  );
}
```

## Common Use Cases

### Background Colors
```jsx
// Main page background
<div className="bg-[var(--bg-primary)]">...</div>

// Card background
<div className="bg-[var(--bg-card)]">...</div>

// Modal background
<div className="bg-[var(--bg-modal-content)]">...</div>

// Navbar background
<div className="bg-[var(--bg-header)]">...</div>
```

### Text Colors
```jsx
// Primary text
<p className="text-[var(--text-primary)]">Main text</p>

// Secondary text
<p className="text-[var(--text-secondary)]">Secondary text</p>

// Muted text
<p className="text-[var(--text-muted)]">Muted text</p>
```

### Border Colors
```jsx
<div className="border border-[var(--border-default)]">...</div>
<div className="border border-[var(--border-light)]">...</div>
```

### Accent Colors
```jsx
<button className="bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)]">
  Click me
</button>

<span className="text-[var(--accent-green-text)]">Success!</span>
<span className="text-[var(--accent-red-text)]">Error!</span>
```

## Migration Guide

To migrate existing components to use the global color system:

1. **Find hardcoded colors:**
   ```jsx
   // Before
   <div className="bg-gray-950">...</div>
   ```

2. **Replace with CSS variable:**
   ```jsx
   // After
   <div className="bg-[var(--bg-primary)]">...</div>
   ```

3. **Or use inline styles:**
   ```jsx
   // After
   <div style={{ backgroundColor: 'var(--bg-primary)' }}>...</div>
   ```

## Available CSS Variables

### Backgrounds
- `--bg-primary` - Main page background
- `--bg-secondary` - Cards, modals, inputs
- `--bg-tertiary` - Buttons, secondary elements
- `--bg-quaternary` - Borders, badges
- `--bg-footer` - Footer background
- `--bg-header` - Main header background
- `--bg-navbar` - Navigation bar background
- `--bg-competitions-nav` - Competitions nav background
- `--bg-modal-backdrop` - Modal overlay
- `--bg-modal-content` - Modal content
- `--bg-input` - Input fields
- `--bg-input-secondary` - Alternative input style
- `--bg-card` - Card background
- `--bg-card-hover` - Card hover state

### Text
- `--text-primary` - Main text
- `--text-secondary` - Secondary text
- `--text-tertiary` - Tertiary text
- `--text-muted` - Muted text
- `--text-white` - White text

### Borders
- `--border-default` - Default borders
- `--border-secondary` - Secondary borders
- `--border-light` - Light borders

### Accents
- `--accent-blue` - Blue accent
- `--accent-blue-hover` - Blue hover state
- `--accent-blue-text` - Blue text
- `--accent-green` - Green accent
- `--accent-green-text` - Green text
- `--accent-red` - Red accent
- `--accent-red-text` - Red text

