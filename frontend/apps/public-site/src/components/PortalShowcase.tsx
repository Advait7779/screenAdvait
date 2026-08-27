import React, { useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import {
  SvgEmployeeUsers,
  SvgMultiTenantBuilding,
  SvgDesktopDaemon,
  SvgSecurityShield,
} from './icons/ColorfulIcons';

interface PortalShowcaseProps {
  onOpenDemo: (name: string) => void;
}

export function PortalShowcase({ onOpenDemo }: PortalShowcaseProps) {
  const [selected, setSelected] = useState<'company' | 'superadmin' | 'desktop'>('company');

  const portals = [
    { id: 'company' as const, label: 'Company Admin Portal', sub: 'Workforce & screenshot management', icon: SvgEmployeeUsers },
    { id: 'superadmin' as const, label: 'SuperAdmin Master Portal', sub: 'Tenants, subscriptions & global keys', icon: SvgMultiTenantBuilding },
    { id: 'desktop' as const, label: 'Silent Desktop Agent', sub: 'Background Electron service', icon: SvgDesktopDaemon },
  ];

  const features: Record<typeof selected, { title: string; description: string; highlights: { title: string; desc: string }[]; ctaLabel: string }> = {
    company: {
      title: 'Real-Time Employee Telemetry & High-Res Screenshot Streams',
      description: 'The Company Admin Portal gives department leads immediate visibility into team operations without micromanagement friction.',
      highlights: [
        { title: 'Automated Multi-Screen Captures', desc: 'Full-resolution snapshots supporting multi-monitor enterprise setups.' },
        { title: 'Granular Interval Engine (1m – 15m)', desc: 'Customizable capture intervals with 1-click global or per-team pause.' },
        { title: 'Live Device Heartbeat Matrix', desc: 'Instant online, idle, or offline device status indicators.' },
        { title: 'Day-by-Day Screenshot Archive', desc: 'Grouped timeline hierarchy by date and employee with high-res zoom inspection.' },
      ],
      ctaLabel: 'Request Company Portal Demo',
    },
    superadmin: {
      title: 'Multi-Tenant Provisioning, Subscriptions & Anti-Piracy Keys',
      description: 'The SuperAdmin Hub empowers license operators to manage multiple client organizations and generate cryptographically signed keys.',
      highlights: [
        { title: 'Multi-Tenant Company Provisioning', desc: 'Instantly create and configure independent customer workspaces.' },
        { title: 'Hardware-Locked License Key Engine', desc: 'Generate keys tied to specific workstation hardware IDs.' },
        { title: 'Subscription & Tier Lifecycle', desc: 'Control license allocations, validity, and renewal statuses.' },
        { title: 'Global Security & Audit Trail', desc: 'Track logins, activations, and all administrative actions.' },
      ],
      ctaLabel: 'Request SuperAdmin Access Demo',
    },
    desktop: {
      title: 'Silent, Tamper-Resistant Desktop Background Service',
      description: 'Runs seamlessly on Windows. Launches on boot, validates hardware authenticity, and operates in stealth mode.',
      highlights: [
        { title: 'Near-Zero Resource Footprint', desc: 'Less than 15MB RAM and 0.2% CPU in background state.' },
        { title: 'Offline Ingestion Buffer', desc: 'Caches screenshots securely when offline and auto-syncs on reconnect.' },
        { title: 'Hardware-ID Authentication', desc: 'Binds to motherboard and MAC to prevent unauthorized transfers.' },
        { title: 'Auto-Start & Anti-Termination', desc: 'Starts with system boot and maintains persistent heartbeat.' },
      ],
      ctaLabel: 'Download Desktop Client Specs',
    },
  };

  const current = features[selected];

  return (
    <section id="portals" className="py-16 sm:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-green mb-4">
            <SvgSecurityShield className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Dual-Portal Architecture & Silent Agent</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Built for Modern Enterprises
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-500">
            ScreenAdvait separates master system governance, day-to-day monitoring, and workstation-level capture into three dedicated performance layers.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-8 sm:mb-12 max-w-4xl mx-auto">
          {portals.map((p) => {
            const Icon = p.icon;
            const isActive = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'text-white shadow-green-glow'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 hover:bg-green-50'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, #15803d, #166534)' } : {}}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 p-1.5 ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="truncate font-bold">{p.label}</div>
                  <div className={`text-[10px] font-normal truncate ${isActive ? 'text-green-200' : 'text-gray-400'}`}>
                    {p.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Feature Text */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-snug">
              {current.title}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
              {current.description}
            </p>
            <div className="space-y-2.5 sm:space-y-3">
              {current.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-800">{h.title}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{h.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onOpenDemo(current.ctaLabel)}
              className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm shadow-sm cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>{current.ctaLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Portal Mockup */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card-lg">
              {/* Portal header bar */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-gray-200 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-gray-700 truncate">
                    {selected === 'company' && 'ScreenAdvait — Company Admin Portal'}
                    {selected === 'superadmin' && 'ScreenAdvait — SuperAdmin Console'}
                    {selected === 'desktop' && 'ScreenAdvait — Desktop Daemon Process'}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-semibold shrink-0">
                  {selected === 'company' && 'TechVenture Corp'}
                  {selected === 'superadmin' && 'Root Administrator'}
                  {selected === 'desktop' && 'PID: 14892 (Active)'}
                </span>
              </div>

              {/* Main content panel */}
              <div className="flex flex-col sm:flex-row min-h-[300px] sm:min-h-[340px]">
                {/* Sidebar replica */}
                <div
                  className="hidden sm:flex flex-col w-40 md:w-44 shrink-0"
                  style={{
                    background:
                      selected === 'superadmin'
                        ? 'linear-gradient(180deg,#1e2d1e,#2d3748)'
                        : 'linear-gradient(180deg,#1a2e24,#2d3748)',
                  }}
                >
                  <div className="px-3.5 py-3 border-b border-white/10">
                    <div className="text-white font-bold text-xs">ScreenAdvait</div>
                    <div className="text-green-400 text-[10px] font-medium">
                      {selected === 'company' ? 'Customer Portal' : selected === 'superadmin' ? 'Super Admin' : 'System Daemon'}
                    </div>
                  </div>
                  <nav className="flex-1 px-2 py-2.5 space-y-0.5">
                    <div className="text-[8.5px] uppercase font-bold text-gray-400 px-2 mb-1.5 tracking-wider">
                      {selected === 'superadmin' ? 'Management' : 'Workspace'}
                    </div>
                    {selected === 'company' &&
                      [
                        { label: 'Employees & Keys', active: false },
                        { label: 'Employee Captures', active: true },
                        { label: 'All Screenshots', active: false },
                        { label: 'Capture Settings', active: false },
                      ].map((it) => (
                        <div
                          key={it.label}
                          className={`px-2 py-1.5 rounded text-[10.5px] font-medium ${
                            it.active ? 'text-white font-semibold' : 'text-gray-400'
                          }`}
                          style={it.active ? { background: 'linear-gradient(135deg,#15803d,#166534)' } : {}}
                        >
                          {it.label}
                        </div>
                      ))}
                    {selected === 'superadmin' &&
                      [
                        { label: 'Company Subscription', active: true },
                        { label: 'Subscriptions Table', active: false },
                        { label: 'License Oversight', active: false },
                      ].map((it) => (
                        <div
                          key={it.label}
                          className={`px-2 py-1.5 rounded text-[10.5px] font-medium ${
                            it.active ? 'text-white font-semibold' : 'text-gray-400'
                          }`}
                          style={it.active ? { background: 'linear-gradient(135deg,#15803d,#166534)' } : {}}
                        >
                          {it.label}
                        </div>
                      ))}
                    {selected === 'desktop' && (
                      <div
                        className="px-2 py-1.5 text-[10.5px] text-white font-medium"
                        style={{ background: 'linear-gradient(135deg,#15803d,#166534)', borderRadius: 6 }}
                      >
                        Background Daemon
                      </div>
                    )}
                  </nav>
                </div>

                {/* Page content area */}
                <div className="flex-1 p-3.5 sm:p-4" style={{ background: '#f0f2f5' }}>
                  {selected === 'company' && (
                    <div className="space-y-2.5 sm:space-y-3">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">Employee Screenshot Management</h4>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {[
                          { lbl: 'Subscription', val: 'ACTIVE', cls: 'bg-green-50 border-green-200 text-green-700' },
                          { lbl: 'Employees', val: '42 / 50', cls: 'bg-blue-50 border-blue-200 text-blue-700' },
                          { lbl: 'Screenshots', val: '1,842', cls: 'bg-orange-50 border-orange-200 text-orange-700' },
                        ].map((k) => (
                          <div key={k.lbl} className={`${k.cls} border rounded-lg p-1.5 sm:p-2 text-center`}>
                            <div className="text-[8px] sm:text-[9px] font-medium text-gray-500 truncate">{k.lbl}</div>
                            <div className="text-[11px] sm:text-xs font-bold mt-0.5">{k.val}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 space-y-1.5">
                        <div className="text-[11px] sm:text-xs font-bold text-gray-700">Latest Captures</div>
                        {[
                          { n: 'Rahul K.', t: '10:25 AM', app: 'VS Code', size: '1.2 MB' },
                          { n: 'Ananya S.', t: '10:23 AM', app: 'Figma', size: '980 KB' },
                          { n: 'Vikram P.', t: '10:19 AM', app: 'AWS Console', size: '1.4 MB' },
                        ].map((sc) => (
                          <div
                            key={sc.n}
                            className="flex items-center justify-between text-[9px] sm:text-[10px] py-1 border-b border-gray-50 last:border-0"
                          >
                            <span className="font-semibold text-gray-700">{sc.n}</span>
                            <span className="text-gray-400">{sc.app}</span>
                            <span className="text-green-600 font-semibold">{sc.t}</span>
                            <span className="text-gray-400">{sc.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected === 'superadmin' && (
                    <div className="space-y-2.5 sm:space-y-3">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">License Key Generation Engine</h4>
                      <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3">
                        <div className="font-mono text-[10px] sm:text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5 mb-2 truncate">
                          KEY: SA-2026-X99B-8821-E4F0
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[9px] sm:text-[10px] text-gray-500">
                          <div>Company: Apex Digital Global</div>
                          <div>Plan: Enterprise (50 Seats)</div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3">
                        <div className="text-[11px] sm:text-xs font-bold text-gray-700 mb-2">Global System Metrics</div>
                        {[
                          { label: 'Total Ingested Screenshots', val: '2,419,840', color: 'text-gray-800' },
                          { label: 'Average API Latency', val: '142 ms', color: 'text-green-700' },
                          { label: 'Database Storage', val: '428 GB (Encrypted)', color: 'text-blue-600' },
                        ].map((m) => (
                          <div
                            key={m.label}
                            className="flex justify-between text-[9px] sm:text-[10px] py-1 border-b border-gray-50 last:border-0"
                          >
                            <span className="text-gray-500">{m.label}</span>
                            <span className={`font-bold ${m.color}`}>{m.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected === 'desktop' && (
                    <div className="space-y-2.5 sm:space-y-3 max-w-xs mx-auto">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">Silent Background Daemon</h4>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[9px] sm:text-[10px]">
                        {[
                          { label: 'Hardware ID', val: 'HW-9842-88F1', cls: 'text-green-700 font-mono' },
                          { label: 'RAM Usage', val: '14.2 MB', cls: 'text-green-700' },
                          { label: 'Capture Mode', val: '5m Interval', cls: 'text-gray-800' },
                          { label: 'Offline Buffer', val: '0 Pending', cls: 'text-gray-500' },
                        ].map((d) => (
                          <div key={d.label} className="p-2 rounded bg-white border border-gray-200">
                            <div className="text-gray-400 text-[8px] sm:text-[9px]">{d.label}</div>
                            <div className={`font-bold mt-0.5 ${d.cls}`}>{d.val}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 text-[9px] sm:text-[10px] text-gray-600">
                        <div className="flex items-center gap-1.5 text-green-700 font-bold mb-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span>Heartbeat Healthy — System Service Active</span>
                        </div>
                        <div>Auto-capture interval: every 5 minutes (dual monitor).</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
