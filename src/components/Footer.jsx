import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-footer)] text-[var(--text-secondary)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-row justify-between items-start gap-12 mb-4">
          {/* Company Column */}
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--text-white)] mb-2 text-sm">Company</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/blog" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Information Center
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/data-terms" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Data Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/company" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Company
                </Link>
              </li>
              <li>
                <Link to="/brand-kit" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Brand Kit
                </Link>
              </li>
              <li>
                <Link to="/become-a-partner" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Become A Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Column */}
          <div className="flex-1 flex justify-center">
            <div>
              <h3 className="font-semibold text-[var(--text-white)] mb-2 text-sm">Social</h3>
              <ul className="space-y-1">
              <li>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  X
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Reddit
                </a>
              </li>
              <li>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  TikTok
                </a>
              </li>
              <li>
                <Link to="/forum" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Forum
                </Link>
              </li>
              </ul>
            </div>
          </div>

          {/* Product Column */}
          <div className="flex-1 flex justify-end">
            <div>
              <h3 className="font-semibold text-[var(--text-white)] mb-2 text-sm">Product</h3>
              <ul className="space-y-1">
              <li>
                <Link to="/help" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  API
                </Link>
              </li>
              <li>
                <Link to="/faq-finance" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  FAQ for Finance Professionals
                </Link>
              </li>
              <li>
                <Link to="/regulatory" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Regulatory
                </Link>
              </li>
              <li>
                <Link to="/trading-hours" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Trading Hours
                </Link>
              </li>
              <li>
                <Link to="/fee-schedule" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Fee Schedule
                </Link>
              </li>
              <li>
                <Link to="/trading-prohibitions" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Trading Prohibitions
                </Link>
              </li>
              <li>
                <Link to="/incentive-program" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  Incentive Program
                </Link>
              </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/20 my-4"></div>

        {/* Copyright and Disclaimer */}
        <div className="space-y-2">
          <p className="text-[var(--text-footer-copyright)] text-xs">© 2025 FutrMarket AS, Oslo Norway</p>
          <p className="text-[var(--text-footer-copyright)] text-xs leading-relaxed">
            Trading on FutrMarket involves risk and may not be appropriate for all. Members risk losing their cost to enter any transaction, including fees. You should carefully consider whether trading on FutrMarket is appropriate for you in light of your investment experience and financial resources. Any trading decisions you make are solely your responsibility and at your own risk. Information is provided for convenience only on an "AS IS" basis. Past performance is not necessarily indicative of future results. FutrMarket is subject to U.S. regulatory oversight by the CFTC.
          </p>
        </div>
      </div>
    </footer>
  );
}

