import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Calendar, Link as LinkIcon } from "lucide-react";
import { getApiUrl } from "/src/api.js";
import Thumb from "./ui.Thumb.jsx";

export default function NewsPage({ markets = [] }) {
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
    if (!newsItem.contractId) return null;
    return markets.find(m => m.id === newsItem.contractId);
  }

  const sortedNews = [...news].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <LinkIcon className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">News & Market Updates</h2>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading news...</div>
      ) : sortedNews.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <LinkIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>No news articles yet. Check back soon for updates!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedNews.map(item => {
            const contract = getLinkedContract(item);
            return (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition">
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {item.imageUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-32 h-24 object-cover rounded-lg border border-gray-800"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                          {item.category || "News"}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{item.summary}</p>
                      
                      {/* Linked Contract */}
                      {contract && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
                          <div className="text-xs text-gray-400 mb-2">Related Market</div>
                          <Link 
                            to={`/market/${encodeURIComponent(contract.id)}`}
                            className="flex items-center gap-3 group"
                          >
                            <Thumb src={contract.image || contract.imageUrl} alt={contract.question} size={48} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition line-clamp-1">
                                {contract.question}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
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
                          <span className="text-xs text-gray-500">{item.source}</span>
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
    </section>
  );
}

