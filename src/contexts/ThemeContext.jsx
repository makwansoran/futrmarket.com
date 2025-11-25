import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference, default to dark
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    }
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isLight = theme === 'light';
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLight: Boolean(isLight) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  try {
    const context = useContext(ThemeContext);
    if (!context) {
      // Return a safe default instead of throwing to prevent crashes
      console.warn('useTheme called outside ThemeProvider, using default dark theme');
      return {
        theme: 'dark',
        toggleTheme: () => {},
        isLight: false
      };
    }
    // Ensure isLight is always defined - use context.isLight if available, otherwise derive from theme
    const isLight = Boolean(
      (context.isLight !== undefined && context.isLight !== null) 
        ? context.isLight 
        : (context.theme === 'light')
    );
    return {
      theme: context.theme || 'dark',
      toggleTheme: context.toggleTheme || (() => {}),
      isLight: isLight
    };
  } catch (error) {
    // Ultimate fallback - return safe defaults if anything goes wrong
    console.error('Error in useTheme hook:', error);
    return {
      theme: 'dark',
      toggleTheme: () => {},
      isLight: false
    };
  }
}

