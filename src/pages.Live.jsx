import React from "react";
import { Link } from "react-router-dom";
import { Clock, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

// Small Market Card (for grid)
function MarketCard({ m }){
  // Get image URL (handle both imageUrl and image_url)
  const rawImageUrl = m.imageUrl || m.image_url;
  const imageUrl = rawImageUrl ? getImageUrl(rawImageUrl) : null;
  
  return (
    <motion.div
      whileHover={{
        scale: [null, 1.03, 1.06],
        transition: {
          duration: 0.25,
          times: [0, 0.6, 1],
          ease: ["easeInOut", "easeOut"],
        },
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      <Link to={`/market/${encodeURIComponent(m.id)}`} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition block h-full min-h-[140px]">
        <div className="flex items-start gap-4">
        {/* Square profile picture at start, like Polymarket - extra small */}
        {imageUrl ? (
          <div className="flex-shrink-0" style={{ marginTop: '8px' }}>
            <img 
              src={imageUrl} 
              alt={m.question}
              className="rounded object-cover border border-gray-700"
              style={{ width: '44px', height: '44px', display: 'block' }}
              onError={(e) => {
                console.error("❌ Image failed to load:", imageUrl, "for contract:", m.id);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log("✅ Image loaded successfully:", imageUrl, "for contract:", m.id);
              }}
            />
          </div>
        ) : (
          <div className="flex-shrink-0 rounded bg-gray-800 border border-gray-700" style={{ width: '44px', height: '44px', marginTop: '8px' }}></div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">{m.category || "General"}</span>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1">
              <Radio size={10} className="animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="text-white font-semibold text-sm mt-2 line-clamp-2">{m.question}</div>
          <div className="flex gap-2 mt-3">
            <motion.div 
              className="flex-1 border rounded-md p-2 cursor-pointer relative overflow-hidden flex items-center justify-center min-h-[40px]"
              style={{ backgroundColor: 'rgb(64, 185, 35)', borderColor: 'rgb(64, 185, 35)' }}
              whileHover="hover"
              initial="rest"
              animate="rest"
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.02 }
              }}
            >
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                variants={{
                  rest: { opacity: 1, y: 0 },
                  hover: { opacity: 0, y: -10 }
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm font-semibold text-white">YES</span>
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgb(64, 185, 35)' }}
                variants={{
                  rest: { opacity: 0, y: 10 },
                  hover: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-lg font-bold text-white">
                  {Math.round((m.yesPrice||0.5)*100)}¢
                </span>
              </motion.div>
            </motion.div>
            <motion.div 
              className="flex-1 border rounded-md p-2 cursor-pointer relative overflow-hidden flex items-center justify-center min-h-[40px]"
              style={{ backgroundColor: 'rgb(239, 68, 68)', borderColor: 'rgb(239, 68, 68)' }}
              whileHover="hover"
              initial="rest"
              animate="rest"
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.02 }
              }}
            >
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                variants={{
                  rest: { opacity: 1, y: 0 },
                  hover: { opacity: 0, y: -10 }
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm font-semibold text-white">NO</span>
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgb(239, 68, 68)' }}
                variants={{
                  rest: { opacity: 0, y: 10 },
                  hover: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-lg font-bold text-white">
                  {Math.round((m.noPrice||0.5)*100)}¢
                </span>
              </motion.div>
            </motion.div>
          </div>
          <div className="text-xs text-gray-400 mt-2 flex justify-between">
            <span>{m.volume || "$0"} volume</span>
            <span>{m.traders || 0} traders</span>
          </div>
        </div>
      </div>
      </Link>
    </motion.div>
  );
}

export default function LivePage({ markets = [] }){
  // Ensure markets is always an array
  const safeMarkets = Array.isArray(markets) ? markets : [];
  
  // Filter for "live" markets - only show contracts explicitly marked as live
  const liveMarkets = safeMarkets.filter(m => {
    if (!m || !m.id) return false;
    if (m.resolution) return false; // Exclude resolved
    // Only show if explicitly marked as live
    if (m.live !== true) return false;
    // Optional: also check expiration date if present
    if (m.expirationDate) {
      const expiration = new Date(m.expirationDate);
      const now = new Date();
      return expiration > now; // Only show if not expired
    }
    return true; // Include if marked as live
  });

  // Sort by volume or traders (most active first)
  const sortedMarkets = [...liveMarkets].sort((a, b) => {
    const aVol = parseFloat((a.volume || "$0").replace("$", "").replace(",", "").replace("m", "")) || 0;
    const bVol = parseFloat((b.volume || "$0").replace("$", "").replace(",", "").replace("m", "")) || 0;
    if (bVol !== aVol) return bVol - aVol;
    return (b.traders || 0) - (a.traders || 0);
  });

  // Featured market (first one) and grid markets (next 4)
  const featuredMarket = sortedMarkets.length > 0 ? sortedMarkets[0] : null;
  const gridMarkets = sortedMarkets.slice(1, 5);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Radio className="w-6 h-6 text-red-400 animate-pulse" />
        <h2 className="text-2xl font-bold text-white">Live Markets</h2>
        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
          {sortedMarkets.length} active
        </span>
      </div>
      
      {sortedMarkets.length === 0 ? (
        <div className="text-gray-400 col-span-full text-center py-12">
          <Radio className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>No live markets at the moment.</p>
        </div>
      ) : (
        <>
          {/* Featured Large Market Card */}
          {featuredMarket && (
            <div className="mb-6">
              <Link to={`/market/${encodeURIComponent(featuredMarket.id)}`} className="bg-gray-900 border-2 border-red-500/30 rounded-xl overflow-hidden hover:border-red-500/50 transition block">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">{featuredMarket.category || "General"}</span>
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium flex items-center gap-1.5">
                          <Radio size={12} className="animate-pulse" />
                          LIVE
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{featuredMarket.question}</h3>
                      {featuredMarket.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">{featuredMarket.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Price Buttons */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <motion.div 
                      className="border-2 rounded-lg p-4 cursor-pointer relative overflow-hidden flex items-center justify-center min-h-[60px]"
                      style={{ backgroundColor: 'rgb(64, 185, 35)', borderColor: 'rgb(64, 185, 35)' }}
                      whileHover="hover"
                      initial="rest"
                      animate="rest"
                      variants={{
                        rest: { scale: 1 },
                        hover: { scale: 1.02 }
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        variants={{
                          rest: { opacity: 1, y: 0 },
                          hover: { opacity: 0, y: -10 }
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="font-semibold text-lg text-white">YES</span>
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: 'rgb(64, 185, 35)' }}
                        variants={{
                          rest: { opacity: 0, y: 10 },
                          hover: { opacity: 1, y: 0 }
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-2xl font-bold text-white">
                          {Math.round((featuredMarket.yesPrice||0.5)*100)}¢
                        </span>
                      </motion.div>
                    </motion.div>
                    <motion.div 
                      className="border-2 rounded-lg p-4 cursor-pointer relative overflow-hidden flex items-center justify-center min-h-[60px]"
                      style={{ backgroundColor: 'rgb(239, 68, 68)', borderColor: 'rgb(239, 68, 68)' }}
                      whileHover="hover"
                      initial="rest"
                      animate="rest"
                      variants={{
                        rest: { scale: 1 },
                        hover: { scale: 1.02 }
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        variants={{
                          rest: { opacity: 1, y: 0 },
                          hover: { opacity: 0, y: -10 }
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="font-semibold text-lg text-white">NO</span>
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: 'rgb(239, 68, 68)' }}
                        variants={{
                          rest: { opacity: 0, y: 10 },
                          hover: { opacity: 1, y: 0 }
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-2xl font-bold text-white">
                          {Math.round((featuredMarket.noPrice||0.5)*100)}¢
                        </span>
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  {/* Volume */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      Volume: <span className="text-white font-semibold">{featuredMarket.volume || "$0"}</span>
                    </span>
                    <span className="text-gray-400">
                      {featuredMarket.traders || 0} traders
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {/* Grid of 4 Smaller Market Cards */}
          {gridMarkets.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gridMarkets.filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          )}
          
          {/* Remaining markets in regular grid if more than 5 */}
          {sortedMarkets.length > 5 && (
            <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedMarkets.slice(5).filter(m => m && m.id).map(m => <MarketCard key={m.id} m={m}/>)}
            </div>
          )}
        </>
      )}
    </section>
  );
}

