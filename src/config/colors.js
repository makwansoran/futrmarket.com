/**
 * Global Color Configuration for FutrMarket
 * 
 * Change colors here to update the entire website theme
 * All background colors, text colors, and UI element colors are defined here
 */

export const colors = {
  // Main Background Colors
  background: {
    primary: 'bg-gray-950',        // Main page background (darkest)
    secondary: 'bg-gray-900',      // Cards, modals, inputs
    tertiary: 'bg-gray-800',      // Buttons, secondary elements
    quaternary: 'bg-gray-700',   // Borders, badges
    footer: 'bg-black',           // Footer background
  },
  
  // Navbar Backgrounds (with transparency)
  navbar: {
    header: 'bg-gray-950/70',     // Main header
    category: 'bg-gray-950/70',   // Category navigation
    competitions: 'bg-gray-950/70', // Competitions navigation
    subjects: 'bg-gray-950/70',   // Subjects navigation
    // Inline style for competitions nav (rgba format)
    competitionsInline: 'rgba(3, 7, 18, 0.95)',
  },
  
  // Modal Backgrounds
  modal: {
    backdrop: 'bg-black/70',      // Modal backdrop overlay
    content: 'bg-gray-900',       // Modal content background
  },
  
  // Input Backgrounds
  input: {
    default: 'bg-gray-900/90',   // Search input, form inputs
    secondary: 'bg-gray-800',     // Alternative input style
  },
  
  // Card Backgrounds
  card: {
    default: 'bg-gray-900',       // Market cards, feature cards
    hover: 'bg-gray-800',         // Card hover state
  },
  
  // Text Colors - Main Content
  text: {
    primary: 'text-gray-100',     // Main body text, headings, titles
    secondary: 'text-gray-300',   // Secondary text, descriptions
    tertiary: 'text-gray-400',   // Tertiary text, less important info
    muted: 'text-gray-500',       // Muted text, disabled states
    white: 'text-white',          // Pure white text
    
    // Navigation & UI
    nav: 'text-gray-100',         // Navigation links text
    navHover: 'text-white',       // Navigation hover state
    navActive: 'text-blue-400',   // Active navigation item
    link: 'text-blue-400',        // Regular links
    linkHover: 'text-blue-300',   // Link hover state
    
    // Market Cards
    cardTitle: 'text-white',      // Card/question title
    cardMeta: 'text-gray-400',    // Card metadata
    cardPrice: 'text-white',      // Price text
    cardLabel: 'text-gray-400',   // Card labels
    
    // Status & Badges
    statusLive: 'text-red-400',   // Live status indicator
    statusResolved: 'text-gray-400', // Resolved status
    badgeCategory: 'text-blue-400', // Category badges
    
    // Buttons & Actions
    buttonPrimary: 'text-white',    // Primary button text
    buttonSecondary: 'text-gray-100', // Secondary button text
    buttonDisabled: 'text-gray-500', // Disabled button text
    
    // Forms & Inputs
    input: 'text-gray-100',       // Input field text
    inputPlaceholder: 'text-gray-500', // Placeholder text
    inputLabel: 'text-gray-300',  // Form labels
    
    // Footer
    footer: 'text-gray-300',      // Footer text
    footerHover: 'text-white',     // Footer link hover
    footerCopyright: 'text-gray-400', // Footer copyright
    
    // Modals & Overlays
    modalTitle: 'text-white',     // Modal title
    modalBody: 'text-gray-100',   // Modal body text
    
    // Success, Warning, Error
    success: 'text-green-400',     // Success messages
    warning: 'text-yellow-400',   // Warning messages
    error: 'text-red-400',        // Error messages
  },
  
  // Border Colors
  border: {
    default: 'border-gray-800',   // Default borders
    secondary: 'border-gray-700', // Secondary borders
    hover: 'border-gray-700',     // Hover border
    light: 'border-white/10',     // Light borders (navbars)
  },
  
  // Accent Colors
  accent: {
    blue: {
      bg: 'bg-blue-600',
      hover: 'bg-blue-700',
      text: 'text-blue-400',
      border: 'border-blue-500',
    },
    green: {
      bg: 'bg-green-600',
      text: 'text-green-400',
      border: 'border-green-500',
    },
    red: {
      bg: 'bg-red-600',
      text: 'text-red-400',
      border: 'border-red-500',
    },
  },
};

/**
 * Get background class by key
 * Usage: colors.background.primary
 */
export default colors;

