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
        
        // Log first contract to see structure
        if (j.data.length > 0) {
          console.log("🔵 Sample contract from API:", {
            id: j.data[0].id,
            question: j.data[0].question,
            imageUrl: j.data[0].imageUrl,
            image_url: j.data[0].image_url,
            hasImageUrl: !!j.data[0].imageUrl,
            hasImage_url: !!j.data[0].image_url,
            allKeys: Object.keys(j.data[0])
          });
        }
        
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
          .map(c => {
            // Check all possible image field names - be very explicit
            const imageUrl = c.imageUrl || c.image_url || c.image || null;
            
            // Log contracts with images for debugging
            if (imageUrl) {
              console.log("🖼️✅ Contract HAS image:", {
                id: c.id,
                question: c.question?.substring(0, 40),
                imageUrl_fromAPI: c.imageUrl,
                image_url_fromAPI: c.image_url,
                image_fromAPI: c.image,
                finalImageUrl: imageUrl,
                allImageKeys: Object.keys(c).filter(k => k.toLowerCase().includes('image'))
              });
            }
            
            return {
              id: String(c.id), // Ensure ID is always a string
              question: c.question || "",
              category: c.category || "General",
              yesPrice: c.yesPrice || 0.5,
              noPrice: c.noPrice || 0.5,
              volume: c.volume || "$0",
              traders: c.traders || 0,
              ends: c.expirationDate ? new Date(c.expirationDate).toLocaleDateString() : null,
              image: imageUrl,
              imageUrl: imageUrl, // CRITICAL: Set imageUrl explicitly
              image_url: imageUrl, // Also include as image_url for compatibility
              description: c.description,
              resolution: c.resolution,
              createdAt: c.createdAt,
              featured: c.featured || false,
              expirationDate: c.expirationDate,
              status: c.status || null,
              competitionId: c.competitionId || null, // Include competitionId for filtering
              subjectId: c.subjectId || null // Include subjectId for filtering
            };
          });
        
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
      
      // Check if we got HTML instead of JSON (common when API URL is wrong)
      if (errorText && errorText.trim().startsWith('<!DOCTYPE')) {
        console.error("❌ API returned HTML instead of JSON! This means:");
        console.error("   1. VITE_API_URL is not set correctly in Vercel");
        console.error("   2. Or the Railway backend URL is wrong");
        console.error("   3. Current API URL:", apiUrl);
        console.error("   Fix: Set VITE_API_URL in Vercel → Settings → Environment Variables");
        console.error("   Should be: https://futrmarket-api-production-15ea.up.railway.app");
      }
      
      // Don't fallback - API is the source of truth
      // If API fails, return empty array (admin-created contracts won't show until API is fixed)
      return [];
    }
  } catch (e) {
    console.error("🔵 Error fetching markets:", e);
    if (e.message && e.message.includes("Unexpected token '<'")) {
      console.error("❌ Got HTML instead of JSON! Check VITE_API_URL in Vercel environment variables.");
    }
    return [];
  }
}
