import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getApiUrl } from "/src/api.js";

export default function SubjectsNav() {
  const location = useLocation();
  const [subjects, setSubjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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
        </div>
      </div>
    </nav>
  );
}

