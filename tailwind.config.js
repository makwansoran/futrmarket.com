export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    // Colors
    'bg-gray-950', 'bg-gray-900', 'bg-gray-800', 'bg-gray-700', 'bg-gray-600', 'bg-gray-500',
    'text-white', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400', 'text-gray-500',
    'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'text-blue-400',
    'bg-red-500', 'bg-red-600', 'text-red-400',
    'bg-green-500', 'bg-green-600', 'text-green-400',
    'bg-yellow-500', 'text-yellow-400',
    'bg-purple-500', 'text-purple-400',
    'bg-indigo-500', 'text-indigo-400',
    // Borders
    'border-gray-800', 'border-gray-700', 'border-blue-500', 'border-red-500', 'border-green-500',
    // Opacity variants
    'bg-gray-900/50', 'bg-blue-500/20', 'bg-green-500/10', 'bg-red-500/10', 'bg-red-500/20',
    'border-green-500/30', 'border-red-500/30', 'border-blue-500/30',
  ],
  theme: {
    extend: {
      colors: {
        // Use CSS variables for easy theming
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          quaternary: 'var(--bg-quaternary)',
          footer: 'var(--bg-footer)',
        },
        navbar: {
          header: 'var(--bg-header)',
          default: 'var(--bg-navbar)',
          competitions: 'var(--bg-competitions-nav)',
        },
        modal: {
          backdrop: 'var(--bg-modal-backdrop)',
          content: 'var(--bg-modal-content)',
        },
        input: {
          default: 'var(--bg-input)',
          secondary: 'var(--bg-input-secondary)',
        },
        card: {
          default: 'var(--bg-card)',
          hover: 'var(--bg-card-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          white: 'var(--text-white)',
        },
        border: {
          default: 'var(--border-default)',
          secondary: 'var(--border-secondary)',
          light: 'var(--border-light)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          'blue-hover': 'var(--accent-blue-hover)',
          'blue-text': 'var(--accent-blue-text)',
          green: 'var(--accent-green)',
          'green-text': 'var(--accent-green-text)',
          red: 'var(--accent-red)',
          'red-text': 'var(--accent-red-text)',
        },
        brand: {
          blue: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [],
};
