import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useMarkets } from "../contexts/MarketsContext.jsx";

const CATEGORIES = [
  { id: "trending", label: "Trending", path: "/trending" },
  { id: "new", label: "New", path: "/new" },
  { id: "all", label: "All", path: "/markets" },
  { id: "politics", label: "Politics", path: "/markets/politics" },
  { id: "geopolitics", label: "Geopolitics", path: "/markets/geopolitics" },
  { id: "war", label: "War", path: "/markets/war" },
  { id: "policies", label: "Policies", path: "/markets/policies" },
];

export default function CategoryNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLight } = useTheme();
  const { markets } = useMarkets();
  const [countryDropdownOpen, setCountryDropdownOpen] = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState("");
  
  const isActive = (path) => {
    if (path === "/markets") {
      return location.pathname === "/markets" || location.pathname.startsWith("/markets/");
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Get unique countries from contracts
  const availableCountries = React.useMemo(() => {
    if (!markets || !Array.isArray(markets)) return [];
    const countries = new Set();
    markets.forEach(m => {
      if (m && m.country && m.country.trim()) {
        countries.add(m.country.trim());
      }
    });
    return Array.from(countries).sort();
  }, [markets]);

  const filteredCountries = React.useMemo(() => {
    if (!countrySearch.trim()) return availableCountries;
    const searchLower = countrySearch.toLowerCase();
    return availableCountries.filter(country => country.toLowerCase().includes(searchLower));
  }, [countrySearch, availableCountries]);

  const handleCountrySelect = (country) => {
    setCountryDropdownOpen(false);
    setCountrySearch("");
    navigate(`/markets?country=${encodeURIComponent(country)}`);
  };

  return (
    <nav id="category-nav" className="sticky z-40 border-b border-[var(--border-light)] backdrop-blur" style={{ zIndex: 40, top: '56px', position: 'sticky', backgroundColor: 'var(--bg-navbar)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbar: 'none' }}>
          {CATEGORIES.map((cat, index) => {
            const active = isActive(cat.path);
            return (
              <React.Fragment key={cat.id}>
                <Link
                  to={cat.path}
                  className={`
                    px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                    ${active
                      ? isLight 
                        ? "text-black border-b-2 border-blue-500"
                        : "text-white border-b-2 border-blue-500"
                      : isLight
                        ? "text-gray-600 hover:text-black"
                        : "text-gray-400 hover:text-white"
                    }
                  `}
                >
                  {cat.label}
                </Link>
                
                {/* Country Dropdown - Insert right after Trending */}
                {cat.id === "trending" && availableCountries.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                      className={`
                        px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                        ${isLight
                          ? "text-gray-600 hover:text-black"
                          : "text-gray-400 hover:text-white"
                        }
                        border-b-2 border-transparent hover:border-red-500
                      `}
                    >
                      Countries ▼
                    </button>
                    
                    {countryDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setCountryDropdownOpen(false)}
                        />
                        <div className={`absolute left-0 top-full mt-2 w-64 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'} border rounded-lg shadow-xl z-40 max-h-96 flex flex-col`}>
                          <div className={`p-2 border-b ${isLight ? 'border-gray-300' : 'border-gray-700'}`}>
                            <input
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className={`w-full px-3 py-2 ${isLight ? 'bg-gray-100 border-gray-300 text-black' : 'bg-gray-800 border-gray-600 text-white'} border rounded text-sm placeholder-gray-400 focus:outline-none focus:border-red-500`}
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto flex-1" style={{ maxHeight: '320px' }}>
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => (
                                <button
                                  key={country}
                                  onClick={() => handleCountrySelect(country)}
                                  className={`w-full text-left px-4 py-2 text-sm ${isLight ? 'text-gray-700 hover:bg-gray-100 hover:text-black' : 'text-gray-300 hover:bg-gray-800 hover:text-white'} transition-colors`}
                                >
                                  {country}
                                </button>
                              ))
                            ) : (
                              <div className={`px-4 py-2 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>No countries found</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

