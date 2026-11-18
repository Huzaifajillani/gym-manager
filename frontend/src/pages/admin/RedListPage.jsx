import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  AlertTriangle,
  Send,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  PhoneCall,
  UserCheck,
  RefreshCw,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

export default function RedListPage() {
  const [cases, setCases] = useState([]);
  const [rangeFilter, setRangeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Follow-up modal
  const [followUpModal, setFollowUpModal] = useState(null);

  // WhatsApp preview modal
  const [whatsappPreviewModal, setWhatsappPreviewModal] = useState(null);

  // Toast
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadRedList = () => {
    setLoading(true);
    api.get(`/api/red-list?range=${rangeFilter}`)
      .then((res) => setCases(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRedList();
  }, [rangeFilter]);

  const handleScanNow = async () => {
    setScanning(true);
    try {
      const res = await api.post('/api/red-list/scan-now');
      showToast(`Scanned and synced ${res.data.scannedCases} high-risk cases.`);
      loadRedList();
    } catch (err) {
      alert('Scan error: ' + (err.response?.data?.error || err.message));
    } finally {
      setScanning(false);
    }
  };

  const handleSendWhatsApp = async (c) => {
    try {
      const res = await api.post(`/api/red-list/${c.id}/send-reminder`);
      showToast(res.data.message);
      setWhatsappPreviewModal(null);
      loadRedList();
    } catch (err) {
      alert('Failed to send reminder: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/red-list/${followUpModal.id}/follow-up`, {
        outcome: followUpModal.outcome,
        nextActionDate: followUpModal.nextActionDate,
        notes: followUpModal.notes,
      });
      showToast(`Follow-up outcome "${followUpModal.outcome}" logged for ${followUpModal.memberName}`);
      setFollowUpModal(null);
      loadRedList();
    } catch (err) {
      alert('Error saving follow-up: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-extrabold text-sm shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <span>No-Show</span>
            <span className="text-red-500">Red-List</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated churn prevention engine tracking Active members absent 10+ days (excludes paused/frozen)
          </p>
        </div>

        <button
          onClick={handleScanNow}
          disabled={scanning}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50"
        >
          <RefreshCw size={15} className={scanning ? 'animate-spin text-yellow-400' : 'text-slate-400'} />
          <span>{scanning ? 'Scanning Database...' : 'Run Scanner Now'}</span>
        </button>
      </div>

      {/* Auto-Resolution Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-500/30 flex items-start gap-3">
        <Sparkles size={20} className="text-yellow-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-extrabold text-white block uppercase tracking-wider">
            Auto-Resolution Protocol Active
          </span>
          Members on this red list are constantly monitored. As soon as a member checks in at the gate or through staff assistance, their case is <strong className="text-emerald-400">automatically marked as 'Returned'</strong> and removed from the active intervention queue.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'All 10+ Days', val: 'All' },
          { label: '10–14 Days Absent', val: '10-14' },
          { label: '15–21 Days Absent', val: '15-21' },
          { label: '22+ Days Absent', val: '22+' },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setRangeFilter(tab.val)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              rangeFilter === tab.val
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cases Table */}
      <div className="bg-[#111622] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-5">Member & Plan</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Last Visit</th>
                <th className="py-4 px-4">Absent Days</th>
                <th className="py-4 px-4">Status & Outcome</th>
                <th className="py-4 px-5 text-right">Interventions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Scanning for no-show members...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2" />
                    <span>Great job! No members found in this absence tier.</span>
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const absent = c.absentDays;
                  const severityClass =
                    absent >= 22
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : absent >= 15
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40';

                  return (
                    <tr key={c.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-5">
                        <span className="font-bold text-white text-sm block">{c.memberName}</span>
                        <span className="text-[11px] text-slate-400">{c.planName}</span>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-300">
                        {c.phone}
                        {c.consentGiven ? (
                          <span className="text-[10px] text-emerald-400 block font-sans">Consent Granted</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 block font-sans">Opted Out</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <div className="font-semibold">{c.lastVisitDate}</div>
                        <div className="text-[10px] text-slate-500">Gate Turnstile</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black border ${severityClass}`}>
                          {absent} Days Absent
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            c.status === 'Contacted'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {c.status}
                          </span>
                          {c.outcome && (
                            <div className="text-[11px] text-amber-300 font-medium">
                              "{c.outcome}"
                            </div>
                          )}
                          {c.nextActionDate && (
                            <div className="text-[10px] text-slate-500">
                              Next: {c.nextActionDate}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setWhatsappPreviewModal(c)}
                            title="Preview & Send WhatsApp"
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 transition"
                          >
                            <Send size={13} />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => setFollowUpModal({
                              id: c.id,
                              memberName: c.memberName,
                              outcome: c.outcome || 'Will return',
                              nextActionDate: c.nextActionDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                              notes: c.notes || '',
                            })}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 transition"
                          >
                            <PhoneCall size={13} />
                            <span>Log Outcome</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Follow-up Outcome Modal */}
      {followUpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
              Log Follow-up Outcome
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Recording staff call / outreach with <strong className="text-white">{followUpModal.memberName}</strong>
            </p>

            <form onSubmit={handleFollowUpSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Outcome Category *
                </label>
                <select
                  value={followUpModal.outcome}
                  onChange={(e) => setFollowUpModal({ ...followUpModal, outcome: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="Will return">Will return (re-engaged, committed to visit)</option>
                  <option value="Injured">Injured (recommend medical pause)</option>
                  <option value="Travelling">Travelling (vacation / business trip)</option>
                  <option value="Timing issue">Timing issue (work schedule clash)</option>
                  <option value="Unhappy">Unhappy (equipment, crowd, or trainer concern)</option>
                  <option value="No response">No response (voicemail left)</option>
                  <option value="Cancelled">Cancelled (requested cancellation)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Next Action Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpModal.nextActionDate}
                  onChange={(e) => setFollowUpModal({ ...followUpModal, nextActionDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Staff Notes & Commitment
                </label>
                <textarea
                  rows={3}
                  value={followUpModal.notes}
                  onChange={(e) => setFollowUpModal({ ...followUpModal, notes: e.target.value })}
                  placeholder="e.g. Spoke to member. Recovering from mild sprain, promised to visit next Monday."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setFollowUpModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-yellow-500 text-black font-extrabold uppercase hover:bg-yellow-400 transition"
                >
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Template Preview Modal */}
      {whatsappPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
              <Send size={18} className="text-emerald-400" />
              <span>WhatsApp Cloud API Preview</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Dispatches template <strong className="text-emerald-400 font-mono">we_miss_you_reactivation</strong> to {whatsappPreviewModal.phone}
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 mb-5">
              <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                <span>TEMPLATE: we_miss_you_reactivation</span>
                <span>LANG: en_US</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#1b2533] p-3 rounded-xl border border-slate-700">
                Hey {whatsappPreviewModal.memberName}, we noticed you haven't visited in {whatsappPreviewModal.absentDays} days! Your fitness family misses you. Drop by this week for a free consultation!
              </p>
              <div className="text-[10px] text-slate-500">
                Mode: {whatsappPreviewModal.consentGiven ? '✓ Consent Verified' : '⚠ Warning: Member Consent Not Explicit'}
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setWhatsappPreviewModal(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp(whatsappPreviewModal)}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs uppercase hover:bg-emerald-400 transition"
              >
                Dispatch Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
