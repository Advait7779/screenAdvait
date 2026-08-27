import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  SvgMultiTenantBuilding,
  SvgCryptoKey,
  SvgDownloadInstaller,
  SvgCaptureCamera,
  SvgSecurityShield,
} from './icons/ColorfulIcons';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Company Provisioning & Setup',
      badge: 'SuperAdmin Hub',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
      highlight: 'Multi-Tenant Isolation',
      icon: SvgMultiTenantBuilding,
      iconBg: 'bg-orange-50/80 border-orange-200',
      description: 'The SuperAdmin provisions the dedicated company workspace, assigns employee seat limits, and configures retention rules in seconds.',
    },
    {
      step: '02',
      title: 'Employee Registry & Key Issuance',
      badge: 'Company Portal',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      highlight: 'Anti-Piracy Protected',
      icon: SvgCryptoKey,
      iconBg: 'bg-emerald-50/80 border-emerald-200',
      description: 'Company admins add employee profiles and generate cryptographically signed, hardware-bound license keys for each workstation.',
    },
    {
      step: '03',
      title: 'Silent Desktop Agent Deployment',
      badge: 'Windows & macOS',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      highlight: 'Zero User Distraction',
      icon: SvgDownloadInstaller,
      iconBg: 'bg-blue-50/80 border-blue-200',
      description: 'Employees run the lightweight installer once and input their assigned key. The agent authenticates hardware and enters background mode.',
    },
    {
      step: '04',
      title: 'Live Streams & Timeline Playback',
      badge: 'Visual Stream',
      badgeClass: 'bg-green-50 text-green-700 border-green-200',
      highlight: 'Instant Portal Sync',
      icon: SvgCaptureCamera,
      iconBg: 'bg-green-50/80 border-green-200',
      description: 'Screenshots automatically capture on your configured interval and stream directly to your secure Company Portal timeline and archive.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-green mb-4">
            <SvgSecurityShield className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Frictionless 4-Step Onboarding</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            How ScreenAdvait Works in Production
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-500">
            From initial provisioning to live screenshot ingestion in under 5 minutes per workstation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="portal-card p-5 sm:p-6 flex flex-col justify-between relative transition-all hover:-translate-y-0.5"
              >
                <div className="absolute top-4 right-5 text-4xl sm:text-5xl font-extrabold text-gray-100 font-mono select-none">
                  {step.step}
                </div>
                <div>
                  <div className={`w-11 sm:w-12 h-11 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5 p-2 shadow-2xs border ${step.iconBg}`}>
                    <Icon className="w-6 sm:w-7 h-6 sm:h-7" />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${step.badgeClass}`}>
                    {step.badge}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mt-2.5 sm:mt-3 mb-1.5 sm:mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100 mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span>{step.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
