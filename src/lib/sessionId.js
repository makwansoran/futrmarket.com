/**
 * Session ID Management
 * Generates a unique session ID per browser instance to ensure complete isolation
 */

// Generate a unique session ID that persists for this browser tab/instance only
let sessionId = null;

export function getSessionId() {
  if (!sessionId) {
    // Check if we're in a browser environment (not SSR/build time)
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      // Try to get from sessionStorage first (survives page refresh but not new tab)
      try {
        sessionId = sessionStorage.getItem('futrmarket_session_id');
      } catch (e) {
        // sessionStorage might not be available (private mode, etc.)
        console.warn('sessionStorage not available:', e);
      }
    }
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = generateUniqueId();
      
      // Try to save to sessionStorage if available
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('futrmarket_session_id', sessionId);
        } catch (e) {
          // sessionStorage might not be available
          console.warn('Could not save sessionId to sessionStorage:', e);
        }
      }
    }
  }
  
  return sessionId;
}

function generateUniqueId() {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // crypto.randomUUID might fail in some environments
      console.warn('crypto.randomUUID failed:', e);
    }
  }
  
  // Fallback: timestamp + random + performance.now for uniqueness
  const perfNow = typeof performance !== 'undefined' && performance.now 
    ? performance.now().toString(36).slice(2) 
    : Math.random().toString(36).slice(2, 8);
  
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}_${perfNow}`;
}

// Reset session ID (for testing or logout scenarios)
export function resetSessionId() {
  sessionId = null;
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem('futrmarket_session_id');
    } catch (e) {
      // sessionStorage might not be available
      console.warn('Could not remove sessionId from sessionStorage:', e);
    }
  }
}

// Get session ID for logging/debugging (only in dev mode)
export function getSessionIdForDebug() {
  if (import.meta.env.DEV) {
    return getSessionId();
  }
  return 'hidden';
}

