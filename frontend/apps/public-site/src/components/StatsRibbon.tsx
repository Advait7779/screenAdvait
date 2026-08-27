import React from 'react';
import {
  SvgIntervalSliders,
  SvgMultiScreen,
  SvgCryptoKey,
  SvgDesktopDaemon,
} from './icons/ColorfulIcons';

export function StatsRibbon() {
  const stats = [
    {
      value: '1m – 60m',
      label: 'Granular Capture Intervals',
      subtext: 'Dynamic frequency with 1-click remote pause & resume',
      icon: SvgIntervalSliders,
      bg: 'bg-green-50/70 border-green-200',
    },
    {
      value: 'Multi-Screen',
      label: 'Dual & Ultrawide Display Capture',
      subtext: 'Simultaneous full-resolution multi-monitor logging',
      icon: SvgMultiScreen,
      bg: 'bg-blue-50/70 border-blue-200',
    },
    {
      value: 'HWID Lock',
      label: 'Hardware-Bound License Security',
      subtext: 'Motherboard & MAC-tied keys with 1-click device reset',
      icon: SvgCryptoKey,
      bg: 'bg-emerald-50/70 border-emerald-200',
    },
    {
      value: '< 15 MB',
      label: 'Silent Background Desktop Agent',
      subtext: 'Under 0.2% CPU footprint with offline capture buffer',
      icon: SvgDesktopDaemon,
      bg: 'bg-cyan-50/70 border-cyan-200',
    },
  ];

  return (
    <section className="py-10 sm:py-14 border-y border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-[11px] sm:text-xs uppercase tracking-widest text-gray-400 font-semibold">
            Core Platform Architecture & Technical Capabilities
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`portal-card ${item.bg} p-4 sm:p-6 transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900">
                    {item.value}
                  </span>
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-white shadow-xs border border-gray-200/80 flex items-center justify-center p-1.5 shrink-0">
                    <Icon className="w-5 sm:w-6 h-5 sm:h-6" />
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 mb-1">{item.label}</h4>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">{item.subtext}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
