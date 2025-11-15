import React from 'react'
import MarketsPage from './pages.Markets.jsx'

export default function HomePage({ markets = [] }) {
  // Show featured markets on homepage
  // Ensure markets is always an array to prevent crashes
  const safeMarkets = Array.isArray(markets) ? markets : [];
  return <MarketsPage markets={safeMarkets} limit={5} />
}
