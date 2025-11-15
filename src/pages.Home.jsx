import React from 'react'
import MarketsPage from './pages.Markets.jsx'

export default function HomePage({ markets = [] }) {
  // Show featured markets on homepage
  return <MarketsPage markets={markets} limit={5} />
}
