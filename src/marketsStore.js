import { getApiUrl } from '/src/api.js';

/**
 * Markets store: loads contracts from API
 */
export async function fetchMarkets() {
  try {
    // Try API first (new contract system)
    const apiUrl = getApiUrl("/api/contracts");
    console.log("🔵 Fetching contracts from:", apiUrl);
    
    const res = await fetch(apiUrl, { cache: "no-store" });
    console.log("🔵 Contracts API response status:", res.status, res.statusText);
    
    if (res.ok) {
      const j = await res.json();
      console.log("🔵 Contracts API response:", j);
      
      if (j.ok && Array.isArray(j.data)) {
        console.log("🔵 Found", j.data.length, "contracts");
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
      } else {
        console.warn("🔵 API response not ok or data not array:", j);
      }
    } else {
      const errorText = await res.text().catch(() => "");
      console.error("🔵 Contracts API error:", res.status, errorText);
      // Don't fallback - API is the source of truth
      // If API fails, return empty array (admin-created contracts won't show until API is fixed)
      return [];
    }
  } catch (e) {
    console.error("🔵 Error fetching markets:", e);
    return [];
  }
}
