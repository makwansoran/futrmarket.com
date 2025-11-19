import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ChevronDown, User, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { getApiUrl } from "/src/api.js";
import DepositButton from "./components/DepositButton.jsx";
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
        onClick={() => setOpen(v => !v)}
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
            className="fixed inset-0 z-20" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-44 rounded-md border border-white/10 bg-gray-900/95 shadow-xl z-30">
            <Link 
              to="/account" 
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-white/5"
            >
              Account
            </Link>
            <Link 
              to="/settings" 
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-white/5"
            >
              Settings
            </Link>
            <Link 
              to="/leaderboard" 
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-white/5"
            >
              Leaderboard
            </Link>
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
            >
              Log out
            </button>
          </div>
        </>
      )}
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* LEFT: logo + brand */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition flex-shrink-0">
          <span className="text-white font-bold tracking-tight text-2xl">
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
          <HowItWorksButton />
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
              <DepositButton userEmail={userEmail} onBalanceUpdate={onBalanceUpdate} />
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
