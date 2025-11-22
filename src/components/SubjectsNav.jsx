import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getApiUrl } from "/src/api.js";

export default function SubjectsNav() {
  const location = useLocation();
  const [subjects, setSubjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadSubjects() {
      try {
        const r = await fetch(getApiUrl("/api/subjects"));
        if (r.ok) {
          const j = await r.json();
          if (j.ok && j.data) {
            setSubjects(j.data);
          }
        }
      } catch (e) {
        console.error("Failed to load subjects:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  if (loading || subjects.length === 0) {
    return null;
  }

  const isActive = (slug) => {
    return location.pathname === `/subjects/${slug}` || location.pathname.startsWith(`/subjects/${slug}/`);
  };

  return (
    <nav className="sticky top-[56px] z-10 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/50">
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
        </div>
      </div>
    </nav>
  );
}

