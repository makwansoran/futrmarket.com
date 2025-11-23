import { getApiUrl } from '/src/api.js';

/**
 * Markets store: loads contracts from API
 */
export async function fetchMarkets() {
  try {
    // Try API first (new contract system)
    // Add cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    const apiUrl = getApiUrl(`/api/contracts?_t=${timestamp}`);
    console.log("🔵 Fetching contracts from:", apiUrl);
    
    const res = await fetch(apiUrl, { 
      cache: "no-store",
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log("🔵 Contracts API response status:", res.status, res.statusText);
    
    if (res.ok) {
      const j = await res.json();
      console.log("🔵 Contracts API response:", j);
      
      if (j.ok && Array.isArray(j.data)) {
        console.log("🔵 Found", j.data.length, "contracts from API");
        
        // Check for duplicates in API response
        const apiIds = j.data.map(c => c?.id).filter(Boolean);
        const uniqueApiIds = new Set(apiIds);
        if (apiIds.length !== uniqueApiIds.size) {
          console.error("🔵 ERROR: API returned duplicate contracts! Total:", apiIds.length, "Unique:", uniqueApiIds.size);
          const duplicates = apiIds.filter((id, idx) => apiIds.indexOf(id) !== idx);
          console.error("🔵 Duplicate IDs:", duplicates);
        }
        
        // Transform contract format to market format for compatibility
        // Filter out invalid contracts (missing ID or invalid ID format)
        const transformed = j.data
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
            competitionId: c.competitionId || null, // Include competitionId for filtering
            subjectId: c.subjectId || null // Include subjectId for filtering
          }));
        
        // Deduplicate by ID AND question - keep only the first occurrence of each contract
        // This prevents duplicates even if they have different IDs but same question
        const deduplicated = [];
        const seenIds = new Set();
        const seenQuestions = new Set();
        for (const contract of transformed) {
          const contractId = String(contract.id || "").trim().toLowerCase();
          const contractQuestion = String(contract.question || "").trim().toLowerCase();
          
          // Check for duplicate ID
          if (seenIds.has(contractId)) {
            console.error("🔵 REMOVED DUPLICATE ID from transformed data:", contract.id, contract.question);
            continue;
          }
          
          // Check for duplicate question (even if different ID)
          if (contractQuestion && seenQuestions.has(contractQuestion)) {
            console.error("🔵 REMOVED DUPLICATE QUESTION from transformed data:", contract.question, "ID:", contract.id);
            continue;
          }
          
          seenIds.add(contractId);
          if (contractQuestion) seenQuestions.add(contractQuestion);
          deduplicated.push(contract);
        }
        
        console.log("🔵 After deduplication:", deduplicated.length, "contracts");
        return deduplicated;
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
