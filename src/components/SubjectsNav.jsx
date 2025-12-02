import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiUrl } from "/src/api.js";
import { COUNTRIES } from "/src/data/countries.js";

export default function SubjectsNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [subjects, setSubjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [countryDropdownOpen, setCountryDropdownOpen] = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState("");

  // Load subjects on all pages (they should be visible everywhere except maybe homepage)
  const isHomepage = location.pathname === "/";
  
  React.useEffect(() => {
    async function loadSubjects() {
      try {
        const apiUrl = getApiUrl("/api/subjects");
        console.log("🔵 SubjectsNav: Fetching subjects from:", apiUrl);
        const r = await fetch(apiUrl);
        console.log("🔵 SubjectsNav: Response status:", r.status);
        if (r.ok) {
          const j = await r.json();
          console.log("🔵 SubjectsNav: Response data:", j);
          if (j.ok && j.data) {
            console.log("🔵 SubjectsNav: Found", j.data.length, "subjects:", j.data.map(s => ({ id: s.id, name: s.name, slug: s.slug })));
            setSubjects(j.data);
          } else {
            console.warn("🔵 SubjectsNav: Invalid response format:", j);
          }
        } else {
          console.error("🔵 SubjectsNav: Failed to fetch subjects, status:", r.status);
        }
      } catch (e) {
        console.error("🔵 SubjectsNav: Failed to load subjects:", e);
      } finally {
        setLoading(false);
      }
    }
    // Always load subjects, even on homepage (they might be needed for linking)
    loadSubjects();
  }, []);

  console.log("🔵 SubjectsNav: Render check - isHomepage:", isHomepage, "loading:", loading, "subjects.length:", subjects.length);

  // Show loading state
  if (loading) {
    console.log("🔵 SubjectsNav: Still loading subjects...");
    return (
      <nav id="subjects-nav" className="sticky z-20 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50" style={{ zIndex: 20, top: '100px', position: 'sticky' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-1">
            <div className="text-gray-400 text-sm py-3">Loading subjects...</div>
          </div>
        </div>
      </nav>
    );
  }
  
  // Always render navbar if we have subjects, even on homepage
  // On homepage, subjects are also used for feature card linking
  if (subjects.length === 0) {
    console.log("🔵 SubjectsNav: No subjects found, not rendering navbar");
    return null;
  }
  
  console.log("🔵 SubjectsNav: RENDERING NAVBAR with", subjects.length, "subjects");

  const isActive = (slug) => {
    return location.pathname === `/subjects/${slug}` || location.pathname.startsWith(`/subjects/${slug}/`);
  };

  const filteredCountries = React.useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const searchLower = countrySearch.toLowerCase();
    return COUNTRIES.filter(country => country.toLowerCase().includes(searchLower));
  }, [countrySearch]);

  const handleCountrySelect = (country) => {
    setCountryDropdownOpen(false);
    setCountrySearch("");
    navigate(`/markets?country=${encodeURIComponent(country)}`);
  };

  return (
      <nav id="subjects-nav" className="sticky z-20 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50" style={{ zIndex: 20, top: '100px', position: 'sticky' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbar: 'none' }}>
          {subjects.map((subject) => {
            const active = isActive(subject.slug);
            return (
              <Link
                key={subject.id}
                to={`/subjects/${subject.slug}`}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                  ${active
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white"
                  }
                `}
              >
                {subject.name}
              </Link>
            );
          })}
          
          {/* Country Dropdown */}
          <div className="relative ml-2">
            <button
              onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors text-gray-400 hover:text-white border-b-2 border-transparent hover:border-red-500"
            >
              Countries ▼
            </button>
            
            {countryDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setCountryDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 max-h-96 flex flex-col">
                  <div className="p-2 border-b border-gray-700">
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1" style={{ maxHeight: '320px' }}>
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country}
                          onClick={() => handleCountrySelect(country)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          {country}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400">No countries found</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

