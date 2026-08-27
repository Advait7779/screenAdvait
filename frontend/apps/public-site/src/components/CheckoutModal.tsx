import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  Minus,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'MONTHLY' | 'ANNUAL';
}

export function CheckoutModal({
  isOpen,
  onClose,
  initialPlan = 'ANNUAL',
}: CheckoutModalProps) {
  const [plan, setPlan] = useState<'MONTHLY' | 'ANNUAL'>(initialPlan);
  const [seats, setSeats] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    companyId: string;
    username: string;
    temporaryPassword?: string;
    portalUrl: string;
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });

  useEffect(() => {
    if (initialPlan) setPlan(initialPlan);
  }, [initialPlan]);

  // Dynamically load Razorpay SDK
  useEffect(() => {
    if (!isOpen) return;
    if (document.getElementById('razorpay-checkout-script')) return;

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [isOpen]);

  if (!isOpen) return null;

  const pricePerSeatPerMonth = plan === 'ANNUAL' ? 200 : 300;
  const totalAmount = plan === 'ANNUAL' ? seats * 200 * 12 : seats * 300;
  const annualSavings = seats * (300 - 200) * 12;

  const handleSeatChange = (delta: number) => {
    setSeats((prev) => Math.max(1, Math.min(5000, prev + delta)));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    const apiBase = (import.meta as any).env?.VITE_API_URL || '/api/v1';

    try {
      // 1. Create Razorpay order on backend
      const orderRes = await fetch(`${apiBase}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          seats,
          companyName: form.company.trim(),
          adminName: form.name.trim(),
          adminEmail: form.email.trim().toLowerCase(),
          adminPhone: form.phone.trim() || undefined,
        }),
      });

      const orderData = await orderRes.json().catch(() => ({}));

      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to initialize payment gateway.');
      }

      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 2. Launch Razorpay Checkout Popup
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ScreenAdvait Enterprise',
        description: `${seats} Seats (${plan === 'ANNUAL' ? '1-Year Plan' : '1-Month Plan'})`,
        image: '/logo.png',
        order_id: orderData.orderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: '#166534',
        },
        handler: async (response: any) => {
          try {
            setIsProcessing(true);
            // 3. Verify signature on backend & provision account
            const verifyRes = await fetch(`${apiBase}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
                seats,
                companyName: form.company.trim(),
                adminName: form.name.trim(),
                adminEmail: form.email.trim().toLowerCase(),
                adminPhone: form.phone.trim() || undefined,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.message || 'Payment verification failed.');
            }

            setSuccessData(verifyData);
            try {
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
            } catch {}
          } catch (verifyErr: any) {
            setErrorMessage(verifyErr.message || 'Payment was recorded but verification failed. Please contact sales.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new RazorpayConstructor(options);
      rzp.on('payment.failed', (resp: any) => {
        setErrorMessage(resp.error?.description || 'Payment was cancelled or declined.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to proceed with checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-pop-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center text-green-700">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
                Instant License Checkout
              </h3>
              <p className="text-xs text-gray-500">Secure 256-bit encrypted Razorpay payment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successData ? (
          /* Payment Success State */
          <div className="px-5 sm:px-8 py-8 sm:py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-gray-900 mb-1.5">
              Payment Successful! 🎉
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
              Your ScreenAdvait company account has been provisioned. A confirmation email with credentials has been sent to <strong className="text-gray-800">{form.email}</strong>.
            </p>

            {successData.temporaryPassword && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-md mx-auto text-left mb-6 space-y-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Your Admin Credentials</p>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Username:</span>
                  <span className="font-mono font-bold text-gray-900">{successData.username}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Temporary Password:</span>
                  <span className="font-mono font-bold text-green-700">{successData.temporaryPassword}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <a
                href={successData.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Login to Admin Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleCheckout} className="px-5 sm:px-7 py-5 sm:py-6 space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-pop-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Plan Selector Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Selected Plan</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlan('MONTHLY')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    plan === 'MONTHLY'
                      ? 'border-green-600 bg-green-50/50 ring-2 ring-green-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Monthly Plan</p>
                  <p className="text-lg font-black text-gray-900 mt-0.5">₹300 <span className="text-[10px] font-normal text-gray-500">/ seat / mo</span></p>
                  <p className="text-[10px] text-gray-500 mt-1">Flexible monthly billing</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan('ANNUAL')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    plan === 'ANNUAL'
                      ? 'border-green-600 bg-green-50/50 ring-2 ring-green-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="absolute -top-2.5 right-2.5 bg-green-700 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Save 33%
                  </span>
                  <p className="text-xs font-bold text-gray-900">Annual Plan</p>
                  <p className="text-lg font-black text-gray-900 mt-0.5">₹200 <span className="text-[10px] font-normal text-gray-500">/ seat / mo</span></p>
                  <p className="text-[10px] text-green-700 font-semibold mt-1">Billed annually (Best Value)</p>
                </button>
              </div>
            </div>

            {/* Seat Counter Selector */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-gray-900">Employee Licenses / Seats</label>
                  <p className="text-[11px] text-gray-500">How many workstations to monitor</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSeatChange(-1)}
                    disabled={seats <= 1 || isProcessing}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={seats}
                    onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center font-bold text-gray-900 text-sm py-1 bg-white border border-gray-200 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSeatChange(1)}
                    disabled={isProcessing}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="mt-3.5 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {seats} Seats × ₹{pricePerSeatPerMonth}{plan === 'ANNUAL' ? ' × 12 mos' : ' / month'}:
                </span>
                <span className="text-base font-black text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              {plan === 'ANNUAL' && (
                <p className="text-[11px] text-green-700 font-semibold mt-1 text-right flex items-center justify-end gap-1">
                  <Sparkles className="w-3 h-3" />
                  You save ₹{annualSavings.toLocaleString('en-IN')} every year with Annual!
                </p>
              )}
            </div>

            {/* Company & Admin Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Company / Organization *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    required
                    disabled={isProcessing}
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Acme Tech Pvt Ltd"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Admin Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    required
                    disabled={isProcessing}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Rahul Mehta"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Work Email (for login) *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    required
                    disabled={isProcessing}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="rahul@acmetech.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="tel"
                    disabled={isProcessing}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold cursor-pointer shadow-green-glow disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Checkout...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay ₹{totalAmount.toLocaleString('en-IN')} with Razorpay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>•</span>
              <span>UPI / Cards / NetBanking</span>
              <span>•</span>
              <span>Instant Activation</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
