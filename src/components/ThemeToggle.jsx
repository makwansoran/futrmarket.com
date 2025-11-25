import React from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      role="switch"
      aria-checked={!isDark}
    >
      {/* iOS-style toggle switch */}
      <div
        className={`
          relative w-11 h-6 rounded-full transition-colors duration-300 ease-in-out
          ${isDark 
            ? 'bg-gray-600' 
            : 'bg-blue-500'
          }
        `}
        style={{
          boxShadow: isDark 
            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2)' 
            : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Toggle circle */}
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
            transform transition-transform duration-300 ease-in-out
            flex items-center justify-center
            ${isDark ? 'translate-x-0' : 'translate-x-5'}
          `}
          style={{
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Icon inside the circle */}
          {isDark ? (
            <Moon className="w-3 h-3 text-gray-600" strokeWidth={2} />
          ) : (
            <Sun className="w-3 h-3 text-blue-500" strokeWidth={2} />
          )}
        </div>
      </div>
    </button>
  );
}

