import React from "react";

export default function LeaderboardPage(){
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
      
      const r = await fetch("/api/leaderboard", {
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
      <main className="max-w-5xl mx-auto px-6 py-10 text-white">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-gray-400">Loading leaderboard...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10 text-white">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-red-400">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <p className="text-gray-400 mb-6">Rankings based on total account balance (cash + portfolio)</p>
      
      {leaderboard.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-gray-400">No users on the leaderboard yet. Be the first!</div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 p-4 border-b border-gray-700 bg-gray-800/50 text-gray-300 font-semibold text-sm">
            <div>Rank</div>
            <div>User</div>
            <div>Cash</div>
            <div>Portfolio</div>
            <div>Total Balance</div>
          </div>
          
          {/* Rows */}
          {leaderboard.map((user) => (
            <div key={user.email} className="grid grid-cols-5 p-4 border-b border-gray-800 text-gray-300 hover:bg-gray-800/30 transition">
              <div className="font-semibold text-white">#{user.rank}</div>
              <div className="flex items-center gap-2">
                {user.profilePicture && (
                  <img 
                    src={user.profilePicture} 
                    alt={user.username}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <span className="font-medium">{user.username || user.email.split("@")[0]}</span>
              </div>
              <div>${user.cash.toFixed(2)}</div>
              <div>${user.portfolio.toFixed(2)}</div>
              <div className="font-semibold text-green-400">${user.totalBalance.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
