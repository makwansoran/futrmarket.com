import React from "react";
import { useTheme } from "./contexts/ThemeContext.jsx";

export default function BlogPage() {
  const { isLight } = useTheme();
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // For now, we'll use mock data. Later you can fetch from an API
    setPosts([
      {
        id: 1,
        title: "Welcome to FutrMarket",
        excerpt: "Learn about prediction markets and how FutrMarket is revolutionizing the way people trade on future events.",
        date: "2025-01-15",
        author: "FutrMarket Team",
        category: "Announcements"
      },
      {
        id: 2,
        title: "Getting Started with Prediction Markets",
        excerpt: "A comprehensive guide for beginners on how to start trading on prediction markets and make informed decisions.",
        date: "2025-01-10",
        author: "FutrMarket Team",
        category: "Tutorial"
      },
      {
        id: 3,
        title: "Understanding Market Probabilities",
        excerpt: "Deep dive into how market prices reflect probabilities and what that means for your trading strategy.",
        date: "2025-01-05",
        author: "FutrMarket Team",
        category: "Education"
      }
    ]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className={`max-w-5xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
        <h1 className={`text-3xl font-bold mb-6 ${isLight ? 'text-black' : 'text-white'}`}>Blog</h1>
        <div className={`rounded-xl p-8 text-center border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
          <div className={isLight ? 'text-gray-600' : 'text-gray-400'}>Loading blog posts...</div>
        </div>
      </main>
    );
  }

  return (
    <main className={`max-w-5xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
      <h1 className={`text-3xl font-bold mb-2 ${isLight ? 'text-black' : 'text-white'}`}>Blog</h1>
      <p className={`mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
        Stay updated with the latest news, tutorials, and insights from FutrMarket
      </p>
      
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
                      {new Date(post.date).toLocaleDateString('en-US', { 
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

