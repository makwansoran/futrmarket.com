// API base URL configuration
// In production, this should be your Render backend URL
// In development, it uses the Vite proxy (empty string = relative path)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Check if API URL is still the placeholder
const isPlaceholder = API_BASE_URL.includes('your-render-backend.onrender.com');

// Always log the API configuration in production to help debug
if (!import.meta.env.DEV) {
  console.log("🔵 API Configuration:");
  console.log("   VITE_API_URL:", API_BASE_URL || "(NOT SET - this will cause API calls to fail!)");
  console.log("   Environment:", import.meta.env.MODE);
}

if (isPlaceholder) {
  console.error("❌ VITE_API_URL is set to placeholder! Please set it to your actual Render backend URL.");
  console.error("   Go to Vercel → Settings → Environment Variables");
  console.error("   Set VITE_API_URL to: https://your-actual-backend.onrender.com");
  console.error("   Current value:", API_BASE_URL);
}

// Log API configuration (only in development or if no URL is set)
if (!API_BASE_URL) {
  if (import.meta.env.DEV) {
    console.warn("⚠️ VITE_API_URL not set. API calls will use relative paths. This won't work if frontend and backend are on different domains.");
  } else {
    console.error("❌ CRITICAL: VITE_API_URL is not set in production!");
    console.error("   API calls will fail because frontend (Vercel) and backend (Render) are on different domains.");
    console.error("   Fix: Go to Vercel → Settings → Environment Variables → Add VITE_API_URL");
    console.error("   Value should be your Render backend URL (e.g., https://futrmarket-api.onrender.com)");
  }
}

/**
 * Get the full API URL for a given endpoint
 * @param {string} endpoint - API endpoint (e.g., '/api/send-code')
 * @returns {string} Full URL or relative path
 */
export function getApiUrl(endpoint) {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (API_BASE_URL) {
    // Production: use full backend URL
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    
    // Warn if using placeholder
    if (isPlaceholder) {
      console.error("❌ Using placeholder API URL:", url);
      console.error("   This will fail! Update VITE_API_URL in Vercel environment variables.");
      console.error("   Current VITE_API_URL:", API_BASE_URL);
    }
    
    if (import.meta.env.DEV) {
      console.log("🔵 API URL:", url);
    }
    return url;
  } else {
    // Development: use relative path (Vite proxy will handle it)
    // In production without VITE_API_URL, this will fail if frontend/backend are on different domains
    if (!import.meta.env.DEV) {
      console.error("❌ VITE_API_URL not set in production! API calls will fail.");
      console.error("   Set VITE_API_URL in Vercel → Settings → Environment Variables");
      console.error("   Using relative path:", cleanEndpoint, "- this won't work across domains!");
    }
    return cleanEndpoint;
  }
}

/**
 * Make an API request with proper error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
}

