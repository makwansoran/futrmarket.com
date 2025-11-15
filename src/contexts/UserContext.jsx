import React from "react";
import { loadSession, clearSession, getBalances, setBalances, ensureBalances } from "../lib.session.js";
import { getApiUrl } from "../api.js";

/**
 * UserContext - Single source of truth for user account data
 * 
 * This context manages:
 * - User email/session
 * - Cash balance
 * - Portfolio value
 * - User profile (username, profilePicture)
 * 
 * All components should read from this context instead of managing their own state.
 */
const UserContext = React.createContext(null);

export function UserProvider({ children }) {
  const [userEmail, setUserEmail] = React.useState(null);
  const [cash, setCash] = React.useState(0);
  const [portfolio, setPortfolio] = React.useState(0);
  const [userProfile, setUserProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Sync balances from server (source of truth)
  const syncBalancesFromServer = React.useCallback(async (email, signal = null) => {
    if (!email) return;
    
    try {
      const controller = signal || new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Fetch balances
      const r = await fetch(getApiUrl(`/api/balances?email=${encodeURIComponent(email)}`), {
        signal: controller.signal,
        cache: "no-store"
      });
      clearTimeout(timeoutId);
      
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j?.ok && j.data) {
          const serverCash = Number(j.data.cash || 0);
          setCash(serverCash);
          
          // Calculate portfolio from positions
          let portfolioValue = Number(j.data.portfolio || 0);
          try {
            const posController = signal || new AbortController();
            const posTimeoutId = setTimeout(() => posController.abort(), 10000);
            const posR = await fetch(getApiUrl(`/api/positions?email=${encodeURIComponent(email)}`), {
              signal: posController.signal,
              cache: "no-store"
            });
            clearTimeout(posTimeoutId);
            
            const posJ = await posR.json().catch(() => ({}));
            if (posJ?.ok && posJ.data?.portfolioValue != null) {
              portfolioValue = Number(posJ.data.portfolioValue || 0);
            }
          } catch (e) {
            if (e.name !== "AbortError") {
              console.error("Failed to load positions:", e);
            }
          }
          
          setPortfolio(portfolioValue);
          
          // Update local storage to match server
          try {
            await ensureBalances(email);
            const localB = await getBalances(email);
            if (Number(serverCash) !== Number(localB.cash) || portfolioValue !== Number(localB.portfolio || 0)) {
              await setBalances(email, { cash: serverCash, portfolio: portfolioValue });
            }
          } catch (e) {
            console.error("Failed to update local balances:", e);
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Failed to sync balances:", e);
        setError(e.message || "Failed to sync balances");
      }
    }
  }, []);

  // Load user profile from server
  const loadUserProfile = React.useCallback(async (email, signal = null) => {
    if (!email) return;
    
    try {
      const controller = signal || new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const r = await fetch(getApiUrl(`/api/users/${encodeURIComponent(email)}`), {
        signal: controller.signal,
        cache: "no-store"
      });
      clearTimeout(timeoutId);
      
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j?.ok && j.data) {
          setUserProfile(j.data);
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Failed to load user profile:", e);
      }
    }
  }, []);

  // Initialize: Load session and sync data
  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const session = await loadSession();
        
        if (!cancelled && session?.email) {
          setUserEmail(session.email);
          await Promise.all([
            syncBalancesFromServer(session.email, controller.signal),
            loadUserProfile(session.email, controller.signal)
          ]);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to restore session:", e);
          setError(e.message || "Failed to restore session");
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
  }, [syncBalancesFromServer, loadUserProfile]);

  // Periodically sync balances when logged in
  React.useEffect(() => {
    if (!userEmail) return;
    
    let cancelled = false;
    const interval = setInterval(() => {
      if (!cancelled) {
        syncBalancesFromServer(userEmail).catch((e) => {
          console.error("Failed to sync balances:", e);
        });
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userEmail, syncBalancesFromServer]);

  // Login function
  const login = React.useCallback(async (email) => {
    try {
      setUserEmail(email);
      setError(null);
      const controller = new AbortController();
      await Promise.all([
        syncBalancesFromServer(email, controller.signal),
        loadUserProfile(email, controller.signal)
      ]);
    } catch (e) {
      setError(e.message || "Failed to login");
      throw e;
    }
  }, [syncBalancesFromServer, loadUserProfile]);

  // Logout function
  const logout = React.useCallback(async () => {
    await clearSession();
    setUserEmail(null);
    setCash(0);
    setPortfolio(0);
    setUserProfile(null);
    setError(null);
  }, []);

  // Update balance (called after trades, deposits, etc.)
  const updateBalance = React.useCallback(async (newBalance) => {
    if (newBalance) {
      setCash(Number(newBalance.cash || 0));
      setPortfolio(Number(newBalance.portfolio || 0));
    } else if (userEmail) {
      // Refresh from server
      await syncBalancesFromServer(userEmail);
    }
  }, [userEmail, syncBalancesFromServer]);

  // Refresh user profile
  const refreshProfile = React.useCallback(async () => {
    if (userEmail) {
      await loadUserProfile(userEmail);
    }
  }, [userEmail, loadUserProfile]);

  const value = React.useMemo(() => ({
    // State
    userEmail,
    cash,
    portfolio,
    userProfile,
    loading,
    error,
    
    // Actions
    login,
    logout,
    updateBalance,
    refreshProfile,
    syncBalancesFromServer: () => userEmail && syncBalancesFromServer(userEmail),
    loadUserProfile: () => userEmail && loadUserProfile(userEmail),
  }), [userEmail, cash, portfolio, userProfile, loading, error, login, logout, updateBalance, refreshProfile, syncBalancesFromServer, loadUserProfile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

