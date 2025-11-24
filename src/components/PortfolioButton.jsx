import React from "react";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PortfolioButton({ portfolio, cash }) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  
  // Ensure values are numbers and default to 0
  const portfolioValue = typeof portfolio === "number" && !isNaN(portfolio) ? portfolio : 0;
  const cashValue = typeof cash === "number" && !isNaN(cash) ? cash : 0;
  
  // Calculate total value
  const totalValue = portfolioValue + cashValue;
  
  // Mock change for now (you can add real change tracking later)
  const change = 0;
  const changePercent = 0;
  
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        className="flex flex-col items-end text-xs hover:opacity-80 transition cursor-pointer"
      >
        <div className="text-gray-400">Portfolio</div>
        <div className="text-green-400 font-semibold">${portfolioValue.toFixed(2)}</div>
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-20" 
            onClick={() => setOpen(false)}
          />
          <div 
            className="absolute right-0 mt-2 w-80 rounded-md border border-white/10 bg-gray-900/95 backdrop-blur-sm shadow-xl z-[60] transition-all duration-200 ease-out"
            style={{
              animation: 'dropdownFadeIn 0.2s ease-out',
              transformOrigin: 'top right'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
              <h3 className="text-sm font-semibold text-white">Portfolio</h3>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Total Value */}
              <div className="text-center py-2">
                <div className="text-gray-400 text-xs mb-1">Total Value</div>
                <div className="text-2xl font-bold text-green-400 mb-2">${totalValue.toFixed(2)}</div>
                {change !== 0 && (
                  <div className={`flex items-center justify-center gap-1 text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>${Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)</span>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                <div 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-3 transition"
                  style={{
                    animation: `menuItemSlideIn 0.2s ease-out 0s both`
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 text-xs">Cash</span>
                    <span className="text-green-400 font-semibold text-sm">${cashValue.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500">Available for trading</div>
                </div>

                <div 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-3 transition"
                  style={{
                    animation: `menuItemSlideIn 0.2s ease-out 0.05s both`
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 text-xs">Portfolio Value</span>
                    <span className="text-green-400 font-semibold text-sm">${portfolioValue.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500">Value of your positions</div>
                </div>
              </div>

              {/* Positions Button */}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/positions");
                }}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition"
                style={{
                  animation: `menuItemSlideIn 0.2s ease-out 0.1s both`
                }}
              >
                <BarChart3 size={16} />
                Positions
              </button>

              {/* Info */}
              <div 
                className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 transition"
                style={{
                  animation: `menuItemSlideIn 0.2s ease-out 0.15s both`
                }}
              >
                <p className="text-xs text-blue-300">
                  Your portfolio value includes all open positions and available cash. Positions are valued at current market prices.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes menuItemSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

