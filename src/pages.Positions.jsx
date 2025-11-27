import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Plus, Minus, BarChart3, Clock, DollarSign } from "lucide-react";
import { getApiUrl } from "/src/api.js";
import { useUser } from "./contexts/UserContext.jsx";

export default function PositionsPage() {
  const navigate = useNavigate();
  const { userEmail, cash, portfolio } = useUser();
  const [positions, setPositions] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("positions"); // "positions" or "orders"
  const [chartData, setChartData] = React.useState([]);

  React.useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }
    loadData();
  }, [userEmail, navigate]);

  async function loadData() {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      setError("");
      
      // Load positions and orders in parallel
      const [positionsRes, ordersRes] = await Promise.all([
        fetch(getApiUrl(`/api/positions?email=${encodeURIComponent(userEmail)}`)),
        fetch(getApiUrl(`/api/orders?email=${encodeURIComponent(userEmail)}`))
      ]);
      
      const positionsData = await positionsRes.json();
      const ordersData = await ordersRes.json();
      
      if (positionsData.ok) {
        setPositions(positionsData.data.positions || []);
        
        // Generate chart data from orders (portfolio value over time)
        if (ordersData.ok && ordersData.data) {
          generateChartData(ordersData.data);
        }
      } else {
        setError(positionsData.error || "Failed to load positions");
      }
      
      if (ordersData.ok) {
        setOrders(ordersData.data || []);
      }
    } catch (e) {
      console.error("Error loading positions:", e);
      setError("Failed to load positions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function generateChartData(ordersList) {
    // Sort orders by timestamp
    const sortedOrders = [...ordersList].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate cumulative portfolio value
    let runningValue = 0;
    const data = sortedOrders.map(order => {
      if (order.type === "buy") {
        runningValue += order.amountUsd;
      } else if (order.type === "sell") {
        runningValue -= order.amountUsd;
      }
      return {
        date: new Date(order.timestamp).toLocaleDateString(),
        timestamp: order.timestamp,
        value: Math.max(0, runningValue)
      };
    });
    
    // Add current portfolio value as last point
    if (data.length > 0 || portfolio > 0) {
      data.push({
        date: "Now",
        timestamp: Date.now(),
        value: portfolio
      });
    }
    
    setChartData(data);
  }

  function handleBuy(contractId) {
    navigate(`/market/${contractId}`);
  }

  function handleSell(contractId) {
    navigate(`/market/${contractId}?action=sell`);
  }

  const totalValue = positions.reduce((sum, pos) => sum + (pos.value || pos.totalValue || 0), 0);

  return (
    <main className="max-w-7xl mx-auto px-6 py-8" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 transition"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-tertiary)'}
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>My Positions</h1>
            <p style={{ color: 'var(--text-tertiary)' }}>View and manage your trading positions and order history</p>
          </div>
          <div className="text-right">
            <div className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Portfolio Value</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-green-text)' }}>${totalValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <button
          onClick={() => setActiveTab("positions")}
          className="px-4 py-2 font-medium transition"
          style={{
            color: activeTab === "positions" ? 'var(--accent-blue-text)' : 'var(--text-tertiary)',
            borderBottom: activeTab === "positions" ? '2px solid var(--accent-blue)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "positions") e.target.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "positions") e.target.style.color = 'var(--text-tertiary)';
          }}
        >
          Positions ({positions.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className="px-4 py-2 font-medium transition"
          style={{
            color: activeTab === "orders" ? 'var(--accent-blue-text)' : 'var(--text-tertiary)',
            borderBottom: activeTab === "orders" ? '2px solid var(--accent-blue)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "orders") e.target.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "orders") e.target.style.color = 'var(--text-tertiary)';
          }}
        >
          Order History ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("chart")}
          className="px-4 py-2 font-medium transition"
          style={{
            color: activeTab === "chart" ? 'var(--accent-blue-text)' : 'var(--text-tertiary)',
            borderBottom: activeTab === "chart" ? '2px solid var(--accent-blue)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "chart") e.target.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "chart") e.target.style.color = 'var(--text-tertiary)';
          }}
        >
          <BarChart3 size={18} className="inline mr-2" />
          Progress Chart
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4" style={{ color: 'var(--accent-red-text)' }}>
          {error}
        </div>
      ) : activeTab === "positions" ? (
        <div className="space-y-4">
          {positions.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <BarChart3 size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Positions Yet</h3>
              <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>Start trading to build your portfolio</p>
              <button
                onClick={() => navigate("/markets")}
                className="px-6 py-3 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--accent-blue)', color: 'var(--text-button-primary)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--accent-blue-hover)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--accent-blue)'}
              >
                Browse Markets
              </button>
            </div>
          ) : (
            positions.map((position) => (
              <div
                key={position.contractId}
                className="rounded-xl p-6 transition"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-default)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{position.question}</h3>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{position.category}</span>
                      {position.status && (
                        <span className="px-2 py-1 rounded" style={{
                          backgroundColor: position.status === "live" ? "rgba(34, 197, 94, 0.2)" :
                                          position.status === "finished" ? "rgba(107, 114, 128, 0.2)" :
                                          "rgba(59, 130, 246, 0.2)",
                          color: position.status === "live" ? 'var(--accent-green-text)' :
                                 position.status === "finished" ? 'var(--text-tertiary)' :
                                 'var(--accent-blue-text)'
                        }}>
                          {position.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: 'var(--accent-green-text)' }}>
                      ${(position.value || position.totalValue || 0).toFixed(2)}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {position.contracts > 0 ? `${position.contracts.toFixed(2)} contracts` : 
                       `${(position.yesShares || 0).toFixed(2)} YES / ${(position.noShares || 0).toFixed(2)} NO`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Current Price</div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>${(position.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Position Value</div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--accent-green-text)' }}>
                      ${(position.value || position.totalValue || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {position.resolution ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm" style={{ color: 'var(--accent-blue-text)' }}>
                    Contract resolved: {position.resolution}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBuy(position.contractId)}
                      className="flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                      style={{ backgroundColor: 'var(--accent-green)', color: 'var(--text-button-primary)' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(21, 128, 61)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--accent-green)'}
                    >
                      <Plus size={18} />
                      Buy More
                    </button>
                    {(position.contracts > 0 || (position.yesShares > 0 || position.noShares > 0)) && (
                      <button
                        onClick={() => handleSell(position.contractId)}
                        className="flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                        style={{ backgroundColor: 'var(--accent-red)', color: 'var(--text-button-primary)' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(185, 28, 28)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--accent-red)'}
                      >
                        <Minus size={18} />
                        Sell
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : activeTab === "orders" ? (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <Clock size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Orders Yet</h3>
              <p style={{ color: 'var(--text-tertiary)' }}>Your trading history will appear here</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl p-4 transition"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-default)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium" style={{
                        backgroundColor: order.type === "buy" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: order.type === "buy" ? 'var(--accent-green-text)' : 'var(--accent-red-text)'
                      }}>
                        {order.type.toUpperCase()}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(order.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{order.contractQuestion}</h4>
                    <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{order.contractCategory}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ${order.amountUsd.toFixed(2)}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {order.contractsReceived > 0 && `${order.contractsReceived.toFixed(2)} @ $${order.price.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Portfolio Progress</h2>
          {chartData.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No trading data yet. Start trading to see your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple bar chart visualization */}
              <div className="h-64 flex items-end justify-between gap-2">
                {chartData.map((point, index) => {
                  const maxValue = Math.max(...chartData.map(p => p.value), 1);
                  const height = (point.value / maxValue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:opacity-80"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${point.date}: $${point.value.toFixed(2)}`}
                      />
                      <div className="text-xs mt-2 text-center transform -rotate-45 origin-top-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {point.date.length > 10 ? point.date.substring(0, 10) : point.date}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Trades</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{orders.length}</div>
                </div>
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Current Value</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent-green-text)' }}>${portfolio.toFixed(2)}</div>
                </div>
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Available Cash</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${cash.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

