  import React from "react";
import { X, TrendingUp, TrendingDown } from "lucide-react";

export default function PortfolioButton({ portfolio, cash }) {
  const [open, setOpen] = React.useState(false);
  
  // Ensure values are numbers and default to 0
  const portfolioValue = typeof portfolio === "number" && !isNaN(portfolio) ? portfolio : 0;
  const cashValue = typeof cash === "number" && !isNaN(cash) ? cash : 0;
  
  // Calculate total value
  const totalValue = portfolioValue + cashValue;
  
  // Mock change for now (you can add real change tracking later)
  const change = 0;
  const changePercent = 0;

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-end text-xs hover:opacity-80 transition cursor-pointer"
      >
        <div className="text-gray-400">Portfolio</div>
        <div className="text-green-400 font-semibold">${portfolioValue.toFixed(2)}</div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}></div>

          <div className="relative w-full max-w-md mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ height: 'auto', maxHeight: '80vh', transform: 'translateY(45%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">Portfolio</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-visible">
              {/* Total Value */}
              <div className="text-center py-4">
                <div className="text-gray-400 text-sm mb-1">Total Value</div>
                <div className="text-3xl font-bold text-green-400 mb-2">${totalValue.toFixed(2)}</div>
                {change !== 0 && (
                  <div className={`flex items-center justify-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span>${Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)</span>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Cash</span>
                    <span className="text-green-400 font-semibold">${cashValue.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500">Available for trading</div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Portfolio Value</span>
                    <span className="text-green-400 font-semibold">${portfolioValue.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500">Value of your positions</div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  Your portfolio value includes all open positions and available cash. Positions are valued at current market prices.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

