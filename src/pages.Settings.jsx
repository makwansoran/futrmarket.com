import React from 'react';
import ThemeToggle from './components/ThemeToggle.jsx';
import { useTheme } from './contexts/ThemeContext.jsx';

export default function SettingsPage(){
  const { theme } = useTheme();
  
  return (
    <main className='max-w-3xl mx-auto px-6 py-10'>
      <h1 className='text-2xl font-bold mb-8'>Settings</h1>
      
      {/* Theme Settings Section */}
      <div className='bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg p-6 mb-6'>
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <h2 className='text-lg font-semibold mb-1 text-[var(--text-primary)]'>Appearance</h2>
            <p className='text-sm text-[var(--text-secondary)]'>
              Switch between dark and light theme. Your preference will be saved.
            </p>
          </div>
          <div className='ml-6'>
            <ThemeToggle />
          </div>
        </div>
        <div className='mt-4 pt-4 border-t border-[var(--border-default)]'>
          <p className='text-sm text-[var(--text-tertiary)]'>
            Current theme: <span className='font-medium text-[var(--text-secondary)] capitalize'>{theme}</span>
          </p>
        </div>
      </div>
      
      <div className='text-[var(--text-tertiary)] text-sm'>
        More settings coming soon.
      </div>
    </main>
  )
}
