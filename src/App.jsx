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
import { getApiUrl } from "./lib/api.js";

export default function App() {
  const navigate = useNavigate();

  const [markets, setMarkets] = React.useState([]);
  const [userEmail, setUserEmail] = React.useState(null);
  const [cash, setCash] = React.useState(0);
  const [portfolio, setPortfolio] = React.useState(0);

  // Sync balances from server
  async function syncBalancesFromServer(email) {
    try {
      const r = await fetch(getApiUrl(`/api/balances?email=${encodeURIComponent(email)}`));
      const j = await r.json().catch(() => ({}));
      if (j?.ok && j.data) {
        setCash(Number(j.data.cash || 0));
        
        // Calculate portfolio from positions
        let portfolioValue = Number(j.data.portfolio || 0);
        try {
          const posR = await fetch(getApiUrl(`/api/positions?email=${encodeURIComponent(email)}`));
          const posJ = await posR.json().catch(() => ({}));
          if (posJ?.ok && posJ.data?.portfolioValue != null) {
            portfolioValue = Number(posJ.data.portfolioValue || 0);
            setPortfolio(portfolioValue);
          } else {
            setPortfolio(portfolioValue);
          }
        } catch {
          setPortfolio(portfolioValue);
        }
        
        // Also update local storage
        await ensureBalances(email);
        const localB = await getBalances(email);
        if (Number(j.data.cash) !== Number(localB.cash) || portfolioValue !== Number(localB.portfolio || 0)) {
          // Server is source of truth, update local
          await setBalances(email, { cash: j.data.cash, portfolio: portfolioValue });
        }
      }
    } catch (e) {
      console.error("Failed to sync balances:", e);
    }
  }

  React.useEffect(() => {
    // Load markets list (from /public/markets.json via marketsStore)
    (async () => {
      try {
        const m = await fetchMarkets();
        setMarkets(Array.isArray(m) ? m : []);
      } catch {
        setMarkets([]);
      }
    })();

    // Restore session + balances
    (async () => {
      const s = await loadSession();
      if (s?.email) {
        setUserEmail(s.email);
        // Sync from server first (source of truth)
        await syncBalancesFromServer(s.email);
      }
    })();
  }, []);

  // Periodically sync balances when logged in
  React.useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(() => {
      syncBalancesFromServer(userEmail);
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
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
    if (newBalance) {
      setCash(Number(newBalance.cash || 0));
      setPortfolio(Number(newBalance.portfolio || 0));
    } else if (userEmail) {
      // Refresh from server
      await syncBalancesFromServer(userEmail);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
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
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
