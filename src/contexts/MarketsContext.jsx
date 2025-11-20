import React from "react";
import { fetchMarkets } from "../marketsStore.js";

/**
 * MarketsContext - Single source of truth for contracts/markets data
 * 
 * This context manages:
 * - List of all contracts/markets
 * - Loading state
 * - Error state
 * - Refresh mechanism
 */
const MarketsContext = React.createContext(null);

export function MarketsProvider({ children }) {
  const [markets, setMarkets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lastRefresh, setLastRefresh] = React.useState(null);

  // Load markets from API
  const loadMarkets = React.useCallback(async (signal = null) => {
    try {
      setError(null);
      const controller = signal || new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const marketsData = await fetchMarkets();
      
      clearTimeout(timeoutId);
      
      if (!signal || !signal.aborted) {
        setMarkets(Array.isArray(marketsData) ? marketsData : []);
        setLastRefresh(Date.now());
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Failed to load markets:", e);
        setError(e.message || "Failed to load markets");
        // Don't clear markets on error - keep showing last known data
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      await loadMarkets(controller.signal);
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadMarkets]);

  // Periodic refresh (every 30 seconds for faster updates)
  React.useEffect(() => {
    let cancelled = false;
    const interval = setInterval(() => {
      if (!cancelled) {
        loadMarkets().catch((e) => {
          console.error("Failed to refresh markets:", e);
        });
      }
    }, 30000); // Every 30 seconds (reduced from 60 for faster updates)
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadMarkets]);

  // Manual refresh function
  const refresh = React.useCallback(async () => {
    setLoading(true);
    await loadMarkets();
  }, [loadMarkets]);

  // Get market by ID
  const getMarketById = React.useCallback((id) => {
    if (!id || !Array.isArray(markets)) return null;
    return markets.find(m => m.id === id) || null;
  }, [markets]);

  const value = React.useMemo(() => ({
    // State
    markets: Array.isArray(markets) ? markets : [],
    loading,
    error,
    lastRefresh,
    
    // Actions
    refresh,
    getMarketById,
  }), [markets, loading, error, lastRefresh, refresh, getMarketById]);

  return <MarketsContext.Provider value={value}>{children}</MarketsContext.Provider>;
}

export function useMarkets() {
  const context = React.useContext(MarketsContext);
  if (!context) {
    throw new Error("useMarkets must be used within MarketsProvider");
  }
  return context;
}

