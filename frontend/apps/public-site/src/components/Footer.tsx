import React from 'react';
import { ArrowRight, ShieldCheck, Building2 } from 'lucide-react';

interface FooterProps {
  onOpenDemo: (name: string) => void;
}

export function Footer({ onOpenDemo }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      {/* Final CTA banner */}
      <section
        className="py-14 sm:py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a2e24 0%, #15803d 55%, #166534 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight leading-tight">
            Deploy Real-Time Workforce Visibility Today
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-green-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform accountability, reduce idle time, and protect sensitive operations with ScreenAdvait.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => onOpenDemo('Footer CTA')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-green-800 hover:bg-green-50 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Schedule Enterprise Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="/portal/"
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4 text-green-300" />
              <span>Open Portal Login</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 shadow-2xs">
                  <img src="/logo.png" alt="ScreenAdvait" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-gray-900 font-bold text-[15px]">ScreenAdvait</div>
                  <div className="text-green-600 text-[10px] font-medium">Enterprise Monitoring Platform</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-sm">
                Production-ready workforce monitoring for remote and hybrid enterprise teams — built with hardware-level security, real-time telemetry, and cloud-first architecture.
              </p>
              <div className="flex flex-col gap-1.5 mt-4">
                <a
                  href="/portal/"
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-green-700 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-green-600" />
                  Company Admin Portal
                </a>
                <a
                  href="/admin/"
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-green-700 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
                  SuperAdmin Master Portal
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-500">
                {['Features', 'Portals', 'How It Works', 'Pricing', 'FAQ'].map((l) => (
                  <li key={l}>
                    <a
                      href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
                      className="hover:text-green-700 transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Portals</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-500">
                <li>
                  <a
                    href="/portal/"
                    className="hover:text-green-700 transition-colors"
                  >
                    Company Admin
                  </a>
                </li>
                <li>
                  <a
                    href="/admin/"
                    className="hover:text-green-700 transition-colors"
                  >
                    SuperAdmin Console
                  </a>
                </li>
                <li>
                  <a
                    href="/download/ScreenAdvait-Desktop-Setup.zip"
                    className="hover:text-green-700 transition-colors"
                  >
                    Desktop Client (.exe)
                  </a>
                </li>
                <li>
                  <a
                    href="/ScreenAdvait-Client-Guide.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-green-700 transition-colors"
                  >
                    Setup Guide (PDF)
                  </a>
                </li>
              </ul>
            </div>

            {/* Trust & Compliance */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Security</h4>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-1.5 font-medium text-gray-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  HWID Anti-Tamper
                </li>
                <li className="flex items-center gap-1.5 font-medium text-gray-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  AES-256 Offline Cache
                </li>
                <li className="flex items-center gap-1.5 font-medium text-gray-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  JWT Bearer Auth
                </li>
                <li className="flex items-center gap-1.5 font-medium text-gray-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  Role-Based Isolation
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 text-center sm:text-left">
            <div>
              © {currentYear} ScreenAdvait Enterprise Platform. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
              <a
                href="/portal/"
                className="hover:text-green-700 transition-colors"
              >
                Sign In to Portal
              </a>
              <span>·</span>
              <button
                onClick={() => onOpenDemo('Footer Support')}
                className="hover:text-green-700 transition-colors cursor-pointer"
              >
                Contact Enterprise Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
