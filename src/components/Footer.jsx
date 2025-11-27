import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Linkedin, MessageCircle, Facebook, Instagram, Circle, Music2, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-footer)] text-[var(--text-secondary)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-row justify-between items-start gap-12 mb-4">
          {/* Logo and Address Column - Left */}
          <div className="flex-1">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <img 
                src="/faviconlogo.png" 
                alt="FutrMarket Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold tracking-tight text-xl text-[var(--text-white)]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                FutrMarket
              </span>
            </Link>
          </div>

          {/* Company Column - Center */}
          <div className="flex-1 flex justify-center">
            <div>
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
                  <Link to="/become-a-partner" className="text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                    Become A Partner
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Column - Right */}
          <div className="flex-1 flex justify-end">
            <div>
              <h3 className="font-semibold text-[var(--text-white)] mb-2 text-sm">Social</h3>
              <ul className="space-y-1">
              <li>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  <Twitter size={16} />
                  X
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  <Linkedin size={16} />
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  <MessageCircle size={16} />
                  Discord
                </a>
              </li>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  <Facebook size={16} />
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  <Instagram size={16} />
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  <Circle size={16} />
                  Reddit
                </a>
              </li>
              <li>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  <Music2 size={16} />
                  TikTok
                </a>
              </li>
              <li>
                <Link to="/forum" className="flex items-center gap-2 text-[var(--text-footer)] hover:text-[var(--text-footer-hover)] transition text-sm">
                  <MessageSquare size={16} />
                  Forum
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

