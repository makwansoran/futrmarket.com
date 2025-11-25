import React from "react";
import { getApiUrl } from "/src/api.js";
import { useParams, Link, useNavigate } from "react-router-dom";
import Thumb from "./ui.Thumb.jsx";
import { useUser } from "./contexts/UserContext.jsx";
import { useTheme } from "./contexts/ThemeContext.jsx";
import { Clock, TrendingUp, TrendingDown, Heart, MessageCircle, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Price Chart Component
function PriceChart({ data }) {
  const { isLight } = useTheme();
  const chartHeight = 340;
  const chartWidth = 800; // Base width for viewBox
  const padding = { top: 20, right: 20, bottom: 60, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  if (!data || data.length === 0) {
    return (
      <div className={`h-[300px] flex items-center justify-center ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
        No price history available
      </div>
    );
  }

  // Normalize data to 0-100 scale (cents)
  const normalizedData = data.map(d => ({
    ...d,
    yesCents: d.yesPrice * 100,
    noCents: d.noPrice * 100
  }));

  const minPrice = 0;
  const maxPrice = 100;
  const priceRange = maxPrice - minPrice;

  // Calculate x and y positions
  const points = normalizedData.map((d, i) => {
    const x = padding.left + (i / (normalizedData.length - 1)) * innerWidth;
    const yesY = padding.top + innerHeight - ((d.yesCents - minPrice) / priceRange) * innerHeight;
    const noY = padding.top + innerHeight - ((d.noCents - minPrice) / priceRange) * innerHeight;
    return { x, yesY, noY, ...d };
  });

  // Generate path for YES line
  const yesPath = points.reduce((path, point, i) => {
    if (i === 0) {
      return `M ${point.x} ${point.yesY}`;
    }
    return `${path} L ${point.x} ${point.yesY}`;
  }, "");

  // Generate path for NO line
  const noPath = points.reduce((path, point, i) => {
    if (i === 0) {
      return `M ${point.x} ${point.noY}`;
    }
    return `${path} L ${point.x} ${point.noY}`;
  }, "");

  // Format date for x-axis labels
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // X-axis labels (show 5 evenly spaced)
  const xAxisLabels = [];
  const labelCount = 5;
  for (let i = 0; i < labelCount; i++) {
    const index = Math.floor((i / (labelCount - 1)) * (points.length - 1));
    const point = points[index];
    xAxisLabels.push({
      x: point.x,
      label: formatDate(point.date)
    });
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-[340px]"
        preserveAspectRatio="none"
      >
        {/* Grid lines with dotted horizontal lines at 0%, 50%, and 100% */}
        {[0, 25, 50, 75, 100].map((price) => {
          const y = padding.top + innerHeight - ((price - minPrice) / priceRange) * innerHeight;
          const isKeyLine = price === 0 || price === 50 || price === 100;
          return (
            <g key={price}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke={isLight ? "#e5e7eb" : "#374151"}
                strokeWidth={isKeyLine ? "1" : "0.5"}
                strokeDasharray={isKeyLine ? "4,4" : "2,2"}
                opacity={isKeyLine ? "0.8" : "0.5"}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fill={isLight ? "#4b5563" : "#9ca3af"}
                fontSize="10"
                textAnchor="end"
              >
                {price}%
              </text>
            </g>
          );
        })}

        {/* YES line */}
        <path
          d={yesPath}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* YES area fill */}
        <path
          d={`${yesPath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`}
          fill="url(#yesGradient)"
          opacity="0.2"
        />

        {/* NO line */}
        <path
          d={noPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* NO area fill */}
        <path
          d={`${noPath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`}
          fill="url(#noGradient)"
          opacity="0.2"
        />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="yesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="noGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* X-axis labels */}
        {xAxisLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={chartHeight - padding.bottom + 20}
            fill={isLight ? "#4b5563" : "#9ca3af"}
            fontSize="10"
            textAnchor="middle"
          >
            {label.label}
          </text>
        ))}


        {/* FutrMarket Logo - Lower Right Corner */}
        <text
          x={chartWidth - padding.right - 5}
          y={chartHeight - 10}
          fill={isLight ? "#2563eb" : "#ffffff"}
          fontSize="18"
          fontWeight="bold"
          textAnchor="end"
          fontFamily="system-ui, -apple-system, sans-serif"
          opacity="0.7"
        >
          FutrMarket
        </text>
      </svg>
    </div>
  );
}

// News Component for Contract Page
function ContractNews({ contractId }) {
  const { isLight } = useTheme();
  const [news, setNews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadNews();
  }, [contractId]);

  async function loadNews() {
    try {
      const r = await fetch(getApiUrl("/api/news"));
      const j = await r.json();
      if (j.ok) {
        // Filter news articles linked to this contract
        const contractNews = (j.data || []).filter(item => item.contractId === contractId);
        setNews(contractNews);
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
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  }

  if (loading) {
    return (
      <div className={`rounded-xl p-6 sticky top-6 border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Related News</h2>
        <div className={`text-center py-4 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Loading news...</div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className={`rounded-xl p-6 sticky top-6 border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Related News</h2>
        <div className={`text-center py-4 text-sm ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>No news articles yet.</div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 sticky top-6 border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
      <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Related News</h2>
      <div className="space-y-4">
        {news.map(item => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-lg p-4 transition group border ${isLight ? 'bg-gray-50 border-gray-300 hover:border-gray-400' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}`}
          >
            {item.imageUrl && (
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className={`w-full h-32 object-cover rounded-lg mb-3 border ${isLight ? 'border-gray-300' : 'border-gray-700'}`}
              />
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                {item.category || "News"}
              </span>
              <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{formatDate(item.createdAt)}</span>
            </div>
            <h3 className={`text-sm font-semibold mb-2 group-hover:text-blue-400 transition line-clamp-2 ${isLight ? 'text-black' : 'text-white'}`}>
              {item.title}
            </h3>
            <p className={`text-xs line-clamp-2 mb-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{item.summary}</p>
            {item.source && (
              <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{item.source}</div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

// Chat Component (renamed from Forum)
function Chat({ contractId, userEmail }) {
  const { isLight } = useTheme();
  const [comments, setComments] = React.useState([]);
  const [userProfiles, setUserProfiles] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState("");
  const [replyingTo, setReplyingTo] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Load comments and user profiles
  React.useEffect(() => {
    loadComments();
  }, [contractId]);

  async function loadComments() {
    try {
      const r = await fetch(getApiUrl(`/api/forum/${contractId}`));
      const j = await r.json();
      if (j.ok) {
        const commentsData = j.data || [];
        setComments(commentsData);
        
        // Fetch user profiles for all unique authors
        const uniqueEmails = [...new Set(commentsData.map(c => c.email))];
        await loadUserProfiles(uniqueEmails);
      }
    } catch (e) {
      console.error("Failed to load comments:", e);
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
      alert("Please log in to post comments");
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const r = await fetch(getApiUrl(`/api/forum/${contractId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          text: newComment,
          parentId: replyingTo
        })
      });
      const j = await r.json();
      if (j.ok) {
        setNewComment("");
        setReplyingTo(null);
        await loadComments();
      } else {
        alert(j.error || "Failed to post comment");
      }
    } catch (e) {
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(commentId) {
    if (!userEmail) {
      alert("Please log in to like comments");
      return;
    }
    try {
      const r = await fetch(getApiUrl(`/api/forum/${contractId}/like`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          commentId
        })
      });
      const j = await r.json();
      if (j.ok) {
        loadComments();
      }
    } catch (e) {
      console.error("Failed to like comment:", e);
    }
  }

  async function handleDelete(commentId) {
    if (!confirm("Delete this comment?")) return;
    try {
      const r = await fetch(getApiUrl(`/api/forum/${contractId}/${commentId}?email=${encodeURIComponent(userEmail)}`), {
        method: "DELETE"
      });
      const j = await r.json();
      if (j.ok) {
        loadComments();
      } else {
        alert(j.error || "Failed to delete comment");
      }
    } catch (e) {
      alert("Failed to delete comment");
    }
  }

  // Organize comments into threads (top-level and replies)
  const topLevelComments = comments.filter(c => !c.parentId);
  const repliesByParent = {};
  comments.forEach(c => {
    if (c.parentId) {
      if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
      repliesByParent[c.parentId].push(c);
    }
  });

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

  function CommentItem({ comment, isReply = false }) {
    const { isLight } = useTheme();
    const replies = repliesByParent[comment.id] || [];
    const isLiked = comment.likedBy?.includes(userEmail) || false;
    const isAuthor = comment.email === userEmail;
    const userProfile = userProfiles[comment.email] || {};
    const displayName = userProfile.username && userProfile.username.trim() ? userProfile.username.trim() : "no username";
    const profilePicture = userProfile.profilePicture;

    return (
      <div className={isReply ? "ml-8 mt-3" : ""}>
        <div className={`rounded-lg p-4 border ${isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-800/50 border-gray-700'}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold border-2 border-gray-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className={`text-sm font-medium ${isLight ? 'text-black' : 'text-white'}`}>
                  {displayName}
                </div>
                <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{formatTime(comment.createdAt)}</div>
              </div>
            </div>
            {isAuthor && (
              <button
                onClick={() => handleDelete(comment.id)}
                className={`transition ${isLight ? 'text-gray-600 hover:text-red-500' : 'text-gray-500 hover:text-red-400'}`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p className={`text-sm mb-3 whitespace-pre-wrap ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{comment.text}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLike(comment.id)}
              className={`flex items-center gap-1.5 text-xs transition ${
                isLiked ? "text-red-400" : "text-gray-500 hover:text-red-400"
              }`}
            >
              <Heart size={14} className={isLiked ? "fill-current" : ""} />
              <span>{comment.likes || 0}</span>
            </button>
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition"
              >
                <MessageCircle size={14} />
                <span>Reply</span>
              </button>
            )}
          </div>
          {replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Comment Form */}
      {userEmail ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyingTo && (
            <div className="mb-2 text-xs text-gray-400">
              Replying to comment.{" "}
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-blue-400 hover:text-blue-300"
              >
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
            rows={3}
            maxLength={5000}
            className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none border ${
              isLight 
                ? 'bg-white border-gray-300 text-black placeholder-gray-400' 
                : 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
            }`}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{newComment.length}/5000</span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Posting..." : replyingTo ? "Reply" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className={`mb-6 p-4 rounded-lg text-center border ${isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-800/50 border-gray-700'}`}>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            Log in to participate in the chat
          </Link>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Loading comments...</div>
      ) : topLevelComments.length === 0 ? (
        <div className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketDetailPage(){
  const { isLight } = useTheme();
  const { id: rawId } = useParams();
  // Decode the ID from URL (React Router should handle this, but be safe)
  const id = rawId ? decodeURIComponent(rawId) : null;
  const navigate = useNavigate();
  const { userEmail, updateBalance } = useUser();
  const [contract, setContract] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [side, setSide] = React.useState("yes");
  const [orderType, setOrderType] = React.useState("buy");
  const [amount, setAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [userPosition, setUserPosition] = React.useState(null);
  const [openOrderbook, setOpenOrderbook] = React.useState(null); // 'yes', 'no', or null

  // Load contract and user position
  React.useEffect(() => {
    // Validate id parameter
    if (!id || typeof id !== 'string' || id.trim() === '') {
      setLoading(false);
      setError("Invalid contract ID");
      return;
    }
    
    let cancelled = false;
    const controller = new AbortController();
    
    (async () => {
      try {
        // Load contract
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        // Ensure ID is properly encoded for the API
        const encodedId = encodeURIComponent(id);
        const contractUrl = getApiUrl(`/api/contracts/${encodedId}`);
        console.log("🔵 Loading contract:", { rawId, id, encodedId, contractUrl });
        
        const r = await fetch(contractUrl, {
          signal: controller.signal,
          cache: "no-store"
        });
        clearTimeout(timeoutId);
        
        if (cancelled) return;
        
        if (!r.ok) {
          const errorText = await r.text().catch(() => "");
          console.error("🔵 Contract fetch failed:", { status: r.status, statusText: r.statusText, errorText, contractUrl });
          if (r.status === 404) {
            setError(`Contract not found. ID: ${id}`);
          } else {
            setError(`Failed to load contract (${r.status})`);
          }
          setLoading(false);
          return;
        }
        
        const j = await r.json().catch(() => ({}));
        if (j.ok && j.data) {
          // Validate contract data
          if (!j.data.id || typeof j.data.id !== 'string') {
            console.error("Invalid contract data received:", j.data);
            setError("Invalid contract data");
            setLoading(false);
            return;
          }
          
          setContract(j.data);
          
          // Load user position if logged in
          if (userEmail && !cancelled && typeof userEmail === 'string') {
            try {
              const posController = new AbortController();
              const posTimeoutId = setTimeout(() => posController.abort(), 10000);
              const posR = await fetch(getApiUrl(`/api/positions?email=${encodeURIComponent(userEmail)}`), {
                signal: posController.signal,
                cache: "no-store"
              });
              clearTimeout(posTimeoutId);
              
              if (!cancelled) {
                const posJ = await posR.json().catch(() => ({}));
                if (posJ.ok && posJ.data?.positions && Array.isArray(posJ.data.positions)) {
                  const pos = posJ.data.positions.find(p => p && p.contractId === id);
                  setUserPosition(pos || { yesShares: 0, noShares: 0 });
                }
              }
            } catch (e) {
              if (e.name !== "AbortError" && !cancelled) {
                console.error("Failed to load position:", e);
              }
            }
          }
        } else if (!cancelled) {
          setError(j.error || "Contract not found");
        }
      } catch (e) {
        if (e.name === "AbortError") {
          if (!cancelled) {
            setError("Request timed out. Please try again.");
          }
        } else if (!cancelled) {
          console.error("Failed to load contract:", e);
          setError("Failed to load contract. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, userEmail]);

  async function handleOrder() {
    if (!userEmail) {
      setError("Please log in to trade");
      navigate("/login");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(getApiUrl(`/api/contracts/${id}/order`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          side,
          amount: parseFloat(amount),
          type: orderType
        })
      });
      const j = await r.json();
      if (j.ok) {
        // Refresh contract and position
        const contractR = await fetch(getApiUrl(`/api/contracts/${id}`));
        const contractJ = await contractR.json();
        if (contractJ.ok) setContract(contractJ.data);

        const posR = await fetch(getApiUrl(`/api/positions?email=${encodeURIComponent(userEmail)}`));
        const posJ = await posR.json();
        if (posJ.ok) {
          const pos = posJ.data.positions.find(p => p.contractId === id);
          setUserPosition(pos || { yesShares: 0, noShares: 0 });
        }

        // Update balance from context
        if (updateBalance) {
          const balanceR = await fetch(getApiUrl(`/api/balances?email=${encodeURIComponent(userEmail)}`));
          const balanceJ = await balanceR.json();
          if (balanceJ.ok && balanceJ.data) {
            updateBalance(balanceJ.data);
          }
        }

        setAmount("");
        setError("");
      } else {
        setError(j.error || "Order failed");
      }
    } catch (e) {
      setError("Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className={`max-w-4xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  if (!contract) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-gray-400">Contract not found. <Link to="/markets" className="text-blue-400">Back</Link></div>
      </main>
    );
  }

  const m = contract;
  const price = side==="yes" ? (m.yesPrice||0.5) : (m.noPrice||0.5);
  const sharesReceived = amount && orderType === "buy" ? (parseFloat(amount) / price).toFixed(2) : "";
  const usdReceived = amount && orderType === "sell" ? (parseFloat(amount) * price).toFixed(2) : "";
  const maxSell = side === "yes" ? (userPosition?.yesShares || 0) : (userPosition?.noShares || 0);
  const yesPrice = Math.round((m.yesPrice||0.5)*100);
  const noPrice = Math.round((m.noPrice||0.5)*100);

  // Mock price history data (you can replace with real data from API)
  const generatePriceHistory = () => {
    const days = 30;
    const history = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Generate realistic price movements
    let yesPrice = m.yesPrice || 0.5;
    let noPrice = m.noPrice || 0.5;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      // Add some random walk to prices
      yesPrice = Math.max(0.01, Math.min(0.99, yesPrice + (Math.random() - 0.5) * 0.05));
      noPrice = 1 - yesPrice; // Ensure they sum to 1
      
      history.push({
        date,
        yesPrice,
        noPrice
      });
    }
    return history;
  };

  const priceHistory = generatePriceHistory();

  // Mock order book data (you can replace with real data from API)
  const orderBook = {
    yes: {
      buy: [
        { price: 0.65, shares: 120 },
        { price: 0.64, shares: 85 },
        { price: 0.63, shares: 200 }
      ],
      sell: [
        { price: 0.66, shares: 150 },
        { price: 0.67, shares: 90 },
        { price: 0.68, shares: 175 }
      ]
    },
    no: {
      buy: [
        { price: 0.34, shares: 100 },
        { price: 0.33, shares: 75 },
        { price: 0.32, shares: 180 }
      ],
      sell: [
        { price: 0.35, shares: 140 },
        { price: 0.36, shares: 95 },
        { price: 0.37, shares: 160 }
      ]
    }
  };

  return (
    <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 ${isLight ? 'text-black' : 'text-white'}`}>

      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Small square profile picture at start, like Polymarket */}
          {(m.imageUrl || m.image_url) && (
            <div className="flex-shrink-0" style={{ marginTop: '8px' }}>
              <img 
                src={m.imageUrl || m.image_url} 
                alt={m.question}
                className="w-11 h-11 md:w-14 md:h-14 rounded object-cover border border-gray-700"
                onError={(e) => {
                  console.error("❌ Image failed to load:", m.imageUrl || m.image_url, "for contract:", m.id);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log("✅ Image loaded successfully:", m.imageUrl || m.image_url, "for contract:", m.id);
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                {m.category || "General"}
              </span>
              {m.resolution && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                  Resolved: {m.resolution.toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{m.question}</h1>
          </div>
        </div>
        {m.description && (
          <p className="text-gray-400 text-base mb-4 max-w-3xl">{m.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          {m.expirationDate && (
            <div className="flex items-center gap-1.5">
              <Clock size={16} />
              <span>Closes {new Date(m.expirationDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <span>Volume: <span className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>{m.volume || "$0"}</span></span>
            <span>•</span>
            <span>{m.traders || 0} traders</span>
          </div>
        </div>
      </div>

      {/* User Position */}
      {userPosition && (userPosition.yesShares > 0 || userPosition.noShares > 0) && (
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-sm font-semibold text-blue-300 mb-3">Your Position</div>
          <div className="flex flex-wrap gap-6 text-sm">
            {userPosition.yesShares > 0 && (
              <div>
                <span className="text-gray-400">YES: </span>
                <span className="text-green-400 font-semibold">{userPosition.yesShares.toFixed(2)} shares</span>
                <span className="text-gray-500 ml-2">(${(userPosition.yesShares * (m.yesPrice||0.5)).toFixed(2)})</span>
              </div>
            )}
            {userPosition.noShares > 0 && (
              <div>
                <span className="text-gray-400">NO: </span>
                <span className="text-red-600 font-semibold">{userPosition.noShares.toFixed(2)} shares</span>
                <span className="text-gray-500 ml-2">(${(userPosition.noShares * (m.noPrice||0.5)).toFixed(2)})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid: Chart, Order Book and Trading Panel */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Chart, Probability, Order Book */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart - Same Width as Order Book */}
          <div className={`rounded-xl p-6 ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
            <div className="mb-4">
              <h2 className={`text-lg font-semibold ${isLight ? 'text-black' : 'text-white'}`}>Price History</h2>
            </div>
            <PriceChart data={priceHistory} />
          </div>
          
          {/* Market Context Button */}
          <div className={`rounded-xl p-4 border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
            <motion.button
              className={`w-full text-left font-medium transition-colors ${isLight ? 'text-black hover:text-gray-700' : 'text-gray-300 hover:text-white'}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Market Context
            </motion.button>
          </div>
          
          {/* Probability Display - Combined Button with Orderbook Dropdown */}
          <div className={`rounded-xl p-4 border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
            <div className="relative">
              {/* Combined YES/NO Button - Split by percentage */}
              <motion.button
                onClick={() => setOpenOrderbook(openOrderbook ? null : 'combined')}
                className="w-full rounded-lg p-4 text-left relative overflow-hidden transition-colors"
                style={{
                  background: `linear-gradient(to right, rgba(34, 197, 94, 0.4) ${yesPrice}%, rgba(220, 38, 38, 0.4) ${yesPrice}%)`
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Visual split indicator */}
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <div 
                    className="h-full w-0.5 bg-gray-600 opacity-70"
                    style={{ left: `${yesPrice}%` }}
                  />
                </div>
                
                <div className="relative z-10 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-green-400 font-medium">YES</div>
                    <div className={`text-3xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>{yesPrice}¢</div>
                    <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{yesPrice}%</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{noPrice}%</div>
                    <div className={`text-3xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>{noPrice}¢</div>
                    <div className="text-xs text-red-600 font-medium">NO</div>
                  </div>
                </div>
                
                <div className="relative z-10 flex items-center justify-center mt-6">
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${openOrderbook ? 'rotate-180' : ''} ${isLight ? 'text-gray-600' : 'text-gray-400'}`}
                  />
                </div>
              </motion.button>
              
              {/* Combined Orderbook Dropdown */}
              <AnimatePresence>
                {openOrderbook && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      mass: 0.8
                    }}
                    className={`absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden z-10 border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-700'}`}
                  >
                    {/* YES Order Book Section */}
                    <div className={`p-3 bg-green-500/10 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                      <div className="text-sm font-semibold text-green-400">YES Order Book</div>
                    </div>
                    <div>
                      {/* Sell Orders (Asks) */}
                      <div className={`p-3 space-y-1 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                        <div className={`text-xs mb-2 font-medium ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Sell Orders</div>
                        {orderBook.yes.sell.map((order, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span className="text-red-400 font-medium">{Math.round(order.price * 100)}¢</span>
                            <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>{order.shares}</span>
                          </div>
                        ))}
                      </div>
                      {/* Current Price */}
                      <div className={`p-3 border-y ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-semibold ${isLight ? 'text-black' : 'text-white'}`}>Current</span>
                          <span className="text-lg font-bold text-green-400">{yesPrice}¢</span>
                        </div>
                      </div>
                      {/* Buy Orders (Bids) */}
                      <div className="p-3 space-y-1">
                        <div className={`text-xs mb-2 font-medium ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Buy Orders</div>
                        {orderBook.yes.buy.map((order, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span className="text-green-400 font-medium">{Math.round(order.price * 100)}¢</span>
                            <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>{order.shares}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className={`h-px ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`} />
                    
                    {/* NO Order Book Section */}
                    <div className={`p-3 bg-red-500/10 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                      <div className="text-sm font-semibold text-red-600">NO Order Book</div>
                    </div>
                    <div>
                      {/* Sell Orders (Asks) */}
                      <div className={`p-3 space-y-1 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                        <div className={`text-xs mb-2 font-medium ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Sell Orders</div>
                        {orderBook.no.sell.map((order, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span className="text-red-400 font-medium">{Math.round(order.price * 100)}¢</span>
                            <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>{order.shares}</span>
                          </div>
                        ))}
                      </div>
                      {/* Current Price */}
                      <div className={`p-3 border-y ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-semibold ${isLight ? 'text-black' : 'text-white'}`}>Current</span>
                          <span className="text-lg font-bold text-red-600">{noPrice}¢</span>
                        </div>
                      </div>
                      {/* Buy Orders (Bids) */}
                      <div className="p-3 space-y-1">
                        <div className={`text-xs mb-2 font-medium ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Buy Orders</div>
                        {orderBook.no.buy.map((order, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span className="text-green-400 font-medium">{Math.round(order.price * 100)}¢</span>
                            <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>{order.shares}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Right Column: Trading Panel */}
        <div className="lg:col-span-1">
          <div className={`rounded-xl p-6 sticky top-20 border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
            {/* Buy/Sell Text Labels */}
            <div className="flex gap-4 mb-4">
              <span className={`text-lg font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Buy</span>
              <span className={`text-lg font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Sell</span>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* YES/NO Toggle with Underline Indicator */}
            <div className="relative grid grid-cols-2 gap-2 mb-4 pb-1">
              <button
                onClick={() => setSide("yes")}
                className={`py-3 rounded-lg font-semibold transition relative z-10 ${
                  side === "yes"
                    ? "bg-green-600 text-white"
                    : isLight ? "bg-gray-200 text-gray-600 hover:text-black" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                YES
              </button>
              <button
                onClick={() => setSide("no")}
                className={`py-3 rounded-lg font-semibold transition relative z-10 ${
                  side === "no"
                    ? "bg-red-600 text-white"
                    : isLight ? "bg-gray-200 text-gray-600 hover:text-black" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                NO
              </button>
              {/* Underline indicator */}
              <div 
                className={`absolute bottom-0 h-1 transition-all duration-300 ${
                  side === "yes" ? "bg-green-600" : "bg-red-600"
                }`}
                style={{
                  left: side === "yes" ? "0" : "calc(50% + 0.25rem)",
                  width: "calc(50% - 0.25rem)",
                }}
              />
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className={`block text-sm mb-2 ${isLight ? 'text-gray-700' : 'text-gray-400'}`}>
                {orderType === "buy" ? "Amount USD" : "Shares to Sell"}
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={orderType === "buy" ? "0.00" : "0"}
                className={`w-full px-4 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border ${
                  isLight 
                    ? 'bg-white border-gray-300 text-black placeholder-gray-400' 
                    : 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                }`}
              />
              {orderType === "sell" && maxSell > 0 && (
                <div className={`text-xs mt-1.5 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  Max: {maxSell.toFixed(2)} shares
                </div>
              )}
            </div>

            {/* Order Summary */}
            {amount && parseFloat(amount) > 0 && (
              <div className={`mb-4 p-4 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-800/50 border-gray-700'}`}>
                <div className={`text-sm mb-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Order Summary</div>
                {orderType === "buy" && sharesReceived && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Price:</span>
                      <span className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>{Math.round(price * 100)}¢</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>You'll receive:</span>
                      <span className="text-green-400 font-bold">{sharesReceived} shares</span>
                    </div>
                    <div className={`flex justify-between pt-2 border-t ${isLight ? 'border-gray-300' : 'border-gray-700'}`}>
                      <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Total cost:</span>
                      <span className={`font-semibold ${isLight ? 'text-black' : 'text-white'}`}>${parseFloat(amount).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {orderType === "sell" && usdReceived && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Price:</span>
                      <span className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>{Math.round(price * 100)}¢</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>You'll receive:</span>
                      <span className="text-green-400 font-bold">${usdReceived}</span>
                    </div>
                    <div className={`flex justify-between pt-2 border-t ${isLight ? 'border-gray-300' : 'border-gray-700'}`}>
                      <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Shares selling:</span>
                      <span className={`font-semibold ${isLight ? 'text-black' : 'text-white'}`}>{parseFloat(amount).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleOrder}
              disabled={submitting || m.resolution || !amount || parseFloat(amount) <= 0}
              className={`w-full py-3.5 rounded-lg font-semibold text-white transition ${
                orderType === "buy"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-orange-600 hover:bg-orange-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting
                ? "Processing..."
                : m.resolution
                ? "Contract Resolved"
                : `${orderType === "buy" ? "Buy" : "Sell"} ${side.toUpperCase()}`}
            </button>

            {!userEmail && (
              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Log in to trade
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat, Holders, Activity Tabs Section with Related News */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <ContractTabs contractId={id} userEmail={userEmail} />
        </div>
        <div className="lg:col-span-1">
          <ContractNews contractId={id} />
        </div>
      </div>
    </main>
  );
}

// Contract Tabs Component (Chat, Biggest Holder, Activity)
function ContractTabs({ contractId, userEmail }) {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = React.useState("chat");
  const [holders, setHolders] = React.useState([]);
  const [activity, setActivity] = React.useState([]);
  const [loadingHolders, setLoadingHolders] = React.useState(false);
  const [loadingActivity, setLoadingActivity] = React.useState(false);

  React.useEffect(() => {
    if (activeTab === "holders") {
      loadHolders();
    } else if (activeTab === "activity") {
      loadActivity();
    }
  }, [activeTab, contractId]);

  async function loadHolders() {
    if (holders.length > 0) return; // Already loaded
    setLoadingHolders(true);
    try {
      const r = await fetch(getApiUrl(`/api/contracts/${encodeURIComponent(contractId)}/holders`));
      const j = await r.json();
      if (j.ok) {
        setHolders(j.data || []);
      }
    } catch (e) {
      console.error("Failed to load holders:", e);
    } finally {
      setLoadingHolders(false);
    }
  }

  async function loadActivity() {
    if (activity.length > 0) return; // Already loaded
    setLoadingActivity(true);
    try {
      const r = await fetch(getApiUrl(`/api/contracts/${encodeURIComponent(contractId)}/activity`));
      const j = await r.json();
      if (j.ok) {
        setActivity(j.data || []);
      }
    } catch (e) {
      console.error("Failed to load activity:", e);
    } finally {
      setLoadingActivity(false);
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

  return (
    <div className={`rounded-xl overflow-hidden border-2 ${isLight ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
      {/* Tab Navigation */}
      <div className={`border-b flex ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
        <button
          onClick={() => setActiveTab("chat")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                activeTab === "chat"
                  ? `${isLight ? 'text-black' : 'text-white'} border-b-2 border-blue-500 ${isLight ? 'bg-gray-50' : 'bg-gray-800/50'}`
                  : isLight ? "text-gray-600 hover:text-black" : "text-gray-400 hover:text-white"
              }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("holders")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                activeTab === "holders"
                  ? `${isLight ? 'text-black' : 'text-white'} border-b-2 border-blue-500 ${isLight ? 'bg-gray-50' : 'bg-gray-800/50'}`
                  : isLight ? "text-gray-600 hover:text-black" : "text-gray-400 hover:text-white"
              }`}
        >
          Biggest Holder
        </button>
        <button
          onClick={() => setActiveTab("activity")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                activeTab === "activity"
                  ? `${isLight ? 'text-black' : 'text-white'} border-b-2 border-blue-500 ${isLight ? 'bg-gray-50' : 'bg-gray-800/50'}`
                  : isLight ? "text-gray-600 hover:text-black" : "text-gray-400 hover:text-white"
              }`}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "chat" && (
          <Chat contractId={contractId} userEmail={userEmail} />
        )}
        
        {activeTab === "holders" && (
          <div>
            <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Top Holders</h2>
            {loadingHolders ? (
              <div className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Loading holders...</div>
            ) : holders.length === 0 ? (
              <div className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>No holders yet.</div>
            ) : (
              <div className="space-y-3">
                {holders.map((holder, index) => (
                  <div
                    key={holder.email}
                    className={`flex items-center justify-between p-4 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-800/50 border-gray-700'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>
                          {holder.username || holder.email.split("@")[0]}
                        </div>
                        <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{holder.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${isLight ? 'text-black' : 'text-white'}`}>
                        {holder.contracts.toFixed(2)} contracts
                      </div>
                      <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        ${holder.value.toFixed(2)} value
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === "activity" && (
          <div>
            <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Recent Activity</h2>
            {loadingActivity ? (
              <div className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Loading activity...</div>
            ) : activity.length === 0 ? (
              <div className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>No activity yet.</div>
            ) : (
              <div className="space-y-3">
                {activity.map((order) => (
                  <div
                    key={order.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-800/50 border-gray-700'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        order.type === "buy"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {order.type === "buy" ? "B" : "S"}
                      </div>
                      <div>
                        <div className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>
                          {order.username || order.email.split("@")[0]}
                        </div>
                        <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                          {order.type === "buy" ? "Bought" : "Sold"} {order.side.toUpperCase()} at {Math.round(order.price * 100)}¢
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${isLight ? 'text-black' : 'text-white'}`}>
                        ${order.amountUsd.toFixed(2)}
                      </div>
                      <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        {formatTime(order.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
