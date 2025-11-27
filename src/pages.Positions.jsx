import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, BarChart3, Clock } from "lucide-react";
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

  function handleBuy(contractId) {
    navigate(`/market/${contractId}`);
  }

  function handleSell(contractId) {
    navigate(`/market/${contractId}?action=sell`);
  }

  const totalValue = positions.reduce((sum, pos) => sum + (pos.value || pos.totalValue || 0), 0);

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 text-[var(--text-primary)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Positions</h1>
            <p className="text-[var(--text-tertiary)]">View and manage your trading positions and order history</p>
          </div>
          <div className="text-right">
            <div className="text-[var(--text-tertiary)] text-sm mb-1">Total Portfolio Value</div>
            <div className="text-2xl font-bold text-[var(--accent-green-text)]">${totalValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border-default)]">
        <button
          onClick={() => setActiveTab("positions")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "positions"
              ? "text-[var(--accent-blue-text)] border-b-2 border-[var(--accent-blue)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Positions ({positions.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "orders"
              ? "text-[var(--accent-blue-text)] border-b-2 border-[var(--accent-blue)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Order History ({orders.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-[var(--text-tertiary)]">Loading...</div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-[var(--accent-red-text)]">
          {error}
        </div>
      ) : activeTab === "positions" ? (
        <div className="space-y-4">
          {positions.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-12 text-center">
              <BarChart3 size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Positions Yet</h3>
              <p className="text-[var(--text-tertiary)] mb-6">Start trading to build your portfolio</p>
              <button
                onClick={() => navigate("/markets")}
                className="px-6 py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] rounded-lg text-[var(--text-button-primary)] font-medium"
              >
                Browse Markets
              </button>
            </div>
          ) : (
            positions.map((position) => (
              <div
                key={position.contractId}
                className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6 hover:border-[var(--border-secondary)] transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{position.question}</h3>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
                      <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">{position.category}</span>
                      {position.status && (
                        <span className={`px-2 py-1 rounded ${
                          position.status === "live" ? "bg-green-500/20 text-[var(--accent-green-text)]" :
                          position.status === "finished" ? "bg-gray-500/20 text-[var(--text-tertiary)]" :
                          "bg-blue-500/20 text-[var(--accent-blue-text)]"
                        }`}>
                          {position.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--accent-green-text)]">
                      ${(position.value || position.totalValue || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-[var(--text-tertiary)]">
                      {position.contracts > 0 ? `${position.contracts.toFixed(2)} contracts` : 
                       `${(position.yesShares || 0).toFixed(2)} YES / ${(position.noShares || 0).toFixed(2)} NO`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
                    <div className="text-xs text-[var(--text-tertiary)] mb-1">Current Price</div>
                    <div className="text-lg font-semibold">${(position.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
                    <div className="text-xs text-[var(--text-tertiary)] mb-1">Position Value</div>
                    <div className="text-lg font-semibold text-[var(--accent-green-text)]">
                      ${(position.value || position.totalValue || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {position.resolution ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-[var(--accent-blue-text)] text-sm">
                    Contract resolved: {position.resolution}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBuy(position.contractId)}
                      className="flex-1 px-4 py-2 bg-[var(--accent-green)] hover:bg-green-700 rounded-lg text-[var(--text-button-primary)] font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Plus size={18} />
                      Buy More
                    </button>
                    {(position.contracts > 0 || (position.yesShares > 0 || position.noShares > 0)) && (
                      <button
                        onClick={() => handleSell(position.contractId)}
                        className="flex-1 px-4 py-2 bg-[var(--accent-red)] hover:bg-red-700 rounded-lg text-[var(--text-button-primary)] font-medium flex items-center justify-center gap-2 transition"
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
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-12 text-center">
              <Clock size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
              <p className="text-[var(--text-tertiary)]">Your trading history will appear here</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 hover:border-[var(--border-secondary)] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.type === "buy"
                          ? "bg-green-500/20 text-[var(--accent-green-text)]"
                          : "bg-red-500/20 text-[var(--accent-red-text)]"
                      }`}>
                        {order.type.toUpperCase()}
                      </span>
                      <span className="text-[var(--text-tertiary)] text-sm">
                        {new Date(order.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{order.contractQuestion}</h4>
                    <div className="text-sm text-[var(--text-tertiary)]">{order.contractCategory}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      ${order.amountUsd.toFixed(2)}
                    </div>
                    <div className="text-sm text-[var(--text-tertiary)]">
                      {order.contractsReceived > 0 && `${order.contractsReceived.toFixed(2)} @ $${order.price.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </main>
  );
}

