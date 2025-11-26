import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "./contexts/ThemeContext.jsx";
import { Info } from "lucide-react";

export default function CompanyPage() {
  const { isLight } = useTheme();

  return (
    <main className={`flex gap-4 max-w-7xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex-shrink-0 ${isLight ? 'text-black' : 'text-white'}`}>
        <div className={`sticky top-24 rounded-xl p-4 overflow-hidden ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
          {/* Information Center Icon */}
          <div className="mb-6 pb-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-start">
              <Info 
                className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-blue-500`}
                size={24}
              />
              <span className="ml-2 text-sm font-semibold" style={{
                background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #a0a0a0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Information Center
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Link 
              to="/blog" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Blog
            </Link>
            <Link 
              to="/company" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'bg-gray-800 text-white font-medium'
              }`}
            >
              About Us
            </Link>
            <Link 
              to="/privacy" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Privacy Policy
            </Link>
            <Link 
              to="/data-terms" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Data Terms of Service
            </Link>
            <Link 
              to="/brand-kit" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Brand Kit
            </Link>
            <Link 
              to="/become-a-partner" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Become A Partner
            </Link>
            <Link 
              to="/help" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Help Center
            </Link>
            <Link 
              to="/api" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              API
            </Link>
            <Link 
              to="/faq-finance" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              FAQ for Finance Professionals
            </Link>
            <Link 
              to="/regulatory" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Regulatory
            </Link>
            <Link 
              to="/trading-hours" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Trading Hours
            </Link>
            <Link 
              to="/fee-schedule" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Fee Schedule
            </Link>
            <Link 
              to="/trading-prohibitions" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Trading Prohibitions
            </Link>
            <Link 
              to="/incentive-program" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Incentive Program
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1">
        <h1 className="text-4xl font-bold mb-6" style={{
          background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #a0a0a0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          About us at Futrmarket.com
        </h1>
        
        <div className={`rounded-xl p-8 ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
          <div className={`prose prose-invert max-w-none ${isLight ? 'prose-gray' : 'prose-invert'}`}>
            <p className={`text-lg ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Content will be added here...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

