import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  ShoppingBag,
  Dumbbell,
  Apple,
  Package,
  Award,
  CheckCircle2,
  AlertCircle,
  Bell,
  Shield,
  ShieldCheck,
  Check,
  Minus,
  Sparkles
} from 'lucide-react';

export default function AddonsPage() {
  const { user, refreshProfile } = useAuth();
  const [addons, setAddons] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Buy Addon Modal
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  // Consent State
  const [consentGiven, setConsentGiven] = useState(true);
  const [updatingConsent, setUpdatingConsent] = useState(false);

  // Toast
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadData = () => {
    if (!user?.memberId) return;
    setLoading(true);

    Promise.all([
      api.get('/api/addons'),
      api.get(`/api/addons/orders/member/${user.memberId}`),
      api.get(`/api/members/${user.memberId}`),
    ])
      .then(([resAddons, resOrders, resProfile]) => {
        setAddons(resAddons.data);
        setOrders(resOrders.data);
        setConsentGiven(resProfile.data.consentGiven);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user?.memberId]);

  const handlePurchase = async () => {
    if (!selectedAddon) return;
    setPurchasing(true);
    try {
      const res = await api.post(`/api/addons/${selectedAddon.id}/purchase`, {
        memberId: user.memberId,
      });
      showToast(res.data.message);
      setSelectedAddon(null);
      loadData();
    } catch (err) {
      alert('Error purchasing add-on: ' + (err.response?.data?.error || err.message));
    } finally {
      setPurchasing(false);
    }
  };

  const handleConsumeSession = async (orderId) => {
    try {
      const res = await api.post(`/api/addons/orders/${orderId}/consume`);
      showToast(`1 Session redeemed. ${res.data.sessionsRemaining} sessions remaining.`);
      loadData();
    } catch (err) {
      alert('Error updating session: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleConsent = async () => {
    const nextVal = !consentGiven;
    setUpdatingConsent(true);
    try {
      await api.put(`/api/members/${user.memberId}/consent`, {
        consentGiven: nextVal,
      });
      setConsentGiven(nextVal);
      showToast(`Notification consent ${nextVal ? 'Granted' : 'Revoked'} successfully.`);
      refreshProfile();
    } catch (err) {
      alert('Error updating consent: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingConsent(false);
    }
  };

  const filteredAddons = addons.filter((a) => {
    if (categoryFilter === 'ALL') return true;
    return a.category === categoryFilter;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-extrabold text-sm shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
          <span>Add-ons Store &</span>
          <span className="text-yellow-400">Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore optional personal coaching, custom nutrition plans, supplements, and privacy controls
        </p>
      </div>

      {/* Privacy & Notification Consent Settings Card */}
      <div className="p-6 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">
            <Bell size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">WhatsApp & Notification Preferences</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                consentGiven ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {consentGiven ? 'Opted In' : 'Opted Out'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Receive automated WhatsApp templates for upcoming membership expiration warnings, fair streak milestone awards, and trainer session bookings.
            </p>
          </div>
        </div>

        {/* Custom Toggle Switch */}
        <button
          onClick={handleToggleConsent}
          disabled={updatingConsent}
          className={`w-14 h-8 flex items-center rounded-full p-1 transition duration-300 focus:outline-none shrink-0 ${
            consentGiven ? 'bg-emerald-500' : 'bg-slate-800 border border-slate-700'
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition duration-300 flex items-center justify-center text-[10px] font-bold ${
              consentGiven ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-slate-600'
            }`}
          >
            {consentGiven ? <Check size={12} /> : <Minus size={12} />}
          </div>
        </button>
      </div>

      {/* Active Packages & Session Tracker */}
      {orders.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl">
          <h2 className="text-lg font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-400" />
            <span>My Active Packages & Sessions</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Track remaining personal coaching and consultation sessions</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="font-bold text-white text-sm block">{ord.addonTitle}</span>
                  <span className="text-[11px] text-slate-400">
                    Category: <strong className="text-slate-300">{ord.category}</strong> • Status:{' '}
                    <span className="text-emerald-400 font-bold">{ord.status}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-yellow-400 block">
                      {ord.sessionsRemaining} / {ord.sessionsTotal} Left
                    </span>
                    <span className="text-[10px] text-slate-500">Sessions</span>
                  </div>

                  {ord.sessionsRemaining > 0 && (
                    <button
                      onClick={() => handleConsumeSession(ord.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition"
                    >
                      Redeem 1
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons Catalog Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Available Add-ons Catalog</h2>
            <p className="text-xs text-slate-400">Never pre-selected. Choose only what accelerates your goals.</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'PT', label: 'Personal Training' },
              { id: 'DIET', label: 'Diet Plans' },
              { id: 'SUPPLEMENT', label: 'Supplements' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  categoryFilter === cat.id
                    ? 'bg-yellow-500 text-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400">Loading catalog...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAddons.map((addon) => (
              <div
                key={addon.id}
                className="p-6 rounded-3xl bg-[#111622] border border-slate-800 flex flex-col justify-between shadow-xl hover:border-slate-700 transition group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      {addon.category}
                    </span>
                    <span className="text-2xl font-black text-white">${addon.price.toFixed(2)}</span>
                  </div>

                  <h3 className="text-lg font-black text-white mb-2">{addon.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{addon.description}</p>

                  <div className="space-y-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs mb-6">
                    <div className="flex justify-between text-slate-400">
                      <span>Trainer / Coach:</span>
                      <span className="font-semibold text-white">{addon.trainerName}</span>
                    </div>
                    {addon.trainerQualification && (
                      <div className="flex justify-between text-slate-400">
                        <span>Qualification:</span>
                        <span className="font-mono text-[11px] text-yellow-400">{addon.trainerQualification}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Validity / Term:</span>
                      <span>{addon.validityDays} Days</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAddon(addon)}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-yellow-500 hover:text-black text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={15} />
                  <span>Buy Add-on (${addon.price.toFixed(2)})</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buy Addon Confirmation Modal */}
      {selectedAddon && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-yellow-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
              Confirm Add-on Purchase
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Review selected package details before confirming simulated checkout.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="font-bold text-white">{selectedAddon.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trainer:</span>
                <span className="font-semibold text-white">{selectedAddon.trainerName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-slate-300 uppercase">Total:</span>
                <span className="font-black text-yellow-400">${selectedAddon.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAddon(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-1/2 py-2.5 rounded-xl bg-yellow-500 text-black font-extrabold text-xs uppercase hover:bg-yellow-400 transition disabled:opacity-50"
              >
                {purchasing ? 'Enrolling...' : 'Confirm & Buy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
