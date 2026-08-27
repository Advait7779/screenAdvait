import React from 'react';
import { Star } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    { name: 'Priya Sharma', role: 'VP Engineering', company: 'Reliance Digital Services', rating: 5, avatar: 'PS',
      quote: 'ScreenAdvait transformed how we manage our 200+ member distributed engineering team. The dual-portal architecture keeps management and operations cleanly separated, and the automated screenshot timeline gives us immediate operational clarity.' },
    { name: 'Arjun Mehra', role: 'CTO', company: 'FinCore Analytics', rating: 5, avatar: 'AM',
      quote: 'Hardware-locked licensing was a game-changer for our compliance team. Zero piracy exposure, clean audit trails, and our legal team specifically asked for ScreenAdvait after reviewing the security architecture.' },
    { name: 'Deepika Nair', role: 'Head of HR Ops', company: 'Tata Consultancy Network', rating: 5, avatar: 'DN',
      quote: 'We reduced "unaccounted time" reports by 47% within 8 weeks. The screenshot gallery view helps HR resolve attendance disputes with factual visual evidence instead of gut feel.' },
    { name: 'Rohan Gupta', role: 'IT Director', company: 'Apex Digital Group', rating: 5, avatar: 'RG',
      quote: 'The SuperAdmin portal let our IT team provision 60+ client companies in a single afternoon. License key generation is instant and the subscription management dashboard is exactly what an MSP needs.' },
    { name: 'Neha Patel', role: 'Operations Manager', company: 'BridgeTech Solutions', rating: 5, avatar: 'NP',
      quote: 'After evaluating TimeChamp and TeamTrace, we chose ScreenAdvait because it is the only tool that gives us true hardware-level security combined with a remarkably clean interface that non-technical managers can use.' },
    { name: 'Kiran Verma', role: 'CEO', company: 'NovaSoft Ventures', rating: 5, avatar: 'KV',
      quote: 'Deploying ScreenAdvait to 80 seats was completely seamless. The agent installer is a single .exe file, and once employees enter their key, monitoring starts automatically. Our IT helpdesk time dropped to nearly zero.' },
  ];

  return (
    <section className="py-24" style={{ background: '#f0f2f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-green mb-4">
            <Star className="w-3.5 h-3.5 fill-current text-yellow-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Real Enterprise Success Stories</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Trusted by 300+ Enterprise Teams in India
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-500">
            From 10-seat startups to 500-seat enterprises — real feedback from customers who transformed their workforce oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, idx) => (
            <div key={idx} className="portal-card p-6 flex flex-col justify-between gap-5">
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                ))}
              </div>

              <blockquote className="text-sm text-gray-600 leading-relaxed flex-1">
                "{t.quote}"
              </blockquote>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
