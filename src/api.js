// API base URL configuration
// In production, this should be your Render backend URL
// In development, it uses the Vite proxy (empty string = relative path)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
    return `${API_BASE_URL}${cleanEndpoint}`;
  } else {
    // Development: use relative path (Vite proxy will handle it)
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

