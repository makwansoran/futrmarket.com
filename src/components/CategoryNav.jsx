import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";

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
  const { isLight } = useTheme();
  
  const isActive = (path) => {
    if (path === "/markets") {
      return location.pathname === "/markets" || location.pathname.startsWith("/markets/");
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav id="category-nav" className="sticky z-40 border-b border-[var(--border-light)] backdrop-blur" style={{ zIndex: 40, top: '56px', position: 'sticky', backgroundColor: 'var(--bg-navbar)' }}>
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
            );
          })}
        </div>
      </div>
    </nav>
  );
}

