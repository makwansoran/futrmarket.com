/**
 * Session ID Management
 * Generates a unique session ID per browser instance to ensure complete isolation
 */

// Generate a unique session ID that persists for this browser tab/instance only
let sessionId = null;

export function getSessionId() {
  if (!sessionId) {
    // Try to get from sessionStorage first (survives page refresh but not new tab)
    sessionId = sessionStorage.getItem('futrmarket_session_id');
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = generateUniqueId();
      sessionStorage.setItem('futrmarket_session_id', sessionId);
    }
  }
  
  return sessionId;
}

function generateUniqueId() {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: timestamp + random + performance.now for uniqueness
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}_${performance.now().toString(36).slice(2)}`;
}

// Reset session ID (for testing or logout scenarios)
export function resetSessionId() {
  sessionId = null;
  sessionStorage.removeItem('futrmarket_session_id');
}

// Get session ID for logging/debugging (only in dev mode)
export function getSessionIdForDebug() {
  if (import.meta.env.DEV) {
    return getSessionId();
  }
  return 'hidden';
}

