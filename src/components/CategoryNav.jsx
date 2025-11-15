import React from "react";
import { Link, useLocation } from "react-router-dom";

const CATEGORIES = [
  { id: "trending", label: "Trending", path: "/trending" },
  { id: "new", label: "New", path: "/new" },
  { id: "all", label: "All", path: "/markets" },
  { id: "politics", label: "Politics", path: "/markets/politics" },
  { id: "crypto", label: "Crypto", path: "/markets/crypto" },
  { id: "climate", label: "Climate", path: "/markets/climate" },
  { id: "economics", label: "Economics", path: "/markets/economics" },
  { id: "sports", label: "Sports", path: "/markets/sports" },
  { id: "mentions", label: "Mentions", path: "/markets/mentions" },
  { id: "companies", label: "Companies", path: "/markets/companies" },
  { id: "financials", label: "Financials", path: "/markets/financials" },
  { id: "tech-science", label: "Tech & Science", path: "/markets/tech-science" },
];

export default function CategoryNav() {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === "/markets") {
      return location.pathname === "/markets" || location.pathname.startsWith("/markets/");
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="sticky top-14 z-10 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbar: 'none' }}>
          {CATEGORIES.map((cat) => {
            const active = isActive(cat.path);
            return (
              <Link
                key={cat.id}
                to={cat.path}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                  ${active
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white"
                  }
                `}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

