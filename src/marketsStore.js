import { getApiUrl } from '/src/api.js';

/**
 * Markets store: loads contracts from API
 */
export async function fetchMarkets() {
  try {
    // Try API first (new contract system)
    const res = await fetch(getApiUrl("/api/contracts"), { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      if (j.ok && Array.isArray(j.data)) {
        // Transform contract format to market format for compatibility
        return j.data.map(c => ({
          id: c.id,
          question: c.question,
          category: c.category,
          yesPrice: c.yesPrice || 0.5,
          noPrice: c.noPrice || 0.5,
          volume: c.volume || "$0",
          traders: c.traders || 0,
          ends: c.expirationDate ? new Date(c.expirationDate).toLocaleDateString() : null,
          image: c.imageUrl,
          imageUrl: c.imageUrl,
          description: c.description,
          resolution: c.resolution,
          createdAt: c.createdAt,
          featured: c.featured || false,
          expirationDate: c.expirationDate,
          status: c.status || null
        }));
      }
    }
    
    // Fallback to old markets.json
    const fallback = await fetch("/markets.json", { cache: "no-store" });
    if (fallback.ok) {
      const data = await fallback.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch {
    return [];
  }
}
