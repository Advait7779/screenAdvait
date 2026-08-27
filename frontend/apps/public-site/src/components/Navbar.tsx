import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ExternalLink, Monitor } from 'lucide-react';

interface NavbarProps {
  onOpenDemo: (initialSubject?: string) => void;
}

export function Navbar({ onOpenDemo }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white border-b border-gray-200 shadow-sm py-2'
          : 'bg-white/95 border-b border-gray-200 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
              <img src="/logo.png" alt="ScreenAdvait" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-gray-900 font-bold text-[15px] leading-tight">ScreenAdvait</div>
              <div className="text-green-600 text-[10px] font-medium">Enterprise Monitoring Platform</div>
            </div>
          </a>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Direct Portal Login Link */}
            <a
              href="/portal/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-green-300 hover:text-green-700 transition-all shadow-sm"
            >
              <Monitor className="w-3.5 h-3.5 text-green-600" />
              <span>Portal Login</span>
            </a>

            <button
              onClick={() => onOpenDemo('Header CTA')}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-md text-xs shadow-sm cursor-pointer"
            >
              <span>Book a Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={() => onOpenDemo('Mobile')} className="btn-primary px-3 py-1.5 text-xs rounded-md shadow-sm">Demo</button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-3 pb-5 shadow-sm">
          <div className="space-y-2">
            <a
              href="/portal/"
              className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-green-600" />
                Customer Admin Portal
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <a
              href="/admin/"
              className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-green-700" />
                SuperAdmin Portal
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenDemo('Mobile full'); }}
              className="w-full btn-primary py-3 rounded-md text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Schedule Live Enterprise Demo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
