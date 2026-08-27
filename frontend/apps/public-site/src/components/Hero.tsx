import React from 'react';
import {
  ArrowRight,
  Monitor,
  CheckCircle2,
  Play,
  Activity,
  Layers,
  Eye,
} from 'lucide-react';

interface HeroProps {
  onOpenDemo: (source?: string) => void;
}

export function Hero({ onOpenDemo }: HeroProps) {
  return (
    <section
      className="relative pt-32 pb-28 lg:pt-38 lg:pb-36 overflow-hidden min-h-[96vh] flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #1a2e24 0%, #15803d 55%, #166534 100%)' }}
    >
      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* ── LEFT COLUMN: Value Proposition & CTAs ── */}
          <div className="lg:col-span-5 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-[2.9rem] font-extrabold tracking-tight leading-[1.22] sm:leading-[1.2] mb-4 text-white">
              Effortless Team Visibility with{' '}
              <span className="text-green-300 block sm:inline">
                Automated Screenshots
              </span>{' '}
              & Zero Lag
            </h1>

            <p className="text-sm sm:text-base text-green-100 leading-relaxed mb-5">
              Silently capture multi-screen employee desktops at custom intervals, protect software licenses with hardware lock, and review daily work activity in a clean timeline dashboard.
            </p>

            {/* Action Buttons — 1 Row Side-by-Side on all screens */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 mb-5">
              <button
                onClick={() => onOpenDemo('Hero primary')}
                className="flex-1 sm:flex-none px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-green-800 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 hover:-translate-y-0.5 whitespace-nowrap"
              >
                <span>Book <span className="hidden xs:inline sm:inline">Enterprise </span>Demo</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
              <a
                href="#portals"
                className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
              >
                <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300 shrink-0" />
                <span>Explore Portals</span>
              </a>
            </div>

            {/* 4 Trust Checkmarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-green-100 pt-4 border-t border-white/15">
              {[
                'Silent Background Agent (<15MB RAM)',
                'Hardware-Locked License Security',
                'Custom 1m – 60m Capture Frequency',
                'Multi-Screen Dual Display Capture',
              ].map((t) => (
                <div key={t} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-300 shrink-0 mt-0.5" />
                  <span className="leading-snug text-[11px] font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Unique Compact Bento Grid (Light-Themed & Perfectly Scaled) ── */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-12 gap-3">

              {/* CARD 1: Desktop Agent Live Tracker (5 Columns on Desktop) */}
              <div className="col-span-12 sm:col-span-5 bg-white rounded-xl shadow-lg border border-gray-200/80 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-gray-800">ScreenAdvait Agent</span>
                    </div>
                    <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                      v2.4 Silent
                    </span>
                  </div>

                  {/* Active Shift Timer Banner */}
                  <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-lg p-2 mb-2 flex items-center justify-between shadow-sm">
                    <div>
                      <div className="text-[8px] text-green-200 uppercase font-semibold tracking-wider">Active Shift Time</div>
                      <div className="text-sm font-extrabold font-mono tracking-tight">04 : 36 : 08</div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-600">
                    Workstation: <strong className="text-gray-800 font-semibold">Rahul K. (Dev)</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[9px] text-gray-500 mt-2">
                  <span>Interval: <strong className="text-gray-700">5m Auto</strong></span>
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500" />
                    HWID Bound
                  </span>
                </div>
              </div>

              {/* CARD 2: Fleet Telemetry & Status Distribution (7 Columns on Desktop) */}
              <div className="col-span-12 sm:col-span-7 bg-white rounded-xl shadow-lg border border-gray-200/80 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-green-700" />
                      <span className="text-[11px] font-bold text-gray-800">Fleet Telemetry</span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-medium">Real-time Matrix</span>
                  </div>

                  {/* 4 Attendance Status Pills */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-1.5 text-center">
                      <div className="text-xs font-extrabold text-green-700">42</div>
                      <div className="text-[8px] text-green-800 font-semibold truncate">Active</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5 text-center">
                      <div className="text-xs font-extrabold text-blue-700">6</div>
                      <div className="text-[8px] text-blue-800 font-semibold truncate">Idle</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-1.5 text-center">
                      <div className="text-xs font-extrabold text-purple-700">2</div>
                      <div className="text-[8px] text-purple-800 font-semibold truncate">Leave</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-1.5 text-center">
                      <div className="text-xs font-extrabold text-orange-700">0</div>
                      <div className="text-[8px] text-orange-800 font-semibold truncate">Offline</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[9px] text-gray-500">
                  <span>Seats: <strong className="text-green-700 font-bold">50 Active</strong></span>
                  <span className="text-gray-700 font-semibold">96% Utilization</span>
                </div>
              </div>

              {/* CARD 3: Shift Telemetry Matrix (6 Columns) */}
              <div className="col-span-12 sm:col-span-6 bg-white rounded-xl shadow-lg border border-gray-200/80 p-3">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
                  <span className="text-[11px] font-bold text-gray-800">Shift Telemetry</span>
                  <span className="text-[9px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                    Today
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[8px] text-gray-400 font-medium">Shift Start</div>
                    <div className="text-[11px] font-bold text-gray-800 mt-0.5">09:00 AM</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[8px] text-gray-400 font-medium">Active Working</div>
                    <div className="text-[11px] font-bold text-green-700 mt-0.5">07h 45m</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[8px] text-gray-400 font-medium">Last Capture</div>
                    <div className="text-[11px] font-bold text-blue-700 mt-0.5">10:24 AM</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[8px] text-gray-400 font-medium">API Latency</div>
                    <div className="text-[11px] font-bold text-gray-800 mt-0.5">142 ms</div>
                  </div>
                </div>
              </div>

              {/* CARD 4: Active Workstation Apps (6 Columns) */}
              <div className="col-span-12 sm:col-span-6 bg-white rounded-xl shadow-lg border border-gray-200/80 p-3">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
                  <span className="text-[11px] font-bold text-gray-800">Active Applications</span>
                  <span className="text-[9px] text-gray-400 font-mono">Live Sync</span>
                </div>

                <div className="space-y-1">
                  {[
                    { app: 'Visual Studio Code', type: 'Productive', tag: 'bg-green-50 text-green-700 border-green-200' },
                    { app: 'Figma Design Suite', type: 'Productive', tag: 'bg-green-50 text-green-700 border-green-200' },
                    { app: 'AWS Cloud Console', type: 'Productive', tag: 'bg-green-50 text-green-700 border-green-200' },
                  ].map((row) => (
                    <div key={row.app} className="flex items-center justify-between py-0.5 px-1.5 rounded bg-gray-50 border border-gray-100 text-[10px]">
                      <span className="font-semibold text-gray-700 truncate max-w-[130px]">{row.app}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${row.tag}`}>
                        {row.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 5: Automated Screenshots Timeline Stream — Clean Light Theme (12 Columns) */}
              <div className="col-span-12 bg-white rounded-xl shadow-lg border border-gray-200/80 p-3">
                {/* Header bar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-md bg-green-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Eye className="w-3 h-3" />
                      <span>Live Screenshots</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-gray-500" />
                      <span>Dual Monitor</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-green-700 font-bold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping-slow" />
                    1,842 Captures Today
                  </div>
                </div>

                {/* Side-by-side Dual Screenshots — Crisp Light Theme */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                  {/* Screenshot 1 (Display 1 - Light Editor Mockup) */}
                  <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200 p-2 text-gray-800">
                    <div className="flex items-center justify-between text-[9px] text-gray-500 pb-1 mb-1 border-b border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        </div>
                        <span className="font-bold text-gray-700 ml-0.5">Display 1 (Primary)</span>
                      </div>
                      <span className="font-mono text-gray-400 text-[8px]">10:24 AM · 1.2 MB</span>
                    </div>

                    {/* Light Code Preview */}
                    <div className="bg-white rounded border border-slate-200/80 p-1.5 font-mono text-[8.5px] space-y-0.5 text-slate-700 shadow-2xs">
                      <div className="text-purple-700 font-semibold">import <span className="text-slate-700">&#123; captureMultiScreen &#125;</span> from <span className="text-emerald-700">'./engine'</span>;</div>
                      <div className="text-slate-400 text-[7.5px]">// Lossless dual-screen background worker</div>
                      <div className="text-blue-700">const <span className="text-slate-800">frame</span> = await captureMultiScreen();</div>
                      <div className="text-emerald-700">await syncToPortalSecure(&#123; frame &#125;);</div>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[9px] text-gray-500 pt-1 border-t border-slate-200/60">
                      <span>User: <strong className="text-gray-800">Rahul K.</strong></span>
                      <span className="text-green-700 font-semibold bg-green-50 px-1 py-0.2 rounded border border-green-200 text-[8px]">VS Code</span>
                    </div>
                  </div>

                  {/* Screenshot 2 (Display 2 - Light Analytics/Design Mockup) */}
                  <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200 p-2 text-gray-800">
                    <div className="flex items-center justify-between text-[9px] text-gray-500 pb-1 mb-1 border-b border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        </div>
                        <span className="font-bold text-gray-700 ml-0.5">Display 2 (Extended)</span>
                      </div>
                      <span className="font-mono text-gray-400 text-[8px]">10:22 AM · 980 KB</span>
                    </div>

                    {/* Light Dashboard UI Preview */}
                    <div className="bg-white rounded border border-slate-200/80 p-1.5 text-[8.5px] space-y-1 shadow-2xs">
                      <div className="flex justify-between text-gray-500 text-[7.5px]">
                        <span className="font-medium">Cloud Telemetry Sync</span>
                        <span className="text-green-700 font-bold">100% Encrypted</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1 bg-green-600 rounded-full w-full" />
                        <div className="h-1 bg-blue-600 rounded-full w-4/5" />
                        <div className="h-1 bg-purple-500 rounded-full w-2/3" />
                      </div>
                      <div className="text-[7.5px] text-gray-400 flex justify-between pt-0.5">
                        <span>Figma Design Workspace</span>
                        <span className="font-bold text-gray-600">3840×1080</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[9px] text-gray-500 pt-1 border-t border-slate-200/60">
                      <span>User: <strong className="text-gray-800">Ananya S.</strong></span>
                      <span className="text-blue-700 font-semibold bg-blue-50 px-1 py-0.2 rounded border border-blue-200 text-[8px]">Figma Design</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
