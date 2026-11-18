import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { UserPlus, Calendar, Phone, Mail, Award, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export default function RegisterMemberPage() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phone: '+1',
    email: '',
    planId: '',
    fee: 0,
    startDate: new Date().toISOString().split('T')[0],
    consentGiven: false,
    weeklyGoal: 4,
    password: 'member123',
  });

  const [calculatedExpiry, setCalculatedExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Month-end safe date calculation logic (matching Java LocalDate.plusMonths)
  const calculateMonthEndSafeExpiry = (startDateStr, durationMonths) => {
    if (!startDateStr || !durationMonths) return '';
    try {
      const [year, month, day] = startDateStr.split('-').map(Number);
      let targetYear = year;
      let targetMonth = month + durationMonths;

      while (targetMonth > 12) {
        targetYear += 1;
        targetMonth -= 12;
      }

      // Last day of target month
      const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
      const targetDay = Math.min(day, daysInTargetMonth);

      const mm = String(targetMonth).padStart(2, '0');
      const dd = String(targetDay).padStart(2, '0');
      return `${targetYear}-${mm}-${dd}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    api.get('/api/plans/public')
      .then((res) => {
        setPlans(res.data);
        if (res.data.length > 0) {
          const defaultPlan = res.data[0];
          setFormData((prev) => ({
            ...prev,
            planId: defaultPlan.id,
            fee: defaultPlan.effectivePrice,
          }));
          setCalculatedExpiry(calculateMonthEndSafeExpiry(prevStartDate(), defaultPlan.durationMonths));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingPlans(false));
  }, []);

  const prevStartDate = () => formData.startDate || new Date().toISOString().split('T')[0];

  const handlePlanChange = (planId) => {
    const selected = plans.find((p) => p.id === planId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        planId: selected.id,
        fee: selected.effectivePrice,
      }));
      setCalculatedExpiry(calculateMonthEndSafeExpiry(formData.startDate, selected.durationMonths));
    }
  };

  const handleStartDateChange = (date) => {
    setFormData((prev) => ({ ...prev, startDate: date }));
    const selected = plans.find((p) => p.id === formData.planId);
    if (selected) {
      setCalculatedExpiry(calculateMonthEndSafeExpiry(date, selected.durationMonths));
    }
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+')) {
      val = '+' + val.replace(/\D/g, '');
    }
    setFormData((prev) => ({ ...prev, phone: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.consentGiven) {
      setError('WhatsApp & Notification Consent is mandatory to complete membership enrollment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/members/register-public', formData);
      setSuccessResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlanObj = plans.find((p) => p.id === formData.planId);

  return (
    <div className="min-h-screen bg-[#07090e] py-10 px-4 sm:px-6 lg:px-8 text-slate-100 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Portal Login</span>
          </Link>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
            Front-Desk Walk-In Mode
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>

          {successResult ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase">Walk-In Member Enrolled!</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                Member profile created with status <span className="text-amber-400 font-bold">Payment Pending</span>.
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm mx-auto text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Name:</span>
                  <span className="font-bold text-white">{successResult.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member ID / Code:</span>
                  <span className="font-mono font-bold text-yellow-400">{successResult.memberCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Default Password:</span>
                  <span className="font-mono text-slate-300">member123</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-500/20 text-amber-400">Pending</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setSuccessResult(null);
                    setFormData({
                      name: '',
                      phone: '+1',
                      email: '',
                      planId: plans[0]?.id || '',
                      fee: plans[0]?.effectivePrice || 0,
                      startDate: new Date().toISOString().split('T')[0],
                      consentGiven: false,
                      weeklyGoal: 4,
                      password: 'member123',
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs uppercase tracking-wider text-white transition"
                >
                  Enroll Another Member
                </button>
                <Link
                  to="/admin/payments"
                  className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 font-bold text-xs uppercase tracking-wider text-black transition"
                >
                  Go to Payments Ledger to Mark Paid
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <UserPlus size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Front-Desk Walk-In Registration</h2>
                    <p className="text-xs text-slate-400">Enroll new walk-in member with immediate plan assignment</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle size={20} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Marcus Miller"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Phone Number (with Country Code) *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="+15551234567"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="marcus@example.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Select Membership Plan *
                  </label>
                  {loadingPlans ? (
                    <div className="text-xs text-slate-400">Loading plans...</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plans.map((p) => {
                        const isSelected = formData.planId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handlePlanChange(p.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition relative ${
                              isSelected
                                ? 'bg-yellow-500/10 border-yellow-500 shadow-md shadow-yellow-500/10'
                                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-white text-sm block">{p.name}</span>
                                <span className="text-xs text-slate-400">{p.durationMonths} Month{p.durationMonths > 1 ? 's' : ''} Validity</span>
                              </div>
                              <div className="text-right">
                                <span className="text-base font-black text-yellow-400">${p.effectivePrice.toFixed(2)}</span>
                                {p.discount > 0 && (
                                  <span className="block text-[10px] text-emerald-400 font-semibold line-through opacity-70">
                                    ${p.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Start Date & Live Expiry Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar size={14} className="text-yellow-400" />
                      <span>Start Date *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-400" />
                      <span>Calculated Expiry Date</span>
                    </label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-bold text-emerald-400 flex items-center justify-between">
                      <span>{calculatedExpiry || '—'}</span>
                      <span className="text-[10px] uppercase font-sans text-slate-400">Month-End Clamped</span>
                    </div>
                  </div>
                </div>

                {/* Mandatory WhatsApp / Notification Consent */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.consentGiven}
                      onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-slate-700 text-yellow-500 focus:ring-yellow-400 bg-slate-900"
                    />
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        WhatsApp & Notification Consent (Mandatory)
                      </span>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        I consent to receive automated WhatsApp reminders regarding my membership renewal, expiry alerts, workout streak notifications, and gym updates from APEX GYM Retention OS.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-black text-sm uppercase tracking-wider hover:from-yellow-400 hover:to-amber-300 focus:outline-none shadow-xl shadow-yellow-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Registering Walk-In...' : `Enroll Member (Pending Fee: $${formData.fee.toFixed(2)})`}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
