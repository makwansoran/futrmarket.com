import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Header from "./layout.Header.jsx";
import CategoryNav from "./components/CategoryNav.jsx";
import CompetitionsNav from "./components/CompetitionsNav.jsx";
import Footer from "./components/Footer.jsx";
import HomePage from "./pages.Home.jsx";
import MarketsPage from "./pages.Markets.jsx";
import MarketDetailPage from "./pages.MarketDetail.jsx";
import LeaderboardPage from "./pages.Leaderboard.jsx";
import SettingsPage from "./pages.Settings.jsx";
import AccountPage from "./pages.Account.jsx";
import LoginPage from "./pages.Login.jsx";
import SignupPage from "./pages.Signup.jsx";
import LivePage from "./pages.Live.jsx";
import ForumPage from "./pages.Forum.jsx";
import NewsPage from "./pages.News.jsx";

import { fetchMarkets } from "./marketsStore.js";
import {
  loadSession,
  clearSession,
  ensureBalances,
  getBalances,
  setBalances
} from "./lib.session.js";
import { getApiUrl } from "/src/api.js";

// Check for placeholder API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const isPlaceholder = API_BASE_URL.includes('your-render-backend.onrender.com');

export default function App() {
  const navigate = useNavigate();

  const [markets, setMarkets] = React.useState([]);
  const [userEmail, setUserEmail] = React.useState(null);
  const [cash, setCash] = React.useState(0);
  const [portfolio, setPortfolio] = React.useState(0);

  // Sync balances from server
  async function syncBalancesFromServer(email) {
    if (!email) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const r = await fetch(getApiUrl(`/api/balances?email=${encodeURIComponent(email)}`), {
        signal: controller.signal,
        cache: "no-store"
      });
      clearTimeout(timeoutId);
      
      const j = await r.json().catch(() => ({}));
      if (j?.ok && j.data) {
        setCash(Number(j.data.cash || 0));
        
        // Calculate portfolio from positions
        let portfolioValue = Number(j.data.portfolio || 0);
        try {
          const posController = new AbortController();
          const posTimeoutId = setTimeout(() => posController.abort(), 10000);
          const posR = await fetch(getApiUrl(`/api/positions?email=${encodeURIComponent(email)}`), {
            signal: posController.signal,
            cache: "no-store"
          });
          clearTimeout(posTimeoutId);
          
          const posJ = await posR.json().catch(() => ({}));
          if (posJ?.ok && posJ.data?.portfolioValue != null) {
            portfolioValue = Number(posJ.data.portfolioValue || 0);
            setPortfolio(portfolioValue);
          } else {
            setPortfolio(portfolioValue);
          }
        } catch (e) {
          if (e.name !== "AbortError") {
            console.error("Failed to load positions:", e);
          }
          setPortfolio(portfolioValue);
        }
        
        // Also update local storage
        try {
          await ensureBalances(email);
          const localB = await getBalances(email);
          if (Number(j.data.cash) !== Number(localB.cash) || portfolioValue !== Number(localB.portfolio || 0)) {
            // Server is source of truth, update local
            await setBalances(email, { cash: j.data.cash, portfolio: portfolioValue });
          }
        } catch (e) {
          console.error("Failed to update local balances:", e);
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Failed to sync balances:", e);
      }
    }
  }

  React.useEffect(() => {
    let cancelled = false;

    // Load markets list (from /public/markets.json via marketsStore)
    (async () => {
      try {
        const m = await fetchMarkets();
        if (!cancelled) {
          setMarkets(Array.isArray(m) ? m : []);
        }
      } catch (e) {
        console.error("Failed to load markets:", e);
        if (!cancelled) {
          setMarkets([]);
        }
      }
    })();

    // Restore session + balances
    (async () => {
      try {
        const s = await loadSession();
        if (!cancelled && s?.email) {
          setUserEmail(s.email);
          // Sync from server first (source of truth)
          await syncBalancesFromServer(s.email);
        }
      } catch (e) {
        console.error("Failed to restore session:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Periodically sync balances when logged in
  React.useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    const interval = setInterval(() => {
      if (!cancelled) {
        syncBalancesFromServer(userEmail).catch((e) => {
          console.error("Failed to sync balances:", e);
        });
      }
    }, 30000); // Every 30 seconds
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  async function onLogout() {
    await clearSession();
    setUserEmail(null);
    setCash(0);
    setPortfolio(0);
    navigate("/");
  }

  function handleSearch(q) {
    // stub hook for search
    console.log("search:", q);
  }

  async function handleBalanceUpdate(newBalance) {
    try {
      if (newBalance) {
        setCash(Number(newBalance.cash || 0));
        setPortfolio(Number(newBalance.portfolio || 0));
      } else if (userEmail) {
        // Refresh from server
        await syncBalancesFromServer(userEmail);
      }
    } catch (e) {
      console.error("Failed to update balance:", e);
      // Don't throw - just log the error
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Show error banner if API URL is placeholder */}
      {isPlaceholder && (
        <div className="bg-red-600 text-white px-4 py-3 text-center text-sm font-medium">
          <strong>⚠️ Configuration Error:</strong> API URL is set to placeholder. 
          Go to Vercel → Settings → Environment Variables → Update <code>VITE_API_URL</code> to your actual Render backend URL, then redeploy.
        </div>
      )}
      <Header
        userEmail={userEmail}
        onLogout={onLogout}
        cash={cash}
        portfolio={portfolio}
        onSearch={handleSearch}
        onBalanceUpdate={handleBalanceUpdate}
      />
      <CategoryNav />
      <CompetitionsNav />
      <div className="flex-1 pb-32">
        <Routes>
          <Route path="/" element={<HomePage markets={markets} />} />
          <Route path="/trending" element={<MarketsPage markets={markets} category="trending" />} />
          <Route path="/new" element={<MarketsPage markets={markets} category="new" />} />
          <Route path="/markets" element={<MarketsPage markets={markets} />} />
          <Route path="/markets/:category" element={<MarketsPage markets={markets} />} />
          <Route path="/market/:id" element={<MarketDetailPage markets={markets} onBalanceUpdate={handleBalanceUpdate} />} />
          <Route path="/live" element={<LivePage markets={markets} />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/news" element={<NewsPage markets={markets} />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route 
            path="/account" 
            element={
              <AccountPage 
                userEmail={userEmail}
                cash={cash}
                onUserUpdate={(newEmail) => {
                  setUserEmail(newEmail);
                  syncBalancesFromServer(newEmail);
                }}
              />
            } 
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/login"
            element={
              <LoginPage
                onLogin={async (email) => {
                  setUserEmail(email);
                  try {
                    await ensureBalances(email);
                    const b = await getBalances(email);
                    if (b?.cash != null) setCash(Number(b.cash));
                    if (b?.portfolio != null) setPortfolio(Number(b.portfolio));
                  } catch {}
                  navigate("/");
                }}
              />
            }
          />
          <Route
            path="/signup"
            element={
              <SignupPage
                onLogin={async (email) => {
                  setUserEmail(email);
                  try {
                    await ensureBalances(email);
                    const b = await getBalances(email);
                    if (b?.cash != null) setCash(Number(b.cash));
                    if (b?.portfolio != null) setPortfolio(Number(b.portfolio));
                  } catch {}
                  navigate("/");
                }}
              />
            }
          />
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                  <h1 className="text-3xl font-bold mb-4">404</h1>
                  <p className="text-gray-400 mb-6">Page not found</p>
                  <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
