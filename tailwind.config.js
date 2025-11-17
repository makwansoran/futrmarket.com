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
