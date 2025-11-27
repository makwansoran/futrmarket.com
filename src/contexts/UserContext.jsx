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
  const [userIdentifier, setUserIdentifier] = React.useState(null); // wallet_address or email
  const [cash, setCash] = React.useState(0);
  const [portfolio, setPortfolio] = React.useState(0);
  const [userProfile, setUserProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Helper: determine if identifier is wallet address
  const isWalletAddress = (id) => id && id.startsWith('0x') && id.length === 42;

  // Sync balances from server (source of truth)
  const syncBalancesFromServer = React.useCallback(async (identifier, signal = null) => {
    if (!identifier) return;
    
    try {
      const controller = signal || new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Use wallet_address or email parameter based on identifier type
      const param = isWalletAddress(identifier) ? 'wallet_address' : 'email';
      const r = await fetch(getApiUrl(`/api/balances?${param}=${encodeURIComponent(identifier)}`), {
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
            const posR = await fetch(getApiUrl(`/api/positions?${param}=${encodeURIComponent(identifier)}`), {
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
            await ensureBalances(identifier);
            const localB = await getBalances(identifier);
            if (Number(serverCash) !== Number(localB.cash) || portfolioValue !== Number(localB.portfolio || 0)) {
              await setBalances(identifier, { cash: serverCash, portfolio: portfolioValue });
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
  const loadUserProfile = React.useCallback(async (identifier, signal = null) => {
    if (!identifier) return;
    
    try {
      const controller = signal || new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Use wallet_address or email based on identifier type
      const param = isWalletAddress(identifier) ? 'wallet_address' : 'email';
      const r = await fetch(getApiUrl(`/api/users?${param}=${encodeURIComponent(identifier)}`), {
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
        
        if (!cancelled && session?.identifier) {
          setUserIdentifier(session.identifier);
          await Promise.all([
            syncBalancesFromServer(session.identifier, controller.signal),
            loadUserProfile(session.identifier, controller.signal)
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
    if (!userIdentifier) return;
    
    let cancelled = false;
    const interval = setInterval(() => {
      if (!cancelled) {
        syncBalancesFromServer(userIdentifier).catch((e) => {
          console.error("Failed to sync balances:", e);
        });
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userIdentifier, syncBalancesFromServer]);

  // Login function (accepts wallet_address or email)
  const login = React.useCallback(async (identifier) => {
    try {
      setUserIdentifier(identifier);
      setError(null);
      const controller = new AbortController();
      await Promise.all([
        syncBalancesFromServer(identifier, controller.signal),
        loadUserProfile(identifier, controller.signal)
      ]);
    } catch (e) {
      setError(e.message || "Failed to login");
      throw e;
    }
  }, [syncBalancesFromServer, loadUserProfile]);

  // Logout function
  const logout = React.useCallback(async () => {
    await clearSession();
    setUserIdentifier(null);
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
    } else if (userIdentifier) {
      // Refresh from server
      await syncBalancesFromServer(userIdentifier);
    }
  }, [userIdentifier, syncBalancesFromServer]);

  // Refresh user profile
  const refreshProfile = React.useCallback(async () => {
    if (userIdentifier) {
      await loadUserProfile(userIdentifier);
    }
  }, [userIdentifier, loadUserProfile]);

  // Backward compatibility: userEmail getter
  const userEmail = userIdentifier && !isWalletAddress(userIdentifier) ? userIdentifier : null;
  const walletAddress = userIdentifier && isWalletAddress(userIdentifier) ? userIdentifier : null;

  const value = React.useMemo(() => ({
    // State
    userEmail, // Backward compatibility (null if wallet-only)
    walletAddress, // New primary identifier
    userIdentifier, // wallet_address or email
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
    syncBalancesFromServer: () => userIdentifier && syncBalancesFromServer(userIdentifier),
    loadUserProfile: () => userIdentifier && loadUserProfile(userIdentifier),
  }), [userEmail, walletAddress, userIdentifier, cash, portfolio, userProfile, loading, error, login, logout, updateBalance, refreshProfile, syncBalancesFromServer, loadUserProfile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

