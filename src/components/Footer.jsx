import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-row justify-between items-start gap-12 mb-4">
          {/* Company Column */}
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-2 text-sm">Company</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-400 hover:text-white transition text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/data-terms" className="text-gray-400 hover:text-white transition text-sm">
                  Data Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/company" className="text-gray-400 hover:text-white transition text-sm">
                  Company
                </Link>
              </li>
              <li>
                <Link to="/brand-kit" className="text-gray-400 hover:text-white transition text-sm">
                  Brand Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Column */}
          <div className="flex-1 flex justify-center">
            <div>
              <h3 className="font-semibold text-white mb-2 text-sm">Social</h3>
              <ul className="space-y-1">
              <li>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm">
                  X
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm">
                  Reddit
                </a>
              </li>
              <li>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm">
                  TikTok
                </a>
              </li>
              </ul>
            </div>
          </div>

          {/* Product Column */}
          <div className="flex-1 flex justify-end">
            <div>
              <h3 className="font-semibold text-white mb-2 text-sm">Product</h3>
              <ul className="space-y-1">
              <li>
                <Link to="/help" className="text-gray-400 hover:text-white transition text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-gray-400 hover:text-white transition text-sm">
                  API
                </Link>
              </li>
              <li>
                <Link to="/faq-finance" className="text-gray-400 hover:text-white transition text-sm">
                  FAQ for Finance Professionals
                </Link>
              </li>
              <li>
                <Link to="/regulatory" className="text-gray-400 hover:text-white transition text-sm">
                  Regulatory
                </Link>
              </li>
              <li>
                <Link to="/trading-hours" className="text-gray-400 hover:text-white transition text-sm">
                  Trading Hours
                </Link>
              </li>
              <li>
                <Link to="/fee-schedule" className="text-gray-400 hover:text-white transition text-sm">
                  Fee Schedule
                </Link>
              </li>
              <li>
                <Link to="/trading-prohibitions" className="text-gray-400 hover:text-white transition text-sm">
                  Trading Prohibitions
                </Link>
              </li>
              <li>
                <Link to="/incentive-program" className="text-gray-400 hover:text-white transition text-sm">
                  Incentive Program
                </Link>
              </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-700 my-4"></div>

        {/* Copyright and Disclaimer */}
        <div className="space-y-2">
          <p className="text-gray-400 text-xs">© 2025 FutrMarket Inc.</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Trading on FutrMarket involves risk and may not be appropriate for all. Members risk losing their cost to enter any transaction, including fees. You should carefully consider whether trading on FutrMarket is appropriate for you in light of your investment experience and financial resources. Any trading decisions you make are solely your responsibility and at your own risk. Information is provided for convenience only on an "AS IS" basis. Past performance is not necessarily indicative of future results. FutrMarket is subject to U.S. regulatory oversight by the CFTC.
          </p>
        </div>
      </div>
    </footer>
  );
}

