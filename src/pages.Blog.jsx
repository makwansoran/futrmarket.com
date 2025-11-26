import React from "react";
import { useTheme } from "./contexts/ThemeContext.jsx";
import { getApiUrl } from "./api.js";
import { motion } from "framer-motion";

const phrases = [
  "Politics",
  "Crypto",
  "Climate",
  "Economics",
  "Sports",
  "Mentions",
  "Companies",
  "Financials",
  "Tech & Science"
];

function TypewriterText({ isLight }) {
  const [currentPhrase, setCurrentPhrase] = React.useState(phrases[0]);
  const [displayedText, setDisplayedText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const getRandomPhrase = React.useCallback((excludePhrase) => {
    const availablePhrases = phrases.filter(p => p !== excludePhrase);
    return availablePhrases[Math.floor(Math.random() * availablePhrases.length)];
  }, []);

  React.useEffect(() => {
    let timeout;

    if (!isDeleting && displayedText.length < currentPhrase.length) {
      // Typing
      timeout = setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
      }, 100);
    } else if (!isDeleting && displayedText.length === currentPhrase.length) {
      // Finished typing, wait then start deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && displayedText.length > 0) {
      // Deleting
      timeout = setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));
      }, 50);
    } else if (isDeleting && displayedText.length === 0) {
      // Finished deleting, pick a random phrase (different from current)
      setIsDeleting(false);
      setCurrentPhrase(getRandomPhrase(currentPhrase));
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentPhrase, getRandomPhrase]);

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-black mb-2">Predict</h1>
      <h2 className="text-5xl md:text-6xl font-bold">
        <span className="inline-block text-blue-500">
          {displayedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block w-1 h-10 md:h-12 bg-blue-500 ml-2 align-middle"
          />
        </span>
      </h2>
    </div>
  );
}

export default function BlogPage() {
  const { isLight } = useTheme();
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchBlogPosts() {
      try {
        const response = await fetch(getApiUrl("/api/blog"));
        if (!response.ok) {
          console.error("Failed to fetch blog posts:", response.status);
          setPosts([]);
          setLoading(false);
          return;
        }
        const data = await response.json();
        if (data.ok && Array.isArray(data.data)) {
          // Only show published posts
          const publishedPosts = data.data.filter(post => post.published !== false);
          setPosts(publishedPosts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBlogPosts();
  }, []);

  if (loading) {
    return (
      <main className={`max-w-5xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
        <TypewriterText isLight={isLight} />
        <div className={`rounded-xl p-8 text-center border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
          <div className={isLight ? 'text-gray-600' : 'text-gray-400'}>Loading blog posts...</div>
        </div>
      </main>
    );
  }

  return (
    <main className={`max-w-5xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
      <TypewriterText isLight={isLight} />
      
      {posts.length === 0 ? (
        <div className={`rounded-xl p-8 text-center border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
          <div className={isLight ? 'text-gray-600' : 'text-gray-400'}>No blog posts yet. Check back soon!</div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className={`rounded-xl p-6 border-2 transition hover:shadow-lg ${
                isLight 
                  ? 'bg-white border-gray-300 hover:border-gray-400' 
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isLight 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {post.category}
                    </span>
                    <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-black' : 'text-white'}`}>
                    {post.title}
                  </h2>
                  <p className={`text-sm mb-3 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    {post.excerpt}
                  </p>
                  <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
                    By {post.author}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

