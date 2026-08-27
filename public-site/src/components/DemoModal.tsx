import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mail,
  User,
  Building2,
  Users,
  MessageSquare,
  Send,
  CheckCircle2,
  Phone,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
}

export function DemoModal({ isOpen, onClose, initialSubject }: DemoModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const teamSizeOptions = [
    '1 – 10 Seats',
    '10 – 50 Seats',
    '50 – 100 Seats',
    '100 – 250 Seats',
    '250 – 500 Seats',
    '500+ Seats',
  ];

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '',
    phone: '',
    message: initialSubject ? `Interested in a demo — Specifically about: ${initialSubject}` : '',
  });

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamSize) {
      setIsDropdownOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Compute backend API endpoint
    const envApiUrl = (import.meta as any).env?.VITE_API_URL;
    const apiBase = envApiUrl || '/api/v1';

    try {
      const response = await fetch(`${apiBase}/enquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit enquiry. Please try again.');
      }

      setSubmitted(true);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // Confetti optional
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unable to connect to the server. Please email sales@advaitteleservices.com directly.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-pop-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900">Schedule Enterprise Demo</h3>
            <p className="text-xs text-gray-500 mt-0.5">We'll be in touch within 24 hours</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div className="px-5 sm:px-7 py-10 sm:py-12 text-center">
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 sm:w-8 h-7 sm:h-8 text-green-600" />
            </div>
            <h4 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-2">Request Received!</h4>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto mb-6 leading-relaxed">
              Your enterprise demo request has been received. Our solutions team will contact you at <strong className="text-gray-800">{form.email}</strong> within 24 hours.
            </p>
            <div className="space-y-2 max-w-sm mx-auto text-left">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>Live walkthrough of both portals</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>Custom ROI analysis for your team size</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>14-day trial setup with your own data</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 px-6 py-2.5 btn-primary rounded-xl text-xs sm:text-sm cursor-pointer shadow-sm"
            >
              Close Window
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-5 sm:py-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-pop-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    required
                    disabled={isSubmitting}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Priya Sharma"
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Work Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    required
                    disabled={isSubmitting}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="priya@company.com"
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Company / Organization *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  required
                  disabled={isSubmitting}
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Tata Consultancy Ltd"
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Custom HTML/React Dropdown for Team Size */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Team Size *</label>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border rounded-xl bg-gray-50 text-left flex items-center justify-between transition-all cursor-pointer outline-none disabled:opacity-50 ${
                    isDropdownOpen
                      ? 'border-green-600 ring-2 ring-green-100 bg-white'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <Users className="absolute left-3 top-[37px] -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <span className={form.teamSize ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {form.teamSize || 'Select range'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180 text-green-700' : ''
                    }`}
                  />
                </button>

                {/* Custom Styled Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 animate-pop-in">
                    {teamSizeOptions.map((option) => {
                      const isSelected = form.teamSize === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, teamSize: option });
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left rounded-lg text-xs sm:text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-green-50 text-green-800 font-semibold'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-green-700'
                          }`}
                        >
                          <span>{option}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-green-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="tel"
                    disabled={isSubmitting}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Specific Requirements (Optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3.5 w-3.5 h-3.5 text-gray-400" />
                <textarea
                  rows={3}
                  disabled={isSubmitting}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your monitoring use case, team structure, or specific features you'd like to explore..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all resize-none disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm cursor-pointer shadow-green-glow mt-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Demo Request</span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-gray-400">
              No commitments. Our enterprise team responds within 24 hours. Your data is never shared with third parties.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

