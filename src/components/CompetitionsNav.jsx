import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiUrl } from "/src/api.js";

export default function CompetitionsNav() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const res = await fetch(getApiUrl("/api/competitions"));
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.data)) {
            setCompetitions(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to load competitions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCompetitions();
  }, []);

  // Only show on sports page
  if (!location.pathname.startsWith("/markets/sports")) {
    return null;
  }

  if (loading) {
    return (
      <nav className="sticky top-[105px] z-9 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <div className="text-gray-400 text-sm">Loading competitions...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (competitions.length === 0) {
    return null;
  }

  const handleCompetitionClick = (competition) => {
    // Navigate to sports page filtered by competition
    navigate(`/markets/sports/${competition.slug}`);
  };

  return (
    <nav className="sticky top-[105px] z-9 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div 
          className="flex items-center justify-center gap-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {competitions.map((competition) => (
            <button
              key={competition.id}
              onClick={() => handleCompetitionClick(competition)}
              className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-gray-800/50 transition-colors flex-shrink-0 group"
              title={competition.name}
            >
              {competition.imageUrl ? (
                <img
                  src={competition.imageUrl}
                  alt={competition.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-colors"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                  <span className="text-gray-400 text-xs font-semibold">
                    {competition.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-400 group-hover:text-white transition-colors text-center whitespace-nowrap">
                {competition.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

