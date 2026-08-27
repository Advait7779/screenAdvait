import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Calendar, ShoppingCart } from 'lucide-react';
import {
  SvgEmployeeUsers,
  SvgCaptureCamera,
} from './icons/ColorfulIcons';

interface PricingSectionProps {
  onOpenDemo: (name: string) => void;
  onOpenBuy: (plan: 'MONTHLY' | 'ANNUAL') => void;
}

export function PricingSection({ onOpenDemo, onOpenBuy }: PricingSectionProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const sharedFeatures = [
    '1-minute to 60-minute customizable capture intervals',
    'Multi-monitor & dual-display full HD screenshot capture',
    'Real-time online, idle & offline status tracking',
    'Centralized Company Admin Portal with employee directory',
    'Granular per-employee pause & capture controls',
    'Hardware-locked (HWID) anti-piracy licensing',
    'Automated screenshot retention & auto-cleanup policy',
    'Full organization visual timeline & daily activity archive',
    'Priority setup assistance & ongoing technical support',
  ];

  const plans = [
    {
      name: 'Monthly Plan',
      planType: 'MONTHLY' as const,
      targetUser: 'Flexible Monthly Billing',
      billingDetail: 'Billed monthly per active seat',
      price: 300,
      period: '/ employee / month',
      subtext: 'Pay as you go • Cancel anytime',
      badge: null,
      icon: SvgEmployeeUsers,
      iconBg: 'bg-emerald-50 border-emerald-200',
      isPopular: false,
    },
    {
      name: 'Annual Plan',
      planType: 'ANNUAL' as const,
      targetUser: '1-Year Enterprise Commitment',
      billingDetail: 'Billed annually per active seat',
      price: 200,
      period: '/ employee / month',
      subtext: 'Save ₹1,200/seat per year (33% Off)',
      badge: 'Best Value • Save 33%',
      icon: SvgCaptureCamera,
      iconBg: 'bg-green-50 border-green-200',
      isPopular: true,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-800 text-xs font-semibold uppercase tracking-wider mb-4">
            Simple & Transparent
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Predictable, Per-Employee Pricing
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-500">
            All enterprise features included in every plan. Choose monthly flexibility or save 33% with an annual plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch pt-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isHovered = hoveredPlan === plan.name;

            return (
              <div
                key={plan.name}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`portal-card flex flex-col transition-all duration-300 relative ${
                  plan.isPopular
                    ? 'ring-2 ring-green-600 shadow-lg border-green-200 bg-white'
                    : isHovered
                    ? 'ring-2 ring-gray-300 shadow-md bg-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Floating pill badge for perfect card alignment */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-700 to-green-600 text-white text-center px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap z-10">
                    {plan.badge}
                  </div>
                )}

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-[11px] font-bold text-green-700 uppercase tracking-widest block mb-1">
                          {plan.targetUser}
                        </span>
                        <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{plan.billingDetail}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center p-2.5 shadow-xs shrink-0 ${plan.iconBg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="border-y border-gray-100 py-5 my-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">₹{plan.price}</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-500">{plan.period}</span>
                      </div>
                      <p className={`text-xs font-semibold mt-2 h-4 flex items-center ${plan.isPopular ? 'text-green-700' : 'text-gray-500'}`}>
                        {plan.subtext}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="mt-5 mb-2">
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
                        Everything included in this plan:
                      </p>
                      <ul className="space-y-3.5">
                        {sharedFeatures.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-gray-600 leading-snug min-h-[20px]">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Dual Action Buttons: Buy Now & Book a Demo */}
                  <div className="mt-8 space-y-2.5">
                    <button
                      onClick={() => onOpenBuy(plan.planType)}
                      className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        plan.isPopular
                          ? 'btn-primary shadow-md hover:shadow-lg'
                          : 'bg-green-700 hover:bg-green-800 text-white shadow-sm'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Buy Now ({plan.name})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenDemo(plan.name)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 bg-gray-50 hover:bg-white hover:text-green-700 hover:border-green-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Book a Demo / Enquiry</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Need custom workstation intervals or high-volume enterprise licensing?{' '}
            <button
              onClick={() => onOpenDemo('Enterprise Custom')}
              className="text-green-700 font-bold underline hover:text-green-800 cursor-pointer ml-1"
            >
              Contact our sales team
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}


