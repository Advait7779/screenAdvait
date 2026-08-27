import React, { useState } from 'react';
import { TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

interface RoiCalculatorProps { onOpenDemo: (name: string) => void; }

export function RoiCalculator({ onOpenDemo }: RoiCalculatorProps) {
  const [employees, setEmployees] = useState(50);
  const [avgSalary, setAvgSalary] = useState(60000);
  const [idleReduction, setIdleReduction] = useState(20);

  const yearlyPayroll = employees * avgSalary;
  const recoveredValue = Math.round(yearlyPayroll * (idleReduction / 100));
  const estimatedPlatformCost = employees * 240;
  const netRoi = recoveredValue - estimatedPlatformCost;
  const roiMultiplier = estimatedPlatformCost > 0 ? (netRoi / estimatedPlatformCost).toFixed(1) : '—';
  const monthlyRecovered = Math.round(recoveredValue / 12);

  const formatMoney = (n: number) => n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <section id="calculator" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-green mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Live ROI & Productivity Estimator</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Calculate Your Workforce ROI
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-500">
            Estimate the direct productivity and cost recovery value your enterprise can achieve.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sliders */}
          <div className="lg:col-span-6 portal-card p-8 flex flex-col gap-7">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-4">
                Team Headcount — <span className="text-green-700 font-extrabold">{employees} Employees</span>
              </label>
              <input type="range" min={5} max={500} step={5} value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>5</span><span>500 seats</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-4">
                Average Annual Salary — <span className="text-green-700 font-extrabold">₹{avgSalary.toLocaleString()}</span>
              </label>
              <input type="range" min={20000} max={500000} step={5000} value={avgSalary}
                onChange={(e) => setAvgSalary(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>₹20,000</span><span>₹5,00,000</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-4">
                Expected Idle Time Reduction — <span className="text-green-700 font-extrabold">{idleReduction}%</span>
              </label>
              <input type="range" min={5} max={50} step={1} value={idleReduction}
                onChange={(e) => setIdleReduction(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>5%</span><span>50% (Industry Max)</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-6 space-y-5">
            {/* Big number */}
            <div className="p-7 rounded-2xl text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #4ade80, transparent 65%)', transform: 'translate(30%, -30%)' }} />
              <div className="text-xs font-bold text-green-200 uppercase tracking-wider mb-3">
                Estimated Annual Net ROI Recovery
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold">
                {formatMoney(netRoi)}
              </div>
              <div className="text-xs text-green-200 mt-2">
                {roiMultiplier}× return on ScreenAdvait investment
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Monthly Recovered Value', value: formatMoney(monthlyRecovered), accent: 'bg-green-50 border-green-200 text-green-800' },
                { label: 'Annual Payroll Exposure', value: formatMoney(yearlyPayroll), accent: 'bg-gray-50 border-gray-200 text-gray-700' },
                { label: 'Workforce Optimization Gain', value: `${idleReduction}% Efficiency`, accent: 'bg-blue-50 border-blue-200 text-blue-800' },
                { label: 'Platform Est. Annual Cost', value: formatMoney(estimatedPlatformCost), accent: 'bg-gray-50 border-gray-200 text-gray-700' },
              ].map((k) => (
                <div key={k.label} className={`rounded-xl border p-4 ${k.accent}`}>
                  <div className="text-[10px] font-medium text-gray-500 mb-1">{k.label}</div>
                  <div className="text-sm font-extrabold">{k.value}</div>
                </div>
              ))}
            </div>

            <button onClick={() => onOpenDemo('ROI Calculator CTA')}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm cursor-pointer shadow-green-glow">
              <span>Get Personalized ROI Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
