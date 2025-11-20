import React from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { Clock, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getApiUrl } from "/src/api.js";

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
  
  return (
    <Link to={`/market/${encodeURIComponent(m.id)}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition block h-full relative">
      {getStatusBadge()}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">{m.category || "General"}</span>
            {m.ends && (
              <span className="text-gray-500 text-xs flex items-center gap-1"><Clock size={12}/>{m.ends}</span>
            )}
          </div>
          <div className="text-white font-semibold text-sm mt-2 line-clamp-2">{m.question}</div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-md p-2">
              <div className="text-green-400 text-xs">YES</div>
              <div className="text-lg font-bold text-white">{Math.round((m.yesPrice||0.5)*100)}¢</div>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-md p-2">
              <div className="text-red-400 text-xs">NO</div>
              <div className="text-lg font-bold text-white">{Math.round((m.noPrice||0.5)*100)}¢</div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2 flex justify-between">
            <span>{m.volume || "$0"} volume</span>
            <span>{m.traders || 0} traders</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Helper function to wrap index for circular navigation
function wrap(min, max, value) {
  const range = max - min + 1;
  return min + (((value - min) % range) + range) % range;
}

// Featured Contracts Slideshow Component
function FeaturedContractsSlideshow({ contracts = [] }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);

  // Filter only featured contracts
  const featuredContracts = contracts.filter(c => c && c.featured === true);
  
  // If no featured contracts, return null
  if (featuredContracts.length === 0) {
    return null;
  }

  // If only one featured contract, show it without navigation
  if (featuredContracts.length === 1) {
    return (
      <div className="mb-6">
        <FeaturedMarketCard m={featuredContracts[0]} markets={contracts} />
      </div>
    );
  }

  function setSlide(newDirection) {
    const nextIndex = wrap(0, featuredContracts.length - 1, selectedIndex + newDirection);
    setSelectedIndex(nextIndex);
    setDirection(newDirection);
  }

  const currentContract = featuredContracts[selectedIndex];

  return (
    <div className="mb-6 relative">
      <div className="flex items-center gap-4">
        {/* Previous Button */}
        <motion.button
          initial={false}
          animate={{ 
            backgroundColor: currentContract ? "#3b82f6" : "#6b7280",
            opacity: featuredContracts.length > 1 ? 1 : 0.5
          }}
          aria-label="Previous"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white z-10 outline-none focus:outline-2 focus:outline-blue-400 focus:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setSlide(-1)}
          disabled={featuredContracts.length <= 1}
          whileFocus={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={20} />
        </motion.button>

        {/* Slideshow Content */}
        <div className="flex-1 relative min-h-[400px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={selectedIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: {
                  delay: 0.1,
                  type: "spring",
                  duration: 0.3,
                  bounce: 0.4,
                },
              }}
              exit={{ opacity: 0, x: direction * -50 }}
            >
              <FeaturedMarketCard m={currentContract} markets={contracts} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Next Button */}
        <motion.button
          initial={false}
          animate={{ 
            backgroundColor: currentContract ? "#3b82f6" : "#6b7280",
            opacity: featuredContracts.length > 1 ? 1 : 0.5
          }}
          aria-label="Next"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white z-10 outline-none focus:outline-2 focus:outline-blue-400 focus:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setSlide(1)}
          disabled={featuredContracts.length <= 1}
          whileFocus={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Slide Indicators */}
      {featuredContracts.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {featuredContracts.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const newDirection = index > selectedIndex ? 1 : -1;
                setDirection(newDirection);
                setSelectedIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex 
                  ? "bg-blue-400 w-8" 
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Large Featured Market Card (like Kalshi)
function FeaturedMarketCard({ m, markets = [] }){
  const navigate = useNavigate();
  
  // Ensure m is valid
  if (!m || !m.id) {
    return null;
  }
  
  const yesPrice = Math.round((m.yesPrice||0.5)*100);
  const noPrice = Math.round((m.noPrice||0.5)*100);
  
  // Calculate potential returns
  const yesReturn = yesPrice > 0 ? (100 / yesPrice).toFixed(0) : 0;
  const noReturn = noPrice > 0 ? (100 / noPrice).toFixed(0) : 0;
  
  // Generate price history for chart
  const generatePriceHistory = () => {
    const days = 7;
    const history = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    let yesPrice = m.yesPrice || 0.5;
    let noPrice = m.noPrice || 0.5;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      yesPrice = Math.max(0.01, Math.min(0.99, yesPrice + (Math.random() - 0.5) * 0.05));
      noPrice = 1 - yesPrice;
      history.push({ date, yesPrice, noPrice });
    }
    return history;
  };

  const priceHistory = generatePriceHistory();
  
  // Find previous/next contracts for navigation
  const safeMarketsForNav = Array.isArray(markets) ? markets.filter(mkt => mkt && mkt.id) : [];
  const currentIndex = safeMarketsForNav.findIndex(mkt => mkt.id === m.id);
  const prevContract = currentIndex > 0 && safeMarketsForNav[currentIndex - 1] && safeMarketsForNav[currentIndex - 1].id ? safeMarketsForNav[currentIndex - 1] : null;
  const nextContract = currentIndex < safeMarketsForNav.length - 1 && safeMarketsForNav[currentIndex + 1] && safeMarketsForNav[currentIndex + 1].id ? safeMarketsForNav[currentIndex + 1] : null;
  
  // Format expiration date
  const formatExpiration = () => {
    if (!m.expirationDate) return null;
    const exp = new Date(m.expirationDate);
    const now = new Date();
    const diff = exp - now;
    if (diff < 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const timeRemaining = formatExpiration();
  
  return (
    <Link 
      to={`/market/${encodeURIComponent(m.id)}`}
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition block"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">{m.category || "General"}</span>
              {timeRemaining && (
                <span className="text-gray-400 text-sm">
                  Begins in {timeRemaining} {m.expirationDate && new Date(m.expirationDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{m.question}</h3>
          </div>
        </div>
        
        {/* Price Buttons and Chart Side by Side */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left: Price Buttons */}
          <div className="flex flex-col gap-4">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-green-500/10 border-2 border-green-500/50 rounded-lg p-4 hover:bg-green-500/20 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-semibold text-sm">YES</span>
                <span className="text-2xl font-bold text-white">{yesPrice}¢</span>
              </div>
              <div className="text-xs text-gray-400">
                $100 → ${yesReturn}
              </div>
            </div>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-red-500/10 border-2 border-red-500/50 rounded-lg p-4 hover:bg-red-500/20 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-400 font-semibold text-sm">NO</span>
                <span className="text-2xl font-bold text-white">{noPrice}¢</span>
              </div>
              <div className="text-xs text-gray-400">
                $100 → ${noReturn}
              </div>
            </div>
          </div>
          
          {/* Right: Chart */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">Price History</span>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-400">YES {yesPrice}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-gray-400">NO {noPrice}%</span>
                </div>
              </div>
            </div>
            <MiniChart data={priceHistory} />
          </div>
        </div>
        
        {/* Description */}
        {m.description && (
          <div className="bg-gray-800/30 rounded-lg p-3 mb-4">
            <p className="text-gray-300 text-sm line-clamp-2">{m.description}</p>
          </div>
        )}
        
        {/* Volume and Navigation */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            <span className="text-white font-semibold">{m.volume || "$0"}</span> volume
          </span>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {prevContract && prevContract.id && (
              <span 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (prevContract.id && typeof prevContract.id === 'string') {
                    navigate(`/market/${encodeURIComponent(prevContract.id)}`);
                  }
                }}
                className="hover:text-white transition cursor-pointer"
              >
                ← {(prevContract.question || '').substring(0, 20)}...
              </span>
            )}
            {nextContract && nextContract.id && (
              <span 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (nextContract.id && typeof nextContract.id === 'string') {
                    navigate(`/market/${encodeURIComponent(nextContract.id)}`);
                  }
                }}
                className="hover:text-white transition cursor-pointer"
              >
                {(nextContract.question || '').substring(0, 20)}... →
              </span>
            )}
          </div>
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
  
  // Determine category:
  // 1. If we have competitionSlug, we're on /markets/sports/:competitionSlug, so category is "sports"
  // 2. If category prop is "sports", use it
  // 3. Otherwise use params.category
  const urlCategory = isCompetitionPage ? "sports" : (category || params.category);
  
  // State for competitions (to map slug to competitionId)
  const [competitions, setCompetitions] = React.useState([]);
  const [competitionsLoaded, setCompetitionsLoaded] = React.useState(false);
  
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
  
  // Ensure markets is always an array
  const safeMarkets = Array.isArray(markets) ? markets : [];
  
  let filteredMarkets = safeMarkets;
  
  // Filter by category if specified (but NOT for sports - we handle sports separately)
  if (urlCategory && urlCategory !== "all" && urlCategory !== "trending" && urlCategory !== "new" && urlCategory !== "sports") {
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
  
  // Get all featured contracts for slideshow
  const featuredContracts = list.filter(m => m && m.featured === true);
  // If no featured contracts, use first contract as fallback (for backward compatibility)
  const fallbackMarket = featuredContracts.length === 0 && list.length > 0 ? list[0] : null;
  const nonFeaturedMarkets = list.filter(m => m.id && !m.featured);
  // Show all non-featured markets, not just 4
  const gridMarkets = nonFeaturedMarkets;
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {!limit && urlCategory !== "sports" && <h2 className="text-2xl font-bold text-white mb-6">{getTitle()}</h2>}
      
      {/* Featured Contracts Slideshow */}
      {featuredContracts.length > 0 ? (
        <FeaturedContractsSlideshow contracts={safeMarkets} />
      ) : fallbackMarket ? (
        <div className="mb-6">
          <FeaturedMarketCard m={fallbackMarket} markets={safeMarkets} />
        </div>
      ) : null}
      
      {/* Feature Fields - Only show on homepage */}
      {limit ? (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Legal & regulated */}
              <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="text-blue-400 font-semibold text-sm mb-1">Legal & regulated in the US</div>
                  <div className="text-white text-xs">Trade on the election, sports and companies</div>
                </div>
              </div>

              {/* Grow portfolio */}
              <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-blue-400 font-semibold text-sm mb-1">Grow your entire portfolio</div>
                  <div className="text-white text-xs">3.5% APY on all your cash and positions</div>
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
          ) : null}
      
      {list.length === 0 ? (
        <div className="text-gray-400 col-span-full text-center py-8">No markets found in this category.</div>
      ) : (
        <>
          {/* Grid of 4 Smaller Market Cards */}
          {gridMarkets.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gridMarkets.filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          )}
          
          {/* Show all remaining markets if there are more than featured + grid */}
          {list.length > (featuredContracts.length + gridMarkets.length) && (
            <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {list
                .filter(m => m && m.id && !m.featured && !gridMarkets.find(gm => gm.id === m.id))
                .map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          )}
        </>
      )}
    </section>
  );
}
