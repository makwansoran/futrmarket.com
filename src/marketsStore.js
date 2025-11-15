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
        // Filter out invalid contracts (missing ID or invalid ID format)
        return j.data
          .filter(c => {
            // Ensure contract has a valid ID (string or number, not null/undefined)
            if (!c || c.id === null || c.id === undefined) {
              console.warn("🔵 Skipping contract with invalid ID:", c);
              return false;
            }
            // Ensure ID is a valid string or number (not an object or array)
            if (typeof c.id !== 'string' && typeof c.id !== 'number') {
              console.warn("🔵 Skipping contract with non-string/number ID:", c.id, typeof c.id);
              return false;
            }
            return true;
          })
          .map(c => ({
            id: String(c.id), // Ensure ID is always a string
            question: c.question || "",
            category: c.category || "General",
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
            status: c.status || null,
            competitionId: c.competitionId || null // Include competitionId for filtering
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
