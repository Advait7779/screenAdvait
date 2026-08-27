import React, { useState } from 'react';
import { Maximize2, X, Camera, CheckCircle2, ZoomIn } from 'lucide-react';

interface ScreenshotItem {
  id: string; title: string; category: string; subtitle: string;
  description: string; highlights: string[]; mockType: string;
}

export function ScreenshotGallery() {
  const [selected, setSelected] = useState<ScreenshotItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const screenshots: ScreenshotItem[] = [
    {
      id: 'company', title: 'Company Admin Live Workforce Dashboard', category: 'Company Admin', subtitle: 'Real-Time Telemetry & Employee Directory', mockType: 'company-overview',
      description: 'Live status monitoring displaying online/idle/offline statuses, license key assignments, and last sync heartbeats across all workstations.',
      highlights: ['Active status indicator with sub-second heartbeats', 'Instant license key distribution for newly joined employees', 'Quick access to daily screenshot archives', 'Department-level filtering and search'],
    },
    {
      id: 'gallery', title: 'High-Resolution Screenshot Timeline & Inspector', category: 'Capture Engine', subtitle: 'Visual Playback with Zoom & Metadata', mockType: 'gallery-inspector',
      description: 'Chronological gallery view with day-by-day archiving, multi-screen inspection, timestamp verification, and 1-click lossless image downloads.',
      highlights: ['Day-by-day expandable timeline archive', 'Lossless full-screen zoom and inspection modal', 'Resolution, byte size, and workstation metadata', 'Fast date-picker and employee filter controls'],
    },
    {
      id: 'superadmin', title: 'SuperAdmin Multi-Tenant Master Hub', category: 'SuperAdmin', subtitle: 'Global Organization & License Engine', mockType: 'superadmin-keys',
      description: 'Master administration portal for provisioning enterprise organizations, configuring subscription quotas, and generating hardware-locked license keys.',
      highlights: ['Multi-tenant workspace isolation', 'Hardware ID-bound license key generator', 'Subscription plan management and seat tracking', 'Global security logs and audit trails'],
    },
    {
      id: 'settings', title: 'Dynamic Capture Intervals & Stealth Controls', category: 'Capture Engine', subtitle: 'Flexible Governance & Policy Settings', mockType: 'capture-settings',
      description: 'Easily adjust capture frequencies from 1–15 minute intervals, toggle emergency pause company-wide, and manage stealth mode preferences.',
      highlights: ['1m, 5m, 10m, and 15m preset selectors', '1-click company-wide capture pause and resume', 'Stealth mode and background daemon behavior rules', 'Instant remote sync with workstation agents'],
    },
    {
      id: 'archive', title: 'Organization Archive & Custom Pagination', category: 'Archive & Filter', subtitle: 'Search, Filter & Custom Page Controls', mockType: 'archive-pagination',
      description: 'Searchable organization-wide archive allowing administrators to filter by employee, date ranges, and custom page sizes for lightning-fast audits.',
      highlights: ['Custom page size dropdown (10, 25, 50, 100 entries)', 'Instant employee username search & filter', 'Direct full-resolution screenshot download endpoint', 'Fast date-grouped accordion navigation'],
    },
  ];

  const categories = ['All', 'Company Admin', 'SuperAdmin', 'Capture Engine', 'Archive & Filter'];
  const filtered = activeCategory === 'All' ? screenshots : screenshots.filter((s) => s.category === activeCategory);

  return (
    <section id="screenshots" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-green mb-4">
            <Camera className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Product Screenshots & UI Previews</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">See ScreenAdvait in Action</h2>
          <p className="mt-4 text-base sm:text-lg text-gray-500">
            Explore high-resolution views of the SuperAdmin hub, Company Operations portal, screenshot timeline inspector, and organization archive engine.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'text-white shadow-green-glow'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'
              }`}
              style={activeCategory === cat ? { background: 'linear-gradient(135deg, #15803d, #166534)' } : {}}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.id} onClick={() => setSelected(item)}
              className="portal-card overflow-hidden cursor-pointer group flex flex-col">
              {/* Card header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-bold text-green-700">{item.category}</span>
                  <span className="flex items-center gap-1 text-gray-400 group-hover:text-green-700 transition-colors">
                    <ZoomIn className="w-3.5 h-3.5" /><span>Click to Inspect</span>
                  </span>
                </div>
                {/* Mock screen */}
                <div className="h-44 bg-gray-50 rounded-xl border border-gray-100 p-3 flex flex-col justify-between relative group-hover:border-green-200 transition-all overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] bg-white border border-gray-100 rounded px-2 py-1">
                    <span className="font-semibold text-gray-700">{item.subtitle}</span>
                    <span className="text-green-600 font-semibold">Live</span>
                  </div>
                  <div className="space-y-1.5 flex-1 mt-2">
                    {item.highlights.slice(0, 3).map((h, i) => (
                      <div key={i} className="h-1.5 bg-gray-200 rounded" style={{ width: `${75 - i * 12}%` }} />
                    ))}
                  </div>
                  <div className="text-[9px] text-gray-400">AES-256 Encrypted · Verified Capture</div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow"
                      style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
                      <Maximize2 className="w-3.5 h-3.5" /> Expand View
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{item.description}</p>
                <div className="space-y-1.5 pt-3 border-t border-gray-100">
                  {item.highlights.slice(0, 2).map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" /><span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspector Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-pop-in">
          <div onClick={(e) => e.stopPropagation()}
            className="bg-white border border-gray-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-3xl">
              <div>
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">{selected.category}</span>
                <h3 className="text-base font-bold text-gray-900">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selected.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex justify-end">
              <button onClick={() => setSelected(null)} className="btn-secondary px-5 py-2 rounded-lg text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
