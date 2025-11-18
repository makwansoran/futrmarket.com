import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Plus, Heart, Clock, Trash2 } from "lucide-react";
import { loadSession } from "./lib.session.js";
import { getApiUrl } from "/src/api.js";

export default function ForumPage() {
  const [ideas, setIdeas] = React.useState([]);
  const [userProfiles, setUserProfiles] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [newIdea, setNewIdea] = React.useState({ title: "", description: "", category: "General" });
  const [submitting, setSubmitting] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    loadIdeas();
    loadUser();
  }, []);

  async function loadUser() {
    const session = await loadSession();
    if (session?.email) setUserEmail(session.email);
  }

  async function loadIdeas() {
    try {
      const r = await fetch(getApiUrl("/api/ideas"));
      const j = await r.json();
      if (j.ok) {
        const ideasData = j.data || [];
        setIdeas(ideasData);
        
        // Fetch user profiles for all unique authors
        const uniqueEmails = [...new Set(ideasData.map(i => i.email))];
        await loadUserProfiles(uniqueEmails);
      }
    } catch (e) {
      console.error("Failed to load ideas:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserProfiles(emails) {
    const profiles = {};
    await Promise.all(
      emails.map(async (email) => {
        try {
          const r = await fetch(getApiUrl(`/api/users/${encodeURIComponent(email)}`));
          const j = await r.json();
          if (j.ok && j.data) {
            profiles[email] = j.data;
          }
        } catch (e) {
          console.error(`Failed to load profile for ${email}:`, e);
        }
      })
    );
    setUserProfiles(profiles);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userEmail) {
      alert("Please log in to post ideas");
      return;
    }
    if (!newIdea.title.trim() || !newIdea.description.trim()) return;

    setSubmitting(true);
    try {
      const r = await fetch(getApiUrl("/api/ideas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          ...newIdea
        })
      });
      const j = await r.json();
      if (j.ok) {
        setNewIdea({ title: "", description: "", category: "General" });
        setShowForm(false);
        loadIdeas();
      } else {
        alert(j.error || "Failed to post idea");
      }
    } catch (e) {
      alert("Failed to post idea");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(ideaId) {
    if (!userEmail) {
      alert("Please log in to like ideas");
      return;
    }
    try {
      const r = await fetch(getApiUrl(`/api/ideas/${ideaId}/like`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      });
      const j = await r.json();
      if (j.ok) {
        loadIdeas();
      }
    } catch (e) {
      console.error("Failed to like idea:", e);
    }
  }

  async function handleDelete(ideaId) {
    if (!confirm("Delete this idea?")) return;
    try {
      const r = await fetch(getApiUrl(`/api/ideas/${ideaId}?email=${encodeURIComponent(userEmail)}`), {
        method: "DELETE"
      });
      const j = await r.json();
      if (j.ok) {
        loadIdeas();
      } else {
        alert(j.error || "Failed to delete idea");
      }
    } catch (e) {
      alert("Failed to delete idea");
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  const sortedIdeas = [...ideas].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Forum - Market Ideas</h2>
        </div>
        {userEmail && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium"
          >
            <Plus size={18} />
            New Idea
          </button>
        )}
      </div>

      {/* New Idea Form */}
      {showForm && userEmail && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Post a New Market Idea</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Title</label>
              <input
                type="text"
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                placeholder="What market should we create?"
                maxLength={200}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                value={newIdea.description}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                placeholder="Describe your market idea in detail..."
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select
                value={newIdea.category}
                onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option>General</option>
                <option>Politics</option>
                <option>Crypto</option>
                <option>Economics</option>
                <option>Tech & Science</option>
                <option>Culture</option>
                <option>World</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Idea"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewIdea({ title: "", description: "", category: "General" });
                }}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!userEmail && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 text-center">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            Log in to post and vote on market ideas
          </Link>
        </div>
      )}

      {/* Ideas List */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading ideas...</div>
      ) : sortedIdeas.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>No ideas yet. Be the first to share a market idea!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedIdeas.map(idea => {
            const isLiked = idea.likedBy?.includes(userEmail) || false;
            const isAuthor = idea.email === userEmail;
            const userProfile = userProfiles[idea.email] || {};
            const displayName = userProfile.username && userProfile.username.trim() ? userProfile.username.trim() : "no username";
            const profilePicture = userProfile.profilePicture;
            
            return (
              <div key={idea.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                        {idea.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatTime(idea.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{idea.title}</h3>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{idea.description}</p>
                  </div>
                  {isAuthor && (
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="text-gray-500 hover:text-red-400 transition ml-4"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => handleLike(idea.id)}
                    className={`flex items-center gap-2 text-sm transition ${
                      isLiked ? "text-red-400" : "text-gray-500 hover:text-red-400"
                    }`}
                  >
                    <Heart size={16} className={isLiked ? "fill-current" : ""} />
                    <span>{idea.likes || 0}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt={displayName}
                        className="w-6 h-6 rounded-full object-cover border border-gray-700"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold border border-gray-700">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      by {displayName}
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

