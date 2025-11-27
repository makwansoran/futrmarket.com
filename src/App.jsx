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
import PositionsPage from "./pages.Positions.jsx";
import PartnerPage from "./pages.Partner.jsx";
import BlogPage from "./pages.Blog.jsx";
import CompanyPage from "./pages.Company.jsx";

import { UserProvider, useUser } from "./contexts/UserContext.jsx";
import { MarketsProvider, useMarkets } from "./contexts/MarketsContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { WalletProvider, client } from "./contexts/WalletContext.jsx";
import { ThirdwebProvider } from "thirdweb/react";
import { useWallet } from "./contexts/WalletContext.jsx";

// Check for placeholder API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const isPlaceholder = API_BASE_URL.includes('your-render-backend.onrender.com');

// Wrapper components for login/signup to use hooks
function LoginPageWrapper({ navigate }) {
  const { login } = useUser();
  return (
    <LoginPage
      onLogin={async (email) => {
        await login(email);
        navigate("/");
      }}
    />
  );
      }

function SignupPageWrapper({ navigate }) {
  const { login } = useUser();
  return (
    <SignupPage
      onLogin={async (email) => {
        await login(email);
    navigate("/");
      }}
    />
  );
  }

function AppContent() {
  const navigate = useNavigate();
  const { userEmail, cash, portfolio, logout, updateBalance } = useUser();
  const { markets } = useMarkets();
  const { disconnectWallet } = useWallet();

  function handleSearch(q) {
    // stub hook for search
    console.log("search:", q);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      {/* Show error banner if API URL is placeholder */}
      {isPlaceholder && (
        <div className="bg-red-600 text-white px-4 py-3 text-center text-sm font-medium">
          <strong>⚠️ Configuration Error:</strong> API URL is set to placeholder. 
          Go to Vercel → Settings → Environment Variables → Update <code>VITE_API_URL</code> to your actual Render backend URL, then redeploy.
        </div>
      )}
      <Header
        userEmail={userEmail}
        onLogout={async () => {
          // Disconnect wallet on logout
          try {
            await disconnectWallet();
          } catch (e) {
            console.error("Failed to disconnect wallet on logout:", e);
          }
          await logout();
          navigate("/");
        }}
        cash={cash}
        portfolio={portfolio}
        onSearch={handleSearch}
        onBalanceUpdate={updateBalance}
      />
      <CategoryNav />
      <CompetitionsNav />
      <div className="flex-1 pb-32">
        <Routes>
          <Route path="/" element={<HomePage markets={markets} />} />
          <Route path="/trending" element={<MarketsPage markets={markets} category="trending" />} />
          <Route path="/new" element={<MarketsPage markets={markets} category="new" />} />
          <Route path="/markets" element={<MarketsPage markets={markets} />} />
          {/* Sports routes - must come before /markets/:category to avoid conflicts */}
          <Route path="/markets/sports" element={<MarketsPage markets={markets} category="sports" />} />
          <Route path="/markets/sports/:competitionSlug" element={<MarketsPage markets={markets} />} />
          <Route path="/subjects/:subjectSlug" element={<MarketsPage markets={markets} />} />
          <Route path="/markets/:category" element={<MarketsPage markets={markets} />} />
          <Route path="/market/:id" element={<MarketDetailPage />} />
          <Route path="/live" element={<LivePage markets={markets} />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/news" element={<NewsPage markets={markets} />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/become-a-partner" element={<PartnerPage />} />
          <Route path="/login" element={<LoginPageWrapper navigate={navigate} />} />
          <Route path="/signup" element={<SignupPageWrapper navigate={navigate} />} />
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-8 text-center">
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

export default function App() {
  return (
    <ThirdwebProvider client={client}>
      <ThemeProvider>
        <WalletProvider>
          <UserProvider>
            <MarketsProvider>
              <AppContent />
            </MarketsProvider>
          </UserProvider>
        </WalletProvider>
      </ThemeProvider>
    </ThirdwebProvider>
  );
}
