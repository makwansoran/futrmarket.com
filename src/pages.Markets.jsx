import React from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { Clock, TrendingUp } from "lucide-react";
import { getApiUrl } from "/src/api.js";
import FeatureCarousel from "./components/FeatureCarousel.jsx";

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
  // If it's a relative path starting with /uploads, use it directly (server serves it)
  if (url.startsWith('/uploads/')) {
    return url;
  }
  // If it's a relative path, make it absolute
  if (url.startsWith('/')) {
    const apiBase = getApiUrl('');
    return apiBase + url;
  }
  // If it doesn't start with /, assume it's a filename and prepend /uploads/
  if (!url.includes('/')) {
    return '/uploads/' + url;
  }
  return url;
};

// Small Market Card (for grid)
function MarketCard({ m }){
  const getStatusBadge = () => {
    if (!m.status || m.category !== "Sports") return null;
    const statusConfig = {
      live: { bg: "bg-red-500", text: "LIVE", pulse: true },
      upcoming: { bg: "bg-white", text: "UPCOMING", textColor: "text-black" },
      finished: { bg: "bg-black", text: "FINISHED" },
      cancelled: { bg: "bg-gray-500", text: "CANCELLED" }
    };
    const config = statusConfig[m.status];
    if (!config) return null;
    
    return (
      <div className={`absolute top-2 right-2 px-2 py-0.5 ${config.bg} ${config.textColor || "text-white"} rounded text-[10px] font-bold uppercase tracking-wide z-10 flex items-center gap-1`}>
        {config.pulse && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
        {config.text}
      </div>
    );
  };
  
  // Ensure m and m.id are valid
  if (!m || !m.id || typeof m.id !== 'string') {
    return null;
  }
  
  // Get image URL - check image_url FIRST since that's what API returns
  const rawImageUrl = m.image_url || m.imageUrl || m.image;
  const imageUrl = rawImageUrl ? getImageUrl(rawImageUrl) : null;
  
  return (
    <Link to={`/market/${encodeURIComponent(m.id)}`} className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden hover:border-[var(--border-secondary)] transition block h-full relative min-h-[140px]">
      {getStatusBadge()}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Square profile picture at start - extra small */}
          <div 
            className="flex-shrink-0"
            style={{ 
              width: '44px', 
              height: '44px', 
              minWidth: '44px', 
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: imageUrl ? 'transparent' : '#4b5563',
              border: imageUrl ? 'none' : '1.5px solid #6b7280',
              borderRadius: '4px',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={m.question}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'block',
                  objectFit: 'cover',
                  borderRadius: '2px'
                }}
                onError={(e) => {
                  console.error("❌ Image failed to load:", imageUrl);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log("✅ Image loaded:", imageUrl);
                }}
              />
            ) : (
              <span style={{ color: '#d1d5db', fontSize: '10px', fontWeight: 'bold', userSelect: 'none', lineHeight: '1' }}>?</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">{m.category || "General"}</span>
              {m.ends && (
                <span className="text-gray-500 text-xs flex items-center gap-1"><Clock size={12}/>{m.ends}</span>
              )}
            </div>
            <div className="text-white font-semibold text-sm md:text-base mt-2 line-clamp-2 leading-snug">{m.question}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-md p-2.5">
            <div className="text-green-400 text-xs font-medium">YES</div>
            <div className="text-lg font-bold text-white">{Math.round((m.yesPrice||0.5)*100)}¢</div>
          </div>
          <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-md p-2.5">
            <div className="text-red-400 text-xs font-medium">NO</div>
            <div className="text-lg font-bold text-white">{Math.round((m.noPrice||0.5)*100)}¢</div>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-3 flex justify-between">
          <span>{m.volume || "$0"} volume</span>
          <span>{m.traders || 0} traders</span>
        </div>
      </div>
    </Link>
  );
}


// Mini Chart Component for Featured Card
function MiniChart({ data }) {
  const chartHeight = 80;
  const chartWidth = 100;
  const padding = { top: 5, right: 5, bottom: 15, left: 30 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  if (!data || data.length === 0) return null;

  const normalizedData = data.map(d => ({
    ...d,
    yesCents: d.yesPrice * 100,
    noCents: d.noPrice * 100
  }));

  const minPrice = 0;
  const maxPrice = 100;
  const priceRange = maxPrice - minPrice;

  const points = normalizedData.map((d, i) => {
    const x = padding.left + (i / (normalizedData.length - 1)) * innerWidth;
    const yesY = padding.top + innerHeight - ((d.yesCents - minPrice) / priceRange) * innerHeight;
    const noY = padding.top + innerHeight - ((d.noCents - minPrice) / priceRange) * innerHeight;
    return { x, yesY, noY, ...d };
  });

  const yesPath = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.yesY}`;
    return `${path} L ${point.x} ${point.yesY}`;
  }, "");

  const noPath = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.noY}`;
    return `${path} L ${point.x} ${point.noY}`;
  }, "");

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-20" preserveAspectRatio="none">
      {/* YES line */}
      <path d={yesPath} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* NO line */}
      <path d={noPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CATEGORY_MAP = {
  "politics": "Politics",
  "culture": "Culture",
  "crypto": "Crypto",
  "climate": "Climate",
  "economics": "Economics",
  "mentions": "Mentions",
  "companies": "Companies",
  "financials": "Financials",
  "tech-science": "Tech & Science",
  "health": "Health",
  "world": "World",
};

export default function MarketsPage({ markets=[], limit, category }){
  const params = useParams();
  const location = useLocation();
  
  // Check if we're on a competition-specific sports page
  const competitionSlug = params.competitionSlug; // For /markets/sports/:competitionSlug
  const isCompetitionPage = !!competitionSlug;
  
  // Check if we're on a subject page
  const subjectSlug = params.subjectSlug; // For /subjects/:subjectSlug
  const isSubjectPage = !!subjectSlug;
  
  // Determine category:
  // 1. If we have competitionSlug, we're on /markets/sports/:competitionSlug, so category is "sports"
  // 2. If category prop is "sports", use it
  // 3. Otherwise use params.category
  const urlCategory = isCompetitionPage ? "sports" : (category || params.category);
  
  // State for competitions (to map slug to competitionId)
  const [competitions, setCompetitions] = React.useState([]);
  const [competitionsLoaded, setCompetitionsLoaded] = React.useState(false);
  
  // State for subjects (to map slug to subjectId)
  const [subjects, setSubjects] = React.useState([]);
  const [subjectsLoaded, setSubjectsLoaded] = React.useState(false);
  
  // State for features (for homepage feature cards)
  const [features, setFeatures] = React.useState([]);
  
  // Load competitions if we're on a sports page
  React.useEffect(() => {
    const isSportsPage = urlCategory === "sports" || competitionSlug || location.pathname.startsWith("/markets/sports");
    console.log("🔵 MarketsPage: Should load competitions?", isSportsPage);
    
    if (isSportsPage) {
      console.log("🔵 MarketsPage: Fetching competitions...");
      fetch(getApiUrl("/api/competitions"))
        .then(r => {
          console.log("🔵 MarketsPage: Competitions API response status:", r.status);
          return r.json();
        })
        .then(j => {
          console.log("🔵 MarketsPage: Competitions API response:", j);
          if (j.ok && Array.isArray(j.data)) {
            console.log("🔵 MarketsPage: Loaded", j.data.length, "competitions:", j.data.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
            setCompetitions(j.data);
            setCompetitionsLoaded(true);
          } else {
            console.warn("🔵 MarketsPage: Invalid competitions response:", j);
          }
        })
        .catch(e => {
          console.error("🔵 MarketsPage: Failed to load competitions:", e);
        });
    }
  }, [urlCategory, competitionSlug, location.pathname]);
  
  // Load subjects if we're on a subject page OR on homepage (to link to feature cards)
  React.useEffect(() => {
    const isHomepage = limit === true || location.pathname === "/";
    if (isSubjectPage || isHomepage) {
      fetch(getApiUrl("/api/subjects"))
        .then(r => r.json())
        .then(j => {
          if (j.ok && Array.isArray(j.data)) {
            setSubjects(j.data);
            setSubjectsLoaded(true);
          }
        })
        .catch(e => {
          console.error("Failed to load subjects:", e);
        });
    }
  }, [isSubjectPage, limit, location.pathname]);
  
  // Load features if we're on the homepage (limit is true)
  React.useEffect(() => {
    console.log("🔵 Features useEffect - limit:", limit, "location:", location.pathname);
    // Check if we're on homepage - either limit is true OR we're on the root path
    const isHomepage = limit === true || location.pathname === "/";
    if (isHomepage) {
      const apiUrl = getApiUrl("/api/features?active=true");
      console.log("🔵 Loading features from:", apiUrl);
      fetch(apiUrl)
        .then(r => {
          console.log("🔵 Features API response status:", r.status);
          return r.json();
        })
        .then(j => {
          console.log("🔵 Features API response:", j);
          if (j.ok && Array.isArray(j.data)) {
            console.log("🔵 Loaded", j.data.length, "features:", j.data);
            // Log image URLs for debugging
            j.data.forEach((f, idx) => {
              console.log(`🔵 Feature ${idx + 1} (${f.title}): imageUrl =`, f.imageUrl);
            });
            // Only update if features actually changed (prevent unnecessary re-renders)
            setFeatures(prev => {
              const prevIds = prev.map(f => f.id).sort().join(',');
              const newIds = j.data.map(f => f.id).sort().join(',');
              if (prevIds !== newIds) {
                console.log("🔵 Features changed, updating:", { prevIds, newIds });
                return j.data;
              }
              console.log("🔵 Features unchanged, keeping previous");
              return prev;
            });
          } else {
            console.warn("🔵 Features response not ok or not array:", j);
          }
        })
        .catch(e => {
          console.error("❌ Failed to load features:", e);
        });
    } else {
      console.log("🔵 Not homepage, skipping features load");
    }
  }, [limit, location.pathname]);
  
  // Ensure markets is always an array
  const safeMarkets = Array.isArray(markets) ? markets : [];
  
  // Check if we're on the homepage
  const isHomepage = limit === true || location.pathname === "/";
  
  let filteredMarkets = safeMarkets;
  
  // On homepage, show all contracts (not just live ones)
  // The category section will filter appropriately
  if (isHomepage) {
    // Only exclude resolved contracts, show all others
    filteredMarkets = safeMarkets.filter(m => {
      if (!m || !m.id) return false;
      if (m.resolution) return false; // Exclude resolved contracts
      return true; // Show all non-resolved contracts
    });
    console.log("🔵 MarketsPage: Homepage - showing", filteredMarkets.length, "contracts (excluding resolved)");
    console.log("🔵 MarketsPage: Contracts by category:", 
      filteredMarkets.reduce((acc, m) => {
        const cat = m.category || "Unknown";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {})
    );
  }
  
  // Filter by subject if we're on a subject page
  if (isSubjectPage && subjectsLoaded) {
    const subject = subjects.find(s => s.slug === subjectSlug);
    if (subject) {
      filteredMarkets = safeMarkets.filter(m => m && m.subjectId === subject.id);
    } else {
      filteredMarkets = [];
    }
  }
  // Filter by category if specified (but NOT for sports - we handle sports separately)
  else if (urlCategory && urlCategory !== "all" && urlCategory !== "trending" && urlCategory !== "new" && urlCategory !== "sports") {
    const categoryName = CATEGORY_MAP[urlCategory] || urlCategory;
    filteredMarkets = safeMarkets.filter(m => 
      m && (m.category || "").toLowerCase() === categoryName.toLowerCase()
    );
    console.log("🔵 MarketsPage: Filtered by category", categoryName, "to", filteredMarkets.length, "markets");
  } else if (urlCategory === "trending") {
    // Sort by volume or traders for trending
    filteredMarkets = [...safeMarkets].sort((a, b) => {
      const aVol = parseFloat((a.volume || "$0").replace("$", "").replace(",", "")) || 0;
      const bVol = parseFloat((b.volume || "$0").replace("$", "").replace(",", "")) || 0;
      return bVol - aVol;
    });
  } else if (urlCategory === "new") {
    // Sort by creation date for new
    filteredMarkets = [...safeMarkets].sort((a, b) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      return bTime - aTime;
    });
  }
  
  const list = limit ? filteredMarkets.slice(0, limit) : filteredMarkets;
  
  const getTitle = () => {
    if (isSubjectPage && subjectsLoaded) {
      const subject = subjects.find(s => s.slug === subjectSlug);
      return subject ? `${subject.name} Markets` : "Subject Markets";
    }
    if (urlCategory === "trending") return "Trending Markets";
    if (urlCategory === "new") return "New Markets";
    if (urlCategory && CATEGORY_MAP[urlCategory]) return CATEGORY_MAP[urlCategory] + " Markets";
    return "All Markets";
  };
  
  // For sports category, group by status
  // Also filter by competition if competitionSlug is provided
  // IMPORTANT: Sports bets should appear on BOTH /markets/sports (all sports) AND /markets/sports/:competitionSlug (specific competition)
  if (urlCategory === "sports" || competitionSlug) {
    console.log("🔵 MarketsPage: Processing sports page, urlCategory:", urlCategory, "competitionSlug:", competitionSlug);
    console.log("🔵 MarketsPage: List before sports filter:", list.length);
    
    // Start with ALL sports bets from safeMarkets (not filtered list, which might be empty)
    let sportsMarkets = safeMarkets.filter(m => m && (m.category || "").toLowerCase() === "sports");
    console.log("🔵 MarketsPage: All sports markets found:", sportsMarkets.length);
    
    // Only filter by competition if we're on a specific competition page (competitionSlug exists)
    // If we're on /markets/sports (no competitionSlug), show ALL sports bets
    if (competitionSlug) {
      console.log("🔵 MarketsPage: Filtering by competition slug:", competitionSlug);
      console.log("🔵 MarketsPage: Competitions loaded?", competitionsLoaded, "Count:", competitions.length);
      console.log("🔵 MarketsPage: Available competitions:", competitions.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
      console.log("🔵 MarketsPage: All markets count:", list.length);
      console.log("🔵 MarketsPage: Sports markets before filter:", list.filter(m => m && m.category === "Sports").length);
      
      if (competitions.length === 0) {
        console.warn("🔵 MarketsPage: No competitions loaded yet, waiting...");
        // Return loading state or wait for competitions
        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="text-center text-gray-400">Loading competitions...</div>
          </section>
        );
      }
      
      const competition = competitions.find(c => {
        // Match by slug (case-insensitive)
        const slugMatch = c.slug && c.slug.toLowerCase() === competitionSlug.toLowerCase();
        // Also try matching by name as fallback (for old competitions without slugs)
        const nameMatch = c.name && c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === competitionSlug.toLowerCase();
        const found = slugMatch || nameMatch;
        if (found) {
          console.log("🔵 MarketsPage: Matched competition:", c);
        }
        return found;
      });
      
      if (competition) {
        console.log("🔵 MarketsPage: Found competition:", competition);
        console.log("🔵 MarketsPage: Competition ID:", competition.id);
        // Filter to show only bets for this specific competition
        // Use sportsMarkets which already contains all sports bets
        console.log("🔵 MarketsPage: All sports bets before competition filter:", sportsMarkets.map(m => ({ id: m.id, question: m.question, competitionId: m.competitionId })));
        
        sportsMarkets = sportsMarkets.filter(m => {
          const matches = m && m.competitionId === competition.id;
          if (matches) {
            console.log("🔵 MarketsPage: Match found:", m.id, m.question, "competitionId:", m.competitionId);
          }
          return matches;
        });
        console.log("🔵 MarketsPage: Filtered to", sportsMarkets.length, "bets for competition", competition.name);
      } else {
        console.warn("🔵 MarketsPage: Competition not found for slug:", competitionSlug);
        console.warn("🔵 MarketsPage: Tried to match against:", competitions.map(c => ({ slug: c.slug, name: c.name })));
        // Competition not found, show empty
        sportsMarkets = [];
      }
    } else {
      console.log("🔵 MarketsPage: No competitionSlug, showing ALL sports bets");
    }
    // If no competitionSlug, sportsMarkets = list (all sports bets) - this is correct!
    
    const liveMatches = sportsMarkets.filter(m => m.status === "live");
    const upcomingMatches = sportsMarkets.filter(m => m.status === "upcoming" || (!m.status && m.category === "Sports"));
    const finishedMatches = sportsMarkets.filter(m => m.status === "finished");
    const cancelledMatches = sportsMarkets.filter(m => m.status === "cancelled");
    
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Live Matches Section */}
        {liveMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-8 bg-red-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">Live Matches</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm font-semibold">LIVE</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {liveMatches.filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          </div>
        )}
        
        {/* Upcoming Matches Section - Show if no live matches or if there are upcoming matches */}
        {upcomingMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-8 bg-white rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">Upcoming Matches</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {upcomingMatches.filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          </div>
        )}
        
        {/* Finished Matches Section */}
        {finishedMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-8 bg-gray-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">Finished Matches</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {finishedMatches.filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          </div>
        )}
        
        {/* Cancelled Matches Section */}
        {cancelledMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-8 bg-gray-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">Cancelled Matches</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cancelledMatches.filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          </div>
        )}
        
        {/* No matches message */}
        {liveMatches.length === 0 && upcomingMatches.length === 0 && finishedMatches.length === 0 && cancelledMatches.length === 0 && (
          <div className="text-gray-400 col-span-full text-center py-12">
            <p className="text-lg">No sports matches found.</p>
          </div>
        )}
      </section>
    );
  }
  
  // All contracts are now standard sized - no featured contracts
  // On homepage, exclude contracts that are already shown in category sections
  let allMarkets = list.filter(m => m && m.id);
  
  if (isHomepage) {
    // Get all contract IDs that are displayed in category sections
    const categoryContractIds = new Set();
    // This will be populated by the category section logic below
    // For now, we'll filter out any duplicates by ID
    const seenIds = new Set();
    allMarkets = allMarkets.filter(m => {
      const id = String(m.id || "").trim().toLowerCase();
      if (seenIds.has(id)) {
        console.warn("🔴 [HOMEPAGE] Removing duplicate from allMarkets:", m.id);
        return false;
      }
      seenIds.add(id);
      return true;
    });
  }
  
  // Debug logging for features
  console.log("🔵 MarketsPage render - limit:", limit, "pathname:", location.pathname, "isHomepage:", isHomepage, "features.length:", features.length);
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {!limit && urlCategory !== "sports" && <h2 className="text-2xl font-bold text-white mb-6">{getTitle()}</h2>}
      
      {/* Feature Carousel - Large Kalshi-style cards with slideshow */}
      {isHomepage && features.length > 0 && (
        <FeatureCarousel 
          key={`carousel-${isHomepage ? 'home' : 'other'}-${features.length}`} 
          features={features}
          subjects={subjectsLoaded ? subjects : []}
        />
      )}
      
      {/* Small feature cards below carousel dots, above contracts */}
      {isHomepage && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto -mt-16 justify-center ml-8">
          {/* Grow portfolio */}
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-blue-400 font-semibold text-sm mb-1">Grow your entire portfolio</div>
              <div className="text-white text-xs">Trade on the election, Sports, Bitcoin, and more</div>
            </div>
          </div>

          {/* Fund account */}
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="text-blue-400 font-semibold text-sm mb-1">Fund your account freely</div>
              <div className="text-white text-xs">Bank transfer, debit card, crypto, or wire</div>
            </div>
          </div>

          {/* Security features */}
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-blue-400 font-semibold text-sm mb-1">End-to-end encrypted accounts</div>
              <div className="text-white text-xs">Real-time fraud monitoring</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contracts by Category Section - Only on homepage */}
      {isHomepage && (() => {
        // Define allowed categories - only these will be displayed
        const allowedCategories = [
          { name: "Politics", slug: "politics" },
          { name: "Crypto", slug: "crypto" },
          { name: "Climate", slug: "climate" },
          { name: "Economics", slug: "economics" },
          { name: "Sports", slug: "sports" },
          { name: "Mentions", slug: "mentions" },
          { name: "Companies", slug: "companies" },
          { name: "Financials", slug: "financials" },
          { name: "Tech & Science", slug: "tech-science" }
        ];
        
        // COMPLETELY REWRITTEN DUPLICATE PREVENTION
        // Use a Map to track what we've displayed - key is normalized question, value is contract
        const displayedContracts = new Map(); // key: normalized question, value: contract object
        
        // First pass: Build a completely deduplicated list
        // We'll use question as the primary key since that's what users see
        const deduplicatedMarkets = [];
        const seenByQuestion = new Map();
        const seenById = new Set();
        
        for (const m of filteredMarkets) {
          if (!m || !m.id) continue;
          if (m.resolution) continue; // Skip resolved
          
          const normalizedId = String(m.id).trim().toLowerCase();
          const normalizedQuestion = String(m.question || "").trim().toLowerCase().replace(/\s+/g, ' '); // Normalize whitespace
          
          // Skip if we've seen this ID
          if (seenById.has(normalizedId)) {
            console.warn("🔴 [CATEGORIES] Skipping duplicate ID:", m.id);
            continue;
          }
          
          // Skip if we've seen this question (even with different ID)
          if (normalizedQuestion && seenByQuestion.has(normalizedQuestion)) {
            const existing = seenByQuestion.get(normalizedQuestion);
            console.warn("🔴 [CATEGORIES] Skipping duplicate question:", m.question, "Existing ID:", existing.id, "New ID:", m.id);
            continue;
          }
          
          seenById.add(normalizedId);
          if (normalizedQuestion) {
            seenByQuestion.set(normalizedQuestion, m);
          }
          deduplicatedMarkets.push(m);
        }
        
        console.log("🔵 [CATEGORIES] Deduplicated from", filteredMarkets.length, "to", deduplicatedMarkets.length, "unique contracts");
        
        // Build category sections
        const categorySections = [];
        const globalDisplayedIds = new Set(); // Track ALL displayed contract IDs globally
        
        for (const category of allowedCategories) {
          const categoryContracts = [];
          const categoryIds = new Set(); // Track IDs in THIS category to prevent duplicates
          
          for (const m of deduplicatedMarkets) {
            // Check if this contract matches the category
            const categoryMatch = m.category && m.category.toLowerCase() === category.name.toLowerCase();
            if (!categoryMatch) continue;
            
            // Use ID as the absolute key - if we've seen this ID, skip it
            const contractId = String(m.id || "").trim().toLowerCase();
            
            // CRITICAL: If this ID has been displayed ANYWHERE globally, skip it
            if (globalDisplayedIds.has(contractId)) {
              console.error("🔴 [CATEGORIES] Contract ID already displayed globally:", m.id, m.question);
              continue;
            }
            
            // CRITICAL: If this ID is already in THIS category, skip it (shouldn't happen, but safety)
            if (categoryIds.has(contractId)) {
              console.error("🔴 [CATEGORIES] Contract ID already in this category:", category.name, m.id, m.question);
              continue;
            }
            
            // Add to category
            categoryContracts.push(m);
            categoryIds.add(contractId); // Mark in this category
            globalDisplayedIds.add(contractId); // Mark globally
            
            console.log(`✅ [CATEGORIES] Added to ${category.name}:`, m.id, m.question);
            
            // Stop at 4 contracts per category
            if (categoryContracts.length >= 4) break;
          }
          
          console.log(`🔵 [CATEGORIES] ${category.name}: ${categoryContracts.length} contracts`);
          
          if (categoryContracts.length > 0) {
            categorySections.push({ category, contracts: categoryContracts });
          }
        }
        
        return (
          <div className="mb-12 mt-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Explore Markets by Category</h2>
            {categorySections.map(({ category, contracts }) => {
              // ABSOLUTE FINAL CHECK: Use Set to ensure no duplicates by ID
              const finalContractsMap = new Map(); // key: contract ID, value: contract
              
              for (const contract of contracts) {
                const contractId = String(contract.id || "").trim().toLowerCase();
                // Only add if we haven't seen this ID
                if (!finalContractsMap.has(contractId)) {
                  finalContractsMap.set(contractId, contract);
                } else {
                  console.error("🔴 [CATEGORIES] FINAL CHECK: Duplicate ID found:", contract.id, contract.question);
                }
              }
              
              // Convert Map values to array - this guarantees no duplicates
              const finalContracts = Array.from(finalContractsMap.values());
              
              console.log(`🔵 [CATEGORIES] ${category.name}: ${contracts.length} contracts -> ${finalContracts.length} unique after final check`);
              
              return (
                <div key={category.slug} className="mb-12">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                    <Link 
                      to={`/markets/${category.slug}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {finalContracts.map((m) => {
                      // Use contract ID as key - this is the absolute unique identifier
                      return <MarketCard key={`${category.slug}-${m.id}`} m={m} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      
      {/* Fallback feature cards if no features from database - REMOVED, only show database features */}
      {isHomepage && features.length === 0 && false && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const content = feature.url ? (
              <a 
                key={feature.id}
                href={feature.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 hover:border-[var(--border-secondary)] transition"
              >
                {feature.imageUrl && (
                  <img 
                    src={feature.imageUrl} 
                    alt={feature.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="text-blue-400 font-semibold text-sm mb-1">{feature.title}</div>
                <div className="text-white text-xs">{feature.description}</div>
              </a>
            ) : (
              <div key={feature.id} className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
                {feature.imageUrl && (
                  <img 
                    src={feature.imageUrl} 
                    alt={feature.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="text-blue-400 font-semibold text-sm mb-1">{feature.title}</div>
                <div className="text-white text-xs">{feature.description}</div>
              </div>
            );
            return content;
          })}
        </div>
      )}
      
      {/* Fallback feature cards removed - only show database features */}
      {false && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Grow portfolio */}
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-blue-400 font-semibold text-sm mb-1">Grow your entire portfolio</div>
              <div className="text-white text-xs">Trade on the election, Sports, Bitcoin, and more</div>
            </div>
          </div>

          {/* Fund account */}
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="text-blue-400 font-semibold text-sm mb-1">Fund your account freely</div>
              <div className="text-white text-xs">Bank transfer, debit card, crypto, or wire</div>
            </div>
          </div>
        </div>
      )}
      
      {/* On homepage, don't show allMarkets section - categories already show them */}
      {!isHomepage && (
        <>
          {allMarkets.length === 0 ? (
            <div className="text-gray-400 col-span-full text-center py-8">No markets found in this category.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allMarkets.map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          )}
        </>
      )}
    </section>
  );
}
