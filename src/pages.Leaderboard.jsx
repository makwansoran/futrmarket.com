import React from "react";
import { getApiUrl } from "/src/api.js";
import { useTheme } from "./contexts/ThemeContext.jsx";

export default function LeaderboardPage(){
  const { isLight } = useTheme();
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    try {
      setLoading(true);
      setError("");
      
      const r = await fetch(getApiUrl("/api/leaderboard"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!r.ok) {
        const text = await r.text();
        setError(`Server error: ${r.status}`);
        return;
      }
      
      const contentType = r.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError("Server returned invalid response");
        return;
      }
      
      const j = await r.json();
      
      if (j.ok) {
        setLeaderboard(j.data || []);
      } else {
        setError(j.error || "Failed to load leaderboard");
      }
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
      setError("Failed to load leaderboard. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className={`max-w-5xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
        <h1 className={`text-3xl font-bold mb-6 ${isLight ? 'text-black' : 'text-white'}`}>Leaderboard</h1>
        <div className={`rounded-xl p-8 text-center border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
          <div className={isLight ? 'text-gray-600' : 'text-gray-400'}>Loading leaderboard...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`max-w-5xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
        <h1 className={`text-3xl font-bold mb-6 ${isLight ? 'text-black' : 'text-white'}`}>Leaderboard</h1>
        <div className={`rounded-xl p-8 text-center border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
          <div className="text-red-400">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className={`max-w-5xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
      <h1 className={`text-3xl font-bold mb-6 ${isLight ? 'text-black' : 'text-white'}`}>Leaderboard</h1>
      <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Rankings based on total account balance (cash + portfolio)</p>
      
      {leaderboard.length === 0 ? (
        <div className={`rounded-xl p-8 text-center border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
          <div className={isLight ? 'text-gray-600' : 'text-gray-400'}>No users on the leaderboard yet. Be the first!</div>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
          {/* Header */}
          <div className={`grid grid-cols-5 p-4 border-b font-semibold text-sm ${
            isLight 
              ? 'bg-gray-50 border-gray-200 text-gray-700' 
              : 'bg-gray-800/50 border-gray-700 text-gray-300'
          }`}>
            <div>Rank</div>
            <div>User</div>
            <div>Cash</div>
            <div>Portfolio</div>
            <div>Total Balance</div>
          </div>
          
          {/* Rows */}
          {leaderboard.map((user) => (
            <div 
              key={user.email} 
              className={`grid grid-cols-5 p-4 border-b transition ${
                isLight 
                  ? 'border-gray-200 text-gray-700 hover:bg-gray-50' 
                  : 'border-gray-800 text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              <div className={`font-semibold ${isLight ? 'text-black' : 'text-white'}`}>#{user.rank}</div>
              <div className="flex items-center gap-2">
                {user.profilePicture && (
                  <img 
                    src={user.profilePicture} 
                    alt={user.username}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <span className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>
                  {user.username && user.username.trim() ? user.username.trim() : "no username"}
                </span>
              </div>
              <div className={isLight ? 'text-black' : 'text-gray-300'}>${user.cash.toFixed(2)}</div>
              <div className={isLight ? 'text-black' : 'text-gray-300'}>${user.portfolio.toFixed(2)}</div>
              <div className="font-semibold text-green-400">${user.totalBalance.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
