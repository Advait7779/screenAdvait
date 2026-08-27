import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  SvgCaptureCamera,
  SvgHardwareLock,
  SvgEmployeeUsers,
  SvgTimelineFolders,
  SvgMultiTenantBuilding,
  SvgDesktopDaemon,
  SvgSearchArchive,
  SvgZeroLagZap,
} from './icons/ColorfulIcons';

interface FeaturesBentoProps {
  onOpenDemo: (name: string) => void;
}

export function FeaturesBento({ onOpenDemo }: FeaturesBentoProps) {
  const features = [
    {
      title: 'Automated Multi-Screen Capture & Interval Engine',
      category: 'Capture Engine',
      description: 'Continuously captures full-resolution desktop displays across single, dual, and ultrawide 4K monitors. Adjust capture frequency on the fly (1m, 5m, 10m, 15m) or pause captures company-wide with instant agent synchronization.',
      icon: SvgCaptureCamera,
      badge: 'Multi-Monitor 4K',
      badgeClass: 'bg-green-50 text-green-700 border-green-200',
      span: 'lg:col-span-8',
      iconBoxBg: 'bg-green-50/80 border-green-200',
    },
    {
      title: 'Hardware-Locked License Keys',
      category: 'Hardware Security',
      description: 'Generates cryptographically signed license keys locked to workstation motherboard & MAC identifiers. Prevents unauthorized key sharing with 1-click device reset and key revocation.',
      icon: SvgHardwareLock,
      badge: 'Anti-Tamper HWID',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      span: 'lg:col-span-4',
      iconBoxBg: 'bg-blue-50/80 border-blue-200',
    },
    {
      title: 'Employee Directory & Key Distribution',
      category: 'Employee Management',
      description: 'Provision employee accounts with temporary credentials, issue one-time activation keys, toggle active/disabled status, and manage password resets from a single dashboard.',
      icon: SvgEmployeeUsers,
      badge: 'One-Time Activation',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      span: 'lg:col-span-4',
      iconBoxBg: 'bg-emerald-50/80 border-emerald-200',
    },
    {
      title: 'Hierarchical Date & Employee Timeline Gallery',
      category: 'Visual Timeline',
      description: 'Intelligently groups captures into Date > Employee folders with live timestamps and file size metrics. Features day-by-day playback, expandable tree navigators, and full-resolution lossless image inspection with direct downloads.',
      icon: SvgTimelineFolders,
      badge: 'Day & User Hierarchies',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      span: 'lg:col-span-8',
      iconBoxBg: 'bg-purple-50/80 border-purple-200',
    },
    {
      title: 'SuperAdmin Multi-Tenant Provisioning',
      category: 'Platform Control',
      description: 'Centralized control center for onboarding company tenants, assigning employee seat and device quotas, tracking subscription expirations, and overseeing global license activations.',
      icon: SvgMultiTenantBuilding,
      badge: 'Multi-Tenant Hub',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
      span: 'lg:col-span-4',
      iconBoxBg: 'bg-orange-50/80 border-orange-200',
    },
    {
      title: 'Ultra-Lightweight Desktop Agent',
      category: 'Workstation Daemon',
      description: 'Runs silently in the background using under 15MB RAM and 0.2% CPU. Auto-starts on Windows boot, verifies hardware authenticity, and operates with zero employee distraction.',
      icon: SvgDesktopDaemon,
      badge: '< 15MB RAM',
      badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      span: 'lg:col-span-4',
      iconBoxBg: 'bg-cyan-50/80 border-cyan-200',
    },
    {
      title: 'Searchable Archive & Custom Pagination',
      category: 'Archive & Audit',
      description: 'Filter the complete screenshot archive by employee username and date ranges. Jump through custom page sizes (10, 25, 50, 100) with direct JWT-authenticated file download endpoints.',
      icon: SvgSearchArchive,
      badge: 'Search & Pagination',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      span: 'lg:col-span-4',
      iconBoxBg: 'bg-teal-50/80 border-teal-200',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24" style={{ background: '#f0f2f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-green mb-4">
            <SvgZeroLagZap className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Automated Desktop Monitoring & License Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Complete Screenshot Monitoring & License Control
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-500">
            From automated multi-screen captures and hardware-bound license keys to custom 1m–15m interval controls and searchable organization archives.
          </p>
        </div>

        {/* Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`${feat.span} portal-card p-5 sm:p-7 flex flex-col justify-between group transition-all hover:shadow-card-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <div className={`w-11 sm:w-12 h-11 sm:h-12 rounded-xl border flex items-center justify-center p-2 sm:p-2.5 shadow-2xs ${feat.iconBoxBg}`}>
                      <Icon className="w-6 sm:w-7 h-6 sm:h-7" />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full border ${feat.badgeClass}`}>
                      {feat.badge}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-green-700 uppercase tracking-wider mb-1">
                    {feat.category}
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-green-700 transition-colors leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
                <div className="pt-3.5 sm:pt-4 mt-3.5 sm:mt-4 border-t border-gray-100">
                  <button
                    onClick={() => onOpenDemo(feat.title)}
                    className="text-xs font-semibold text-gray-400 group-hover:text-green-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Request Feature Demo</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
