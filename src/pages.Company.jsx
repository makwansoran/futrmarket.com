import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "./contexts/ThemeContext.jsx";
import { Info } from "lucide-react";

export default function CompanyPage() {
  const { isLight } = useTheme();

  return (
    <main className={`flex gap-4 max-w-7xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex-shrink-0 ${isLight ? 'text-black' : 'text-white'}`}>
        <div className={`sticky top-24 rounded-xl p-4 overflow-hidden ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
          {/* Information Center Icon */}
          <div className="mb-6 pb-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-start">
              <Info 
                className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-blue-500`}
                size={24}
              />
              <span className="ml-2 text-sm font-semibold" style={{
                background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #a0a0a0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Information Center
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Link 
              to="/blog" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Blog
            </Link>
            <Link 
              to="/company" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'bg-gray-800 text-white font-medium'
              }`}
            >
              About Us
            </Link>
            <Link 
              to="/privacy" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Privacy Policy
            </Link>
            <Link 
              to="/data-terms" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Data Terms of Service
            </Link>
            <Link 
              to="/brand-kit" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Brand Kit
            </Link>
            <Link 
              to="/become-a-partner" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Become A Partner
            </Link>
            <Link 
              to="/help" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Help Center
            </Link>
            <Link 
              to="/api" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              API
            </Link>
            <Link 
              to="/faq-finance" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              FAQ for Finance Professionals
            </Link>
            <Link 
              to="/regulatory" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Regulatory
            </Link>
            <Link 
              to="/trading-hours" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Trading Hours
            </Link>
            <Link 
              to="/fee-schedule" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Fee Schedule
            </Link>
            <Link 
              to="/trading-prohibitions" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Trading Prohibitions
            </Link>
            <Link 
              to="/incentive-program" 
              className={`block px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                isLight 
                  ? 'hover:bg-gray-100 text-gray-700' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              Incentive Program
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1">
        <h1 className="text-4xl font-bold mb-6 ml-2" style={{
          background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #a0a0a0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          About us at Futrmarket.com
        </h1>
        
        <div className={`rounded-xl p-8 ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
          <div className={`prose prose-invert max-w-none ${isLight ? 'prose-gray' : 'prose-invert'}`}>
            <p className={`text-lg mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              FutrMarket didn't start as a business plan. It started as a question.
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Why is it that the most important events — elections, major sports outcomes, shifts in global markets — are often discussed with strong opinions but almost no measurable accountability? People argue, predict, and speculate every day, yet there's rarely a clear way to see what the crowd actually believes or how confident they really are.
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              In the early days, this question lived on a simple whiteboard. The idea was straightforward:
            </p>

            <p className={`mb-6 italic ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              What if there were a place where opinions could be tested in the open — not with loud debate, but with structured, transparent markets?
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              The concept evolved slowly. Markets already exist for stocks, commodities, and currencies, but almost none for the everyday events that shape our world. And the few platforms that attempted it often felt complicated, opaque, or inconsistent. They lacked the clarity that makes markets useful.
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              So the project began with a core principle:
            </p>

            <p className={`mb-6 font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Build something simple, honest, and understandable — even if that takes longer, even if it's harder.
            </p>

            <h2 className={`text-2xl font-bold mt-8 mb-4 ${isLight ? 'text-black' : 'text-white'}`}>The Early Build</h2>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Before a single interface was designed, the foundation had to be thought through. How would markets settle? How do you prevent confusion, bias, or misaligned incentives? What keeps a platform like this fair? It became clear that every decision created a new responsibility. Building a prediction market isn't just about technology — it's about trust, transparency, and constantly questioning your own assumptions.
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              There were nights surrounded by notebooks filled with diagrams, competing ideas, abandoned prototypes, and rewritten logic. What survived became the backbone of FutrMarket:
            </p>

            <ul className={`list-disc list-inside mb-6 space-y-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              <li>Event-driven markets with clearly defined outcomes</li>
              <li>Straightforward rules for positions and settlements</li>
              <li>A structure that helps people understand risk, not hide from it</li>
            </ul>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              We knew early on that promising excitement would be easy, but offering clarity would be meaningful. That choice shaped everything that followed.
            </p>

            <h2 className={`text-2xl font-bold mt-8 mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Bringing the Platform to Life</h2>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              When the first working prototype came together, it was built to show one thing: how collective belief could move like a real market. Watching the first test users place positions on small events — and seeing probabilities shift in real time — confirmed the idea had substance.
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              But with that excitement came honest reflection. If a platform like this gains traction, it must handle uncertainty responsibly. It must respect the fact that users risk their own money, and that real markets involve both gains and losses. It must avoid overconfidence, hype, or unrealistic promises.
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              That awareness pushed us to design the platform around transparency:
            </p>

            <p className={`mb-6 italic ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              every market is clear, every outcome has rules, every participant can see how and why settlement works.
            </p>

            <h2 className={`text-2xl font-bold mt-8 mb-4 ${isLight ? 'text-black' : 'text-white'}`}>What FutrMarket Stands For Today</h2>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              FutrMarket exists because information is more valuable when it can be tested and measured. We believe that markets can reveal insight, but only when built with fairness and simplicity. We also believe that no platform should pretend to remove risk — instead, it should help users understand it.
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Today, the platform brings together people who want to challenge ideas, explore possibilities, and engage with real-world events in a structured way. The features continue to evolve, but the philosophy remains the same:
            </p>

            <p className={`mb-6 font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              clarity over hype, transparency over mystery, and learning over blind speculation.
            </p>

            <h2 className={`text-2xl font-bold mt-8 mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Looking Ahead</h2>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Our story is still being written, and the future of FutrMarket depends on the community using it. As new events emerge and global conversations shift, the platform will adapt — always with careful thought, always with an awareness of the responsibility that comes with building markets.
            </p>

            <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              If you're here to explore, challenge yourself, or simply see the world through a different kind of lens, welcome. FutrMarket is built for people who want to think, measure, question, and understand — together.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

