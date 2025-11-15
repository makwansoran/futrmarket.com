import React from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, TrendingUp } from "lucide-react";
import Thumb from "./ui.Thumb.jsx";

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
        <Thumb src={m.image || m.imageUrl} alt={m.question} size={48}/>
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

// Large Featured Market Card (like Kalshi)
function FeaturedMarketCard({ m, markets = [] }){
  const navigate = React.useNavigate();
  
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
          {m.imageUrl && (
            <Thumb src={m.imageUrl} alt={m.question} size={120} className="ml-4 flex-shrink-0"/>
          )}
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
  const urlCategory = params.category || category;
  
  // Ensure markets is always an array
  const safeMarkets = Array.isArray(markets) ? markets : [];
  let filteredMarkets = safeMarkets;
  
  // Filter by category if specified
  if (urlCategory && urlCategory !== "all" && urlCategory !== "trending" && urlCategory !== "new") {
    const categoryName = CATEGORY_MAP[urlCategory] || urlCategory;
    filteredMarkets = safeMarkets.filter(m => 
      m && (m.category || "").toLowerCase() === categoryName.toLowerCase()
    );
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
  if (urlCategory === "sports") {
    const liveMatches = list.filter(m => m.status === "live");
    const upcomingMatches = list.filter(m => m.status === "upcoming" || (!m.status && m.category === "Sports"));
    const finishedMatches = list.filter(m => m.status === "finished");
    const cancelledMatches = list.filter(m => m.status === "cancelled");
    
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
  
  // Featured market (marked as featured, or first one if none)
  const featuredMarket = list.find(m => m.featured) || (list.length > 0 ? list[0] : null);
  const nonFeaturedMarkets = list.filter(m => m.id !== featuredMarket?.id);
  const gridMarkets = nonFeaturedMarkets.slice(0, 4); // Next 4 markets
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {!limit && urlCategory !== "sports" && <h2 className="text-2xl font-bold text-white mb-6">{getTitle()}</h2>}
      
      {list.length === 0 ? (
        <div className="text-gray-400 col-span-full text-center py-8">No markets found in this category.</div>
      ) : (
        <>
          {/* Featured Large Market Card */}
          {featuredMarket && (
            <div className="mb-6">
              <FeaturedMarketCard m={featuredMarket} markets={safeMarkets} />
            </div>
          )}
          
          {/* Grid of 4 Smaller Market Cards */}
          {gridMarkets.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gridMarkets.filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          )}
          
          {/* Remaining markets in regular grid if more than 5 */}
          {list.length > 5 && (
            <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {list.slice(5).filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          )}
        </>
      )}
    </section>
  );
}
