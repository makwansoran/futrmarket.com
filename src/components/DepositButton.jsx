import React from "react"
import { X, Copy, Check, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react"
import { getApiUrl } from "/src/api.js"

export default function DepositButton({ userEmail, onBalanceUpdate }) {
  const [open, setOpen] = React.useState(false)
  const [asset, setAsset] = React.useState("USDC")
  const [addr, setAddr] = React.useState("")
  const [qr, setQr] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [deposits, setDeposits] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [scanning, setScanning] = React.useState(false)
  const [lastScan, setLastScan] = React.useState(null)
  const disabled = !userEmail

  async function loadAddress(a="USDC"){
    if (!userEmail) return
    const u = getApiUrl(`/api/wallet/address?email=${encodeURIComponent(userEmail)}&asset=${encodeURIComponent(a)}`)
    const r = await fetch(u)
    const j = await r.json().catch(()=>({}))
    if (j?.ok) { setAddr(j.data.address); setQr(j.data.qrDataUrl||"") }
  }

  async function loadDeposits(){
    if (!userEmail) return
    setLoading(true)
    try {
      const r = await fetch(getApiUrl(`/api/deposits?email=${encodeURIComponent(userEmail)}`))
      const j = await r.json().catch(()=>({}))
      if (j?.ok) setDeposits(j.data || [])
    } catch(e) {
      console.error("Failed to load deposits:", e)
    } finally {
      setLoading(false)
    }
  }

  async function scanForDeposits(){
    if (!userEmail || scanning) return
    setScanning(true)
    try {
      const r = await fetch(getApiUrl("/api/deposits/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      })
      const j = await r.json().catch(()=>({}))
      if (j?.ok) {
        setLastScan(Date.now())
        if (j.data.newDeposits?.length > 0) {
          await loadDeposits()
          // Update balance in parent
          if (onBalanceUpdate) {
            const balanceR = await fetch(getApiUrl(`/api/balances?email=${encodeURIComponent(userEmail)}`))
            const balanceJ = await balanceR.json().catch(()=>({}))
            if (balanceJ?.ok) onBalanceUpdate(balanceJ.data)
          }
        }
      }
    } catch(e) {
      console.error("Scan failed:", e)
    } finally {
      setScanning(false)
    }
  }

  React.useEffect(()=>{ 
    if(open) {
      loadAddress(asset)
      loadDeposits()
      // Auto-scan when modal opens
      scanForDeposits()
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, asset])

  // Auto-refresh deposits every 10 seconds when modal is open
  React.useEffect(()=>{
    if (!open || !userEmail) return
    const interval = setInterval(()=>{
      scanForDeposits()
    }, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userEmail])

  const copyAddress = async () => {
    if (!addr) return
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const formatDate = (ts) => {
    if (!ts) return "—"
    const d = new Date(ts)
    return d.toLocaleString()
  }

  const explorerUrl = (txHash) => {
    return `https://etherscan.io/tx/${txHash}`
  }

  return (
    <>
      <button
        data-deposit-button
        onClick={()=>setOpen(true)}
        disabled={disabled}
        className={"px-3 py-2 rounded-lg text-sm font-medium border border-gray-700 hover:bg-gray-800 "+(disabled?"opacity-50 cursor-not-allowed":"")}
        title={disabled?"Log in first":""}
      >
        Deposit
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setOpen(false)}></div>

          <div className="relative w-full max-w-xl mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ height: 'auto', maxHeight: '100vh', transform: 'translateY(50%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">Deposit Funds</h3>
              <button
                onClick={()=>setOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-visible">
              {/* Asset Selection */}
              <div>
                <label className="text-xs text-gray-300 mb-2 block">Select Asset</label>
                <select
                  value={asset}
                  onChange={e=>setAsset(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="USDC">USDC (Ethereum)</option>
                  <option value="ETH">ETH (Ethereum)</option>
                </select>
              </div>

              {/* Deposit Address */}
              <div>
                <label className="text-xs text-gray-300 mb-2 block">Deposit Address</label>
                <div className="flex items-center gap-2">
                  <input
                    value={addr||""}
                    readOnly
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 font-mono text-xs text-white"
                  />
                  <button
                    onClick={copyAddress}
                    className="px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-xs text-white flex items-center gap-1 transition"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Send only {asset} to this address. Sending other assets may result in permanent loss.
                </p>
              </div>

              {/* QR Code */}
              {qr && (
                <div className="flex flex-col items-center py-1">
                  <div className="bg-white p-2 rounded-lg">
                    <img src={qr} alt="QR Code" className="w-32 h-32" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Scan with your wallet app to deposit
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>Minimum deposit: $10 USD</strong> (excluding gas fees)<br/>
                  Applies to all cryptocurrencies. Amount is converted to USD equivalent at time of processing.
                </p>
              </div>

              {/* Scan Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-gray-400">
                  {lastScan ? `Last checked: ${new Date(lastScan).toLocaleTimeString()}` : "Click to check for deposits"}
                </div>
                <button
                  onClick={scanForDeposits}
                  disabled={scanning}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
                  {scanning ? "Scanning..." : "Check"}
                </button>
              </div>

              {/* Transaction History */}
              <div className="flex-shrink-0">
                <h4 className="text-xs font-semibold text-white mb-2">Recent Deposits</h4>
                {loading ? (
                  <div className="text-center py-2 text-gray-400 text-xs">Loading...</div>
                ) : deposits.length === 0 ? (
                  <div className="text-center py-2 text-gray-500 text-xs">
                    No deposits yet. Send {asset} to the address above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deposits.slice(0, 2).map((dep) => (
                      <div key={dep.id || dep.txHash} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 size={12} className="text-green-500" />
                              <span className="text-white font-medium text-xs">{dep.asset}</span>
                              <span className="text-gray-400 text-xs">${dep.amountUSD?.toFixed(2) || dep.amount?.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="text-xs">{formatDate(dep.timestamp)}</span>
                              {dep.txHash && (
                                <a
                                  href={explorerUrl(dep.txHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                                >
                                  View
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 text-xs font-medium">Confirmed</div>
                            {dep.blockNumber && (
                              <div className="text-xs text-gray-500">#{dep.blockNumber}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
