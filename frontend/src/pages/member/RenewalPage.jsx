import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Printer,
  Clock
} from 'lucide-react';

export default function RenewalPage() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Renewal Plan
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Simulated Payment Modal
  const [paymentGatewayModal, setPaymentGatewayModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Printable Receipt Modal
  const [receiptModal, setReceiptModal] = useState(null);

  useEffect(() => {
    if (!user?.memberId) return;

    Promise.all([
      api.get(`/api/members/${user.memberId}`),
      api.get('/api/plans/public'),
    ])
      .then(([resProfile, resPlans]) => {
        setProfile(resProfile.data);
        const renewalOptions = resPlans.data.filter((p) => [3, 6, 12].includes(p.durationMonths));
        setPlans(renewalOptions.length > 0 ? renewalOptions : resPlans.data);
        if (renewalOptions.length > 0) {
          setSelectedPlan(renewalOptions[1] || renewalOptions[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user?.memberId]);

  const handleSimulatePayment = async (status) => {
    if (!selectedPlan) return;
    setProcessing(true);
    setPaymentError('');

    const txnRef = 'TXN-SFPY-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const mockSignature = 'safepay_sig_' + Math.random().toString(36).substring(2);

    try {
      const res = await api.post('/api/webhooks/payment', {
        transactionRef: txnRef,
        memberId: user.memberId,
        planId: selectedPlan.id,
        amount: selectedPlan.effectivePrice,
        status: status, // 'SUCCESS' or 'FAILED'
        signature: mockSignature,
      });

      if (res.data.success) {
        setPaymentGatewayModal(false);
        setReceiptModal(res.data);
        refreshProfile();
      } else {
        setPaymentError(res.data.message || 'Payment was declined by Safepay.');
      }
    } catch (err) {
      setPaymentError(err.response?.data?.error || 'Webhook verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  const membership = profile?.membership;
  const isExpired = profile?.status === 'Expired';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
          <span>Membership</span>
          <span className="text-yellow-400">Renewal</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Lock in uninterrupted gate turnstile access and continuous workout streak progress via Safepay
        </p>
      </div>

      {/* Current Expiry Alert Card */}
      <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl ${
        isExpired
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#111622] border-slate-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${
            isExpired ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            <Clock size={24} />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold text-slate-400 block tracking-wider">
              Current Membership Status
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-black text-white">{membership?.planName || 'Standard Access'}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isExpired ? 'Expired' : 'Active'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Valid until: <strong className={isExpired ? 'text-red-400' : 'text-yellow-400'}>{membership?.expiryDate || 'N/A'}</strong>
              {!isExpired && profile?.daysRemaining !== undefined && (
                <span className="ml-2 font-mono text-emerald-400">({profile.daysRemaining} days remaining)</span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 sm:text-right">
          <div className="text-white font-bold">Extension Policy</div>
          <div>Active plans extend seamlessly from current expiry date.</div>
        </div>
      </div>

      {/* Renewal Tier Options */}
      <div>
        <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4">
          Select Extension Term
        </h2>

        {loading ? (
          <div className="text-xs text-slate-400">Loading renewal tiers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const isSelected = selectedPlan?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p)}
                  className={`p-6 rounded-3xl border cursor-pointer transition flex flex-col justify-between relative shadow-xl ${
                    isSelected
                      ? 'bg-[#151c2b] border-yellow-500 shadow-yellow-500/10 scale-[1.02]'
                      : 'bg-[#111622] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.discount > 0 && (
                    <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Save ${p.discount}
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      {p.durationMonths} Months Tier
                    </span>
                    <h3 className="text-xl font-black text-white mb-3">{p.name}</h3>

                    <div className="mb-4">
                      <span className="text-3xl font-black text-yellow-400">${p.effectivePrice.toFixed(2)}</span>
                      {p.discount > 0 && (
                        <span className="text-xs text-slate-500 line-through ml-2 font-semibold">
                          ${p.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300 mb-6">
                      {p.benefits?.map((b, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition ${
                      isSelected
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ Selected Term' : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Summary Bar */}
      {selectedPlan && (
        <div className="p-6 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Payable Amount
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">${selectedPlan.effectivePrice.toFixed(2)}</span>
              <span className="text-xs text-emerald-400 font-semibold">
                (Includes {selectedPlan.durationMonths} Months Access)
              </span>
            </div>
          </div>

          <button
            onClick={() => setPaymentGatewayModal(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-black text-sm uppercase tracking-wider hover:from-yellow-400 hover:to-amber-300 shadow-xl shadow-yellow-500/20 transition flex items-center justify-center gap-2"
          >
            <CreditCard size={18} />
            <span>Pay with Safepay</span>
          </button>
        </div>
      )}

      {/* Safepay Gateway Simulation Modal */}
      {paymentGatewayModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  SP
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Safepay Checkout</h3>
                  <span className="text-[10px] text-slate-400">Sandbox Test Mode Active</span>
                </div>
              </div>
              <button
                onClick={() => setPaymentGatewayModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {paymentError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Payee:</span>
                <span className="font-bold text-white">APEX GYM & FITNESS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Renewal Plan:</span>
                <span className="font-bold text-white">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-slate-300 uppercase">Amount Due:</span>
                <span className="font-black text-yellow-400">${selectedPlan.effectivePrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSimulatePayment('SUCCESS')}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? 'Processing Safepay...' : 'Simulate Successful Safepay Payment'}
              </button>

              <button
                onClick={() => handleSimulatePayment('FAILED')}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/20 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
              >
                Simulate Payment Failure / Decline
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center mt-4">
              Dispatches signature payload to webhook endpoint (/api/webhooks/payment) for Safepay verification.
            </p>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-yellow-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-slate-200">
            <div className="text-center pb-4 border-b border-slate-800">
              <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-widest block flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 size={16} />
                <span>Renewal Confirmed (Safepay)</span>
              </span>
              <h2 className="text-2xl font-black text-white">APEX GYM & FITNESS</h2>
              <p className="text-[11px] text-slate-400">Electronic Payment Tax Invoice</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-mono font-bold text-yellow-400">{receiptModal.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Plan Extended:</span>
                <span className="font-bold text-white">{receiptModal.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">New Expiry Date:</span>
                <span className="font-mono font-bold text-emerald-400">{receiptModal.expiryDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway:</span>
                <span className="font-mono text-[10px] text-emerald-400">Safepay Sandbox Verified</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 text-center mb-5">
              WhatsApp receipt message dispatched automatically to your registered phone number.
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setReceiptModal(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase hover:bg-slate-700 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 py-2.5 rounded-xl bg-yellow-500 text-black font-extrabold text-xs uppercase hover:bg-yellow-400 transition flex items-center justify-center gap-1.5"
              >
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}