import React from 'react';
import { ShieldCheck, Lock, Key, Server, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SecurityComplianceProps { onOpenDemo: (name: string) => void; }

export function SecurityCompliance({ onOpenDemo }: SecurityComplianceProps) {
  const pillars = [
    { title: 'AES-256 Data Encryption at Rest & in Transit', icon: Lock, iconBg: 'bg-green-50 border-green-200 text-green-700',
      desc: 'All screenshot payloads, metadata, and telemetry are encrypted using AES-256 both during storage and network transmission. Zero plaintext data ever leaves the endpoint.' },
    { title: 'Hardware-Bound HWID Anti-Piracy Licensing', icon: Key, iconBg: 'bg-blue-50 border-blue-200 text-blue-700',
      desc: 'License keys bind to motherboard and MAC identifiers, making them cryptographically non-transferable. Unauthorized workstation activation results in immediate revocation.' },
    { title: 'Multi-Tenant Workspace Isolation', icon: Server, iconBg: 'bg-purple-50 border-purple-200 text-purple-700',
      desc: 'Complete data and session segregation between organizations. SuperAdmin manages provisioning while company admins maintain exclusive oversight of their workforce captures.' },
    { title: 'Tamper-Proof Immutable Audit Logs', icon: Eye, iconBg: 'bg-orange-50 border-orange-200 text-orange-600',
      desc: 'Every login attempt, license activation, screenshot event, and admin action is permanently recorded in a cryptographic audit trail that cannot be modified or deleted.' },
    { title: 'Principle of Least Privilege Access', icon: ShieldCheck, iconBg: 'bg-green-50 border-green-200 text-green-700',
      desc: 'Fine-grained RBAC separates SuperAdmin (system control), Company Admin (workspace management), and Employee (desktop agent only) access with zero role overlap.' },
    { title: 'Offline-Resilient Encrypted Local Buffer', icon: AlertTriangle, iconBg: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      desc: 'When connectivity drops, the desktop agent stores encrypted captures locally and auto-syncs to the server with integrity verification upon reconnection.' },
  ];

  return (
    <section id="security" className="py-24" style={{ background: '#f0f2f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-green mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Enterprise-Grade Security Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Security You Can Bet Your Enterprise On
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-500">
            ScreenAdvait is built security-first with a zero-trust architecture designed for regulated, high-compliance enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="portal-card p-6 flex flex-col gap-4">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${pillar.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{pillar.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compliance badges */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-card p-8">
          <h4 className="text-center text-sm font-bold text-gray-700 mb-6 uppercase tracking-wider">
            Compliance & Security Methodology Alignment
          </h4>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'RBAC — Role-Based Access Control',
              'AES-256 Data Encryption',
              'HWID Hardware Authentication',
              'Immutable Audit Logging',
              'Zero-Trust Internal Architecture',
              'Customer Data Sovereignty',
              'Offline-First Encrypted Agent',
            ].map((badge) => (
              <div key={badge}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-green-800 bg-green-50 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
