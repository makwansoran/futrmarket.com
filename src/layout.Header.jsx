import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ChevronDown, User, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { getApiUrl } from "/src/api.js";
import NotificationButton from "./components/NotificationButton.jsx";
import PortfolioButton from "./components/PortfolioButton.jsx";
import CashButton from "./components/CashButton.jsx";

function AccountMenu({ userEmail, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const [username, setUsername] = React.useState(null);
  const [profilePicture, setProfilePicture] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Load user profile
  async function loadUserProfile() {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const r = await fetch(getApiUrl(`/api/users/${encodeURIComponent(userEmail)}`));
      if (r.ok) {
        const j = await r.json();
        if (j.ok && j.data) {
          setUsername(j.data.username || null);
          setProfilePicture(j.data.profilePicture || null);
        }
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // Refresh profile when dropdown opens (in case username was updated)
  React.useEffect(() => {
    if (open && userEmail) {
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!userEmail) return null;

  // Display username if available, otherwise show "no username"
  const displayName = username && username.trim() ? username.trim() : "no username";

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        className="px-3 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2"
      >
        {profilePicture ? (
          <img 
            src={profilePicture} 
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover border border-gray-700"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-gray-400" />
          </div>
        )}
        <span className="hidden sm:inline text-gray-200">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-transparent" 
            onClick={() => setOpen(false)}
          />
          <div 
            className="absolute right-0 top-full mt-2 w-44 rounded-md border border-white/10 bg-gray-900 backdrop-blur-sm shadow-xl z-[101]"
            style={{
              animation: 'dropdownFadeIn 0.2s ease-out forwards',
              transformOrigin: 'top right'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Link 
              to="/account" 
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-white/5"
              style={{
                animation: `menuItemSlideIn 0.2s ease-out 0s forwards`
              }}
            >
              Account
            </Link>
            <Link 
              to="/settings" 
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-white/5"
              style={{
                animation: `menuItemSlideIn 0.2s ease-out 0.05s forwards`
              }}
            >
              Settings
            </Link>
            <Link 
              to="/leaderboard" 
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-white/5"
              style={{
                animation: `menuItemSlideIn 0.2s ease-out 0.1s forwards`
              }}
            >
              Leaderboard
            </Link>
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
              style={{
                animation: `menuItemSlideIn 0.2s ease-out 0.15s forwards`
              }}
            >
              Log out
            </button>
          </div>
        </>
      )}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes menuItemSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default function Header({ userEmail, onLogout, cash, portfolio, onSearch, onBalanceUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = React.useState("");
  
  const isActive = (path) => {
    if (path === "/markets") {
      return location.pathname === "/markets" || location.pathname.startsWith("/markets/") || location.pathname === "/trending" || location.pathname === "/new";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  function submit(e) {
    e.preventDefault();
    onSearch?.(q);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-light)] backdrop-blur" style={{ backgroundColor: 'var(--bg-header)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* LEFT: logo + brand */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition flex-shrink-0">
          <span className="text-white font-bold tracking-tight text-2xl" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            FutrMarket
          </span>
        </Link>
        
        {/* NAV: navigation links */}
        <nav className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
          <Link 
            to="/live" 
            className={`transition text-sm font-medium whitespace-nowrap ${
              isActive("/live") ? "text-red-400 font-semibold" : "text-red-400/80 hover:text-red-400"
            }`}
          >
            Live
          </Link>
          <Link 
            to="/news" 
            className={`transition text-sm font-medium whitespace-nowrap ${
              isActive("/news") ? "text-white" : "text-gray-300 hover:text-white"
            }`}
          >
            News
          </Link>
        </nav>

        {/* CENTER: search (always centered) */}
        <div className="flex-1 flex justify-center items-center gap-3">
          <form onSubmit={submit} className="w-full max-w-xl">
            <div className="relative flex">
              <span className="absolute left-3 top-2.5"><Search className="w-4 h-4 text-gray-500" /></span>
              <input
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="Search markets…"
                className="w-full bg-gray-900/90 text-gray-100 placeholder-gray-500 rounded-l-lg pl-9 pr-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-r-lg bg-blue-600 hover:bg-blue-500 text-white text-sm border border-l-0 border-white/10"
              >
                Search
              </button>
            </div>
          </form>
          {!userEmail && <HowItWorksButton />}
        </div>

        {/* RIGHT: balances + deposit + account OR sign up/login buttons */}
        <div className="min-w-[280px] flex items-center justify-end gap-3">
          {userEmail ? (
            <>
              <PortfolioButton portfolio={portfolio} cash={cash} />
              <CashButton 
                cash={cash} 
                userEmail={userEmail}
                onBalanceUpdate={onBalanceUpdate}
              />
              <NotificationButton userEmail={userEmail} />
              <AccountMenu userEmail={userEmail} onLogout={onLogout} />
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-md border border-white/15 hover:bg-white/5 text-sm">Log in</Link>
              <Link to="/signup" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// How It Works Modal Component
function HowItWorksButton() {
  const [open, setOpen] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const slides = [
    {
      title: "What is FutrMarket?",
      content: "FutrMarket is a prediction market platform where you can trade on the outcome of future events. Buy shares in outcomes you think are likely, or sell shares if you disagree.",
      icon: "📊"
    },
    {
      title: "How to Trade",
      content: "Browse markets and find predictions you want to bet on. Click 'Buy' to purchase shares in an outcome, or 'Sell' if you think it won't happen. Prices reflect the market's probability.",
      icon: "💰"
    },
    {
      title: "Market Prices",
      content: "Share prices range from 1¢ to 99¢, representing the market's estimated probability. A 50¢ share means a 50% chance. Prices change as people trade, reflecting real-time sentiment.",
      icon: "📈"
    },
    {
      title: "Making Money",
      content: "If your prediction is correct when the market resolves, your shares are worth $1 each. If you bought at 50¢, you double your money! Sell anytime before resolution to lock in profits.",
      icon: "💵"
    },
    {
      title: "Are you ready to trade?",
      content: "Sign up for a free account, deposit funds, and start trading. You can browse markets by category, search for specific topics, or check out trending predictions.",
      icon: "🚀",
      isLast: true
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleButtonClick = () => {
    setIsAnimating(true);
    setOpen(true);
    // Reset animation after it completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={handleButtonClick}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm text-gray-300 hover:text-white whitespace-nowrap ${
          isAnimating ? 'animate-button-click' : ''
        }`}
        style={{ transition: 'none' }}
      >
        <Info className={`w-4 h-4 text-blue-500 ${isAnimating ? 'animate-icon-pulse' : ''}`} />
        <span className="hidden sm:inline">How it works</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-modal-backdrop" 
            onClick={() => setOpen(false)}
          ></div>

          <div 
            className="relative w-full max-w-md mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-modal-content" 
            style={{ transform: 'translateY(55%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">How it works</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Slide Content */}
            <div className="p-8 min-h-[300px] flex flex-col items-center justify-center">
              <div className="text-6xl mb-6">{slides[currentSlide].icon}</div>
              <h4 className="text-2xl font-bold text-white mb-4 text-center">
                {slides[currentSlide].title}
              </h4>
              <p className="text-gray-300 text-center max-w-md leading-relaxed">
                {slides[currentSlide].content}
              </p>
            </div>

            {/* Navigation */}
            <div className="p-4 border-t border-gray-800 space-y-4">
              {/* Slide Indicators */}
              <div className="flex items-center justify-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition ${
                      index === currentSlide
                        ? "bg-blue-500 w-6"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Next button or Create Account button */}
              <div className="flex justify-center">
                {slides[currentSlide]?.isLast ? (
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium"
                  >
                    Create Account
                  </Link>
                ) : (
                  <button
                    onClick={nextSlide}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={slides.length === 0}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes buttonClick {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(0.88);
          }
          60% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes iconPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.8;
          }
        }
        
        .animate-button-click {
          animation: buttonClick 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-icon-pulse {
          animation: iconPulse 0.3s ease-in-out;
        }
        
        @keyframes modalBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-modal-backdrop {
          animation: modalBackdrop 0.2s ease-out;
        }
        
        @keyframes modalContent {
          from {
            opacity: 0;
            transform: translateY(55%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(55%) scale(1);
          }
        }
        
        .animate-modal-content {
          animation: modalContent 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
}
