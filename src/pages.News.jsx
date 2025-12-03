import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Calendar, Link as LinkIcon } from "lucide-react";
import { getApiUrl } from "/src/api.js";
import Thumb from "./ui.Thumb.jsx";
import { useTheme } from "./contexts/ThemeContext.jsx";
import ConflictMap from "./components/ConflictMap.jsx";

export default function NewsPage({ markets = [] }) {
  const { isLight } = useTheme();
  const [news, setNews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      const r = await fetch(getApiUrl("/api/news"));
      const j = await r.json();
      if (j.ok) {
        setNews(j.data || []);
      }
    } catch (e) {
      console.error("Failed to load news:", e);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  }

  // Get linked contract for each news item
  function getLinkedContract(newsItem) {
    if (!newsItem || !newsItem.contractId) return null;
    const safeMarkets = Array.isArray(markets) ? markets : [];
    return safeMarkets.find(m => m && m.id === newsItem.contractId) || null;
  }

  const sortedNews = [...news].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  // Live news for sidebar (most recent 8 items)
  const liveNews = sortedNews.slice(0, 8);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <LinkIcon className="w-6 h-6 text-blue-400" />
        <h2 className={`text-2xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>News & Market Updates</h2>
      </div>

      {/* Fixed Map and Sidebar Container */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 flex gap-6" style={{ zIndex: 10 }}>
        {/* Conflict Map - Fixed Position */}
        <div className={`rounded-xl p-6 w-[768px] ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
          <div className="mb-4">
            <h2 className={`text-lg font-semibold ${isLight ? 'text-black' : 'text-white'}`}>Global Conflict Map</h2>
          </div>
          <ConflictMap />
        </div>

        {/* Sidebar - Fixed Position Next to Map */}
        <div className={`w-96 rounded-xl p-6 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'} border`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-black' : 'text-white'}`}>Live News</h3>
            </div>
            
            {loading ? (
              <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Loading...</div>
            ) : liveNews.length === 0 ? (
              <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>No live news yet</div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                {liveNews.map((item, index) => {
                  const contract = getLinkedContract(item);
                  return (
                    <div 
                      key={item.id} 
                      className={`pb-4 ${index < liveNews.length - 1 ? 'border-b ' + (isLight ? 'border-gray-200' : 'border-gray-800') : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className={`w-16 h-12 object-cover rounded border flex-shrink-0 ${isLight ? 'border-gray-300' : 'border-gray-800'}`}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                              {item.category || "News"}
                            </span>
                          </div>
                          <h4 className={`text-sm font-semibold mb-1 line-clamp-2 ${isLight ? 'text-black' : 'text-white'}`}>
                            {item.title}
                          </h4>
                          <p className={`text-xs line-clamp-2 mb-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            {item.summary}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs flex items-center gap-1 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
                              <Calendar size={10} />
                              {formatDate(item.createdAt)}
                            </span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                            >
                              Read →
                            </a>
                          </div>
                          {contract && (
                            <div className={`mt-2 p-2 rounded ${isLight ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                              <Link 
                                to={`/market/${encodeURIComponent(contract.id)}`}
                                className="flex items-center gap-2 group"
                              >
                                <Thumb src={contract.image || contract.imageUrl} alt={contract.question} size={32} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-xs font-medium group-hover:text-blue-400 transition line-clamp-1 ${isLight ? 'text-black' : 'text-white'}`}>
                                    {contract.question}
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - News Articles */}
      <div className="pt-[420px]">

        {loading ? (
          <div className={`text-center py-12 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Loading news...</div>
        ) : sortedNews.length === 0 ? (
          <div className={`text-center py-12 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
            <LinkIcon className={`w-12 h-12 mx-auto mb-4 ${isLight ? 'text-gray-500' : 'text-gray-600'}`} />
            <p>No news articles yet. Check back soon for updates!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedNews.map(item => {
                const contract = getLinkedContract(item);
                return (
                  <div key={item.id} className={`${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'} border rounded-xl overflow-hidden ${isLight ? 'hover:border-gray-400' : 'hover:border-gray-700'} transition`}>
                    <div className="p-6">
                      <div className="flex items-start gap-6">
                        {item.imageUrl && (
                          <div className="flex-shrink-0">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className={`w-32 h-24 object-cover rounded-lg border ${isLight ? 'border-gray-300' : 'border-gray-800'}`}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                              {item.category || "News"}
                            </span>
                            <span className={`text-xs flex items-center gap-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                              <Calendar size={12} />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-black' : 'text-white'}`}>{item.title}</h3>
                          <p className={`text-sm mb-4 line-clamp-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{item.summary}</p>
                          
                          {/* Linked Contract */}
                          {contract && (
                            <div className={`${isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-800/50 border-gray-700'} border rounded-lg p-4 mb-4`}>
                              <div className={`text-xs mb-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Related Market</div>
                              <Link 
                                to={`/market/${encodeURIComponent(contract.id)}`}
                                className="flex items-center gap-3 group"
                              >
                                <Thumb src={contract.image || contract.imageUrl} alt={contract.question} size={48} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-semibold group-hover:text-blue-400 transition line-clamp-1 ${isLight ? 'text-black' : 'text-white'}`}>
                                    {contract.question}
                                  </div>
                                  <div className={`text-xs mt-1 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {Math.round((contract.yesPrice||0.5)*100)}¢ YES • {Math.round((contract.noPrice||0.5)*100)}¢ NO
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition"
                            >
                              Read Article
                              <ExternalLink size={14} />
                            </a>
                            {item.source && (
                              <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{item.source}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </section>
  );
}

