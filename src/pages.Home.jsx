import React from 'react'
import MarketsPage from './pages.Markets.jsx'

export default function HomePage({ markets = [] }) {
  // Show all markets on homepage (no limit)
  // Ensure markets is always an array to prevent crashes
  const safeMarkets = Array.isArray(markets) ? markets : [];
  return <MarketsPage markets={safeMarkets} />
}
