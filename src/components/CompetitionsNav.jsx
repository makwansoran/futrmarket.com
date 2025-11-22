import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiUrl } from "/src/api.js";

// Helper to convert relative URLs to absolute
const getImageUrl = (url) => {
  if (!url) return null;
  // If it's already an absolute URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If it's a Supabase Storage URL, return as is
  if (url.includes('supabase.co') || url.includes('supabase')) {
    return url;
  }
  // If it's a relative path, make it absolute
  if (url.startsWith('/')) {
    const apiBase = getApiUrl('');
    return apiBase + url;
  }
  return url;
};

export default function CompetitionsNav() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Only show on sports page (including /markets/sports and /markets/sports/:competitionSlug)
  const isSportsPage = location.pathname.startsWith("/markets/sports");
  
  // VERSION MARKER: If you see this log, you're running the NEW code (v2.0)
  console.log("🔵 CompetitionsNav v2.0: isSportsPage =", isSportsPage, "pathname =", location.pathname);
  
  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const apiUrl = getApiUrl("/api/competitions");
        console.log("🔵 CompetitionsNav: Fetching competitions from:", apiUrl);
        const res = await fetch(apiUrl);
        console.log("🔵 CompetitionsNav: Response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          console.log("🔵 CompetitionsNav: Competitions data:", data);
          if (data.ok && Array.isArray(data.data)) {
            console.log("🔵 CompetitionsNav: Found", data.data.length, "competitions");
            // Filter out any null/undefined entries and ensure we have valid competitions
            const validCompetitions = data.data.filter(c => c && c.id && c.name);
            console.log("🔵 CompetitionsNav: Valid competitions:", validCompetitions.length);
            // Log each competition's imageUrl for debugging
            validCompetitions.forEach(c => {
              console.log(`🔵 CompetitionsNav: Competition "${c.name}": imageUrl =`, c.imageUrl, "type:", typeof c.imageUrl);
            });
            setCompetitions(validCompetitions);
            console.log("🔵 CompetitionsNav: Set competitions state, will render navbar with", validCompetitions.length, "competitions (navbar will ALWAYS show 'All Sports' button)");
          } else {
            console.warn("🔵 CompetitionsNav: Invalid data format:", data);
            setCompetitions([]);
          }
        } else {
          console.error("🔵 CompetitionsNav: Failed to fetch competitions, status:", res.status);
          setCompetitions([]);
        }
      } catch (error) {
        console.error("🔵 CompetitionsNav: Failed to load competitions:", error);
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    }
    // Only fetch if we're on a sports page
    if (isSportsPage) {
      console.log("🔵 CompetitionsNav: Fetching competitions because we're on sports page");
      fetchCompetitions();
    } else {
      console.log("🔵 CompetitionsNav: Not on sports page, resetting");
      // Reset competitions when not on sports page
      setCompetitions([]);
      setLoading(false);
    }
  }, [isSportsPage]);

  // ALWAYS render on sports pages - NO EARLY RETURNS
  if (!isSportsPage) {
    console.log("🔵 CompetitionsNav: Not rendering because not on sports page. pathname =", location.pathname);
    return null;
  }
  
  // FORCE RENDER - This log proves new code is running
  console.log("🔵 CompetitionsNav v2.0: Rendering navbar, loading =", loading, "competitions.length =", competitions.length, "isSportsPage =", isSportsPage);
  console.error("🔴🔴🔴 NEW CODE RUNNING - If you see this, cache is cleared! 🔴🔴🔴");

  if (loading) {
    console.log("🔵 CompetitionsNav: Showing loading state");
    return (
      <nav id="competitions-nav" className="sticky z-10 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50" style={{ display: 'block', visibility: 'visible', top: '152px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <div className="text-gray-400 text-sm">Loading competitions...</div>
          </div>
        </div>
      </nav>
    );
  }
  
  console.log("🔵 CompetitionsNav: Not loading, competitions.length =", competitions.length);
  console.log("🔵 CompetitionsNav: About to render navbar - will show 'All Sports' button +", competitions.length, "competitions");
  console.log("🔵 CompetitionsNav: FORCE RENDER - This navbar MUST always render on sports pages, even with 0 competitions");

  const handleCompetitionClick = (competition) => {
    // Navigate to sports page filtered by competition
    // Ensure slug exists, or generate one from name
    const slug = competition.slug || competition.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // Don't encode the slug - React Router handles it
    const targetPath = `/markets/sports/${slug}`;
    console.log("🔵 CompetitionsNav: Navigating to competition:", { name: competition.name, slug, id: competition.id, targetPath });
    
    // Use navigate with replace: false to ensure proper routing
    navigate(targetPath);
  };

  // Calculate top position dynamically:
  // - Header: 56px (top-14)
  // - CategoryNav: ~42px height, starts at 56px
  // - SubjectsNav: ~42px height, starts at 98px (56px + 42px)
  // - CompetitionsNav: starts at 140px (56px + 42px + 42px) when SubjectsNav is visible
  //   OR starts at 98px (56px + 42px) when SubjectsNav is NOT visible
  // For now, always use 140px to account for SubjectsNav being present
  const topPosition = "140px"; // Below SubjectsNav (which is below CategoryNav)
  
  console.log("🔵 CompetitionsNav: RENDERING NAVBAR NOW - competitions.length =", competitions.length, "isSportsPage =", isSportsPage);
  console.log("🔵 CompetitionsNav: NAVBAR WILL RENDER - NO EARLY RETURNS AFTER THIS POINT");
  console.error("🔴 FORCE VISIBLE - CompetitionsNav is rendering NOW with", competitions.length, "competitions");
  
  // CRITICAL: This navbar MUST always render on sports pages, even with 0 competitions
  // The "All Sports" button should always be visible
  return (
    <nav 
      className="sticky z-10 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50" 
      style={{ 
        display: 'block !important', 
        visibility: 'visible !important', 
        minHeight: '60px',
        position: 'sticky',
        top: '152px',
        zIndex: 10,
        backgroundColor: 'rgba(3, 7, 18, 0.95)',
        width: '100%',
        opacity: 1
      }}
      data-testid="competitions-navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3" style={{ minHeight: '60px', display: 'flex', alignItems: 'center' }}>
        <div 
          className="flex items-center justify-center gap-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', width: '100%' }}
        >
          {/* Add "All Sports" button to show all sports bets */}
          <button
            onClick={() => navigate("/markets/sports")}
            className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg transition-colors flex-shrink-0 group ${
              !location.pathname.includes("/markets/sports/") || location.pathname === "/markets/sports"
                ? "bg-blue-500/20 border-2 border-blue-500"
                : "hover:bg-gray-800/50"
            }`}
            title="All Sports"
            style={{ minWidth: '80px' }}
          >
            <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center" style={{ display: 'flex' }}>
              <span className="text-gray-300 text-xs font-semibold">ALL</span>
            </div>
            <span className={`text-xs text-center whitespace-nowrap ${
              !location.pathname.includes("/markets/sports/") || location.pathname === "/markets/sports"
                ? "text-white font-semibold"
                : "text-gray-400 group-hover:text-white"
            }`}>
              All Sports
            </span>
          </button>
          {competitions.map((competition) => {
            // Ensure slug exists, or generate one from name (for old competitions)
            const slug = competition.slug || competition.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const isActive = location.pathname === `/markets/sports/${slug}`;
            console.log("🔵 CompetitionsNav: Competition:", { 
              id: competition.id,
              name: competition.name, 
              slug, 
              imageUrl: competition.imageUrl,
              isActive, 
              pathname: location.pathname 
            });
            const imageUrl = competition.imageUrl || competition.image_url;
            const fullImageUrl = imageUrl ? getImageUrl(imageUrl) : null;
            console.log(`🔵 CompetitionsNav: Rendering "${competition.name}":`, {
              imageUrl: imageUrl,
              fullImageUrl: fullImageUrl,
              hasImage: !!imageUrl
            });
            
            return (
            <button
              key={competition.id}
              onClick={() => handleCompetitionClick(competition)}
              className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg transition-colors flex-shrink-0 group ${
                isActive
                  ? "bg-blue-500/20 border-2 border-blue-500"
                  : "hover:bg-gray-800/50"
              }`}
              title={competition.name}
            >
              {fullImageUrl ? (
                <img
                  src={fullImageUrl}
                  alt={competition.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-colors"
                  style={{ width: '48px', height: '48px', display: 'block', objectFit: 'cover' }}
                  onError={(e) => {
                    console.error("🔴 CompetitionsNav: Image failed to load:", {
                      original: imageUrl,
                      full: fullImageUrl,
                      competition: competition.name
                    });
                    // Show fallback instead
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log("✅ CompetitionsNav: Image loaded successfully:", fullImageUrl);
                  }}
                />
              ) : null}
              {!fullImageUrl && (
                <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center" style={{ width: '48px', height: '48px' }}>
                  <span className="text-gray-400 text-xs font-semibold">
                    {competition.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className={`text-xs text-center whitespace-nowrap transition-colors ${
                isActive
                  ? "text-white font-semibold"
                  : "text-gray-400 group-hover:text-white"
              }`}>
                {competition.name}
              </span>
            </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

