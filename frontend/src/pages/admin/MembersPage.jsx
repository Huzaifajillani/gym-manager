import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Users,
  Search,
  Filter,
  Pause,
  Play,
  QrCode,
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'plans'
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editMemberModal, setEditMemberModal] = useState(null);
  const [pauseModal, setPauseModal] = useState(null);
  const [assistedCheckInModal, setAssistedCheckInModal] = useState(null);
  const [planModal, setPlanModal] = useState(null); // for create or edit plan

  // Notification Toast
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get(`/api/members?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`),
      api.get('/api/plans'),
    ])
      .then(([resMembers, resPlans]) => {
        setMembers(resMembers.data);
        setPlans(resPlans.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery]);

  // Handle Edit Member
  const handleSaveMember = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/members/${editMemberModal.id}`, {
        name: editMemberModal.name,
        phone: editMemberModal.phone,
        email: editMemberModal.email,
        weeklyGoal: Number(editMemberModal.weeklyGoal),
      });
      showToast('Member profile updated successfully.');
      setEditMemberModal(null);
      loadData();
    } catch (err) {
      alert('Error updating member: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Pause Membership
  const handlePauseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/members/${pauseModal.id}/pause`, {
        reason: pauseModal.reason,
        startDate: pauseModal.startDate,
        endDate: pauseModal.endDate,
      });
      showToast(`Membership for ${pauseModal.name} paused until ${pauseModal.endDate}`);
      setPauseModal(null);
      loadData();
    } catch (err) {
      alert('Error pausing membership: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Resume Membership
  const handleResume = async (memberId, memberName) => {
    if (!window.confirm(`Resume active membership for ${memberName}?`)) return;
    try {
      await api.post(`/api/members/${memberId}/resume`);
      showToast(`Membership for ${memberName} resumed successfully.`);
      loadData();
    } catch (err) {
      alert('Error resuming membership: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Assisted Check-In
  const handleAssistedCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!assistedCheckInModal.reason?.trim()) {
      alert('Mandatory staff reason is required.');
      return;
    }
    try {
      await api.post(`/api/attendance/assisted-check-in/${assistedCheckInModal.id}`, {
        reason: assistedCheckInModal.reason,
      });
      showToast(`Assisted check-in verified for ${assistedCheckInModal.name}`);
      setAssistedCheckInModal(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Check-in blocked or failed.');
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to permanently delete member ${memberName}?`)) return;
    try {
      await api.delete(`/api/members/${memberId}`);
      showToast(`Member ${memberName} deleted.`);
      loadData();
    } catch (err) {
      alert('Error deleting member: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Save Plan
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: planModal.name,
        durationMonths: Number(planModal.durationMonths),
        price: Number(planModal.price),
        discount: Number(planModal.discount || 0),
        benefits: typeof planModal.benefits === 'string'
          ? planModal.benefits.split(',').map((s) => s.trim()).filter(Boolean)
          : planModal.benefits,
        active: planModal.active !== false,
      };

      if (planModal.id) {
        await api.put(`/api/plans/${planModal.id}`, payload);
        showToast('Plan updated successfully.');
      } else {
        await api.post('/api/plans', payload);
        showToast('New membership plan created.');
      }
      setPlanModal(null);
      loadData();
    } catch (err) {
      alert('Error saving plan: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-extrabold text-sm shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <span>Members &</span>
            <span className="text-yellow-400">Plans</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory, membership status management, pause/freeze controls, and plan configuration
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#111622] border border-slate-800">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'members'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Members Directory ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'plans'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Plans Config ({plans.length})
          </button>
        </div>
      </div>

      {activeTab === 'members' ? (
        <>
          {/* Filter Bar & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {['All', 'Active', 'Expired', 'Paused', 'Pending Payment'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === status
                      ? 'bg-yellow-500 text-black'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, GYM-001..."
                className="w-full bg-[#111622] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-[#111622] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-5">Code / Member</th>
                    <th className="py-4 px-4">Contact</th>
                    <th className="py-4 px-4">Plan & Expiry</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Streak / Visits</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        Loading member directory...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No members matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => {
                      const isPaused = 'Paused'.equalsIgnoreCase(m.status);
                      const isExpired = 'Expired'.equalsIgnoreCase(m.status);
                      const isPending = 'Pending'.equalsIgnoreCase(m.paymentStatus);

                      return (
                        <tr key={m.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-yellow-400 border border-slate-700">
                                {m.memberCode}
                              </span>
                              <div>
                                <span className="font-bold text-white text-sm block">{m.name}</span>
                                {m.pauseReason && (
                                  <span className="text-[10px] text-purple-400 block font-medium">
                                    Paused: {m.pauseReason} ({m.pauseEndDate})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-mono text-slate-300">{m.phone}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{m.email}</div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-200 block">{m.planName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Exp: <span className={isExpired ? 'text-red-400 font-bold' : 'text-slate-300'}>{m.expiryDate}</span>
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-block w-fit px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                                  m.status === 'Active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : m.status === 'Paused'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {m.status}
                              </span>
                              {isPending && (
                                <span className="inline-block w-fit px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  Pay Pending
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="text-white font-bold">{m.streakCount || 0} day streak</div>
                            <div className="text-[10px] text-slate-500">
                              Last visit: {m.lastVisitDate || 'Never'}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Assisted Check-in */}
                              <button
                                onClick={() => setAssistedCheckInModal({ id: m.id, name: m.name, reason: '' })}
                                title="Assisted Front-Desk Check-in"
                                className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition"
                              >
                                <QrCode size={15} />
                              </button>

                              {/* Pause / Resume */}
                              {isPaused ? (
                                <button
                                  onClick={() => handleResume(m.id, m.name)}
                                  title="Resume Membership"
                                  className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                                >
                                  <Play size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setPauseModal({
                                    id: m.id,
                                    name: m.name,
                                    reason: 'Medical: Temporary doctor recommended rest',
                                    startDate: new Date().toISOString().split('T')[0],
                                    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                                  })}
                                  title="Pause / Freeze Membership"
                                  className="p-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition"
                                >
                                  <Pause size={15} />
                                </button>
                              )}

                              {/* Edit */}
                              <button
                                onClick={() => setEditMemberModal(m)}
                                title="Edit Member Details"
                                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                              >
                                <Edit2 size={15} />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteMember(m.id, m.name)}
                                title="Delete Member"
                                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                              >
                                <Trash2 size={15} />
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
        </>
      ) : (
        /* Plans Configuration Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Active Membership Plans</h2>
              <p className="text-xs text-slate-400">Configure duration tiers, base pricing, discounts, and tier privileges</p>
            </div>
            <button
              onClick={() => setPlanModal({
                name: '',
                durationMonths: 1,
                price: 49.0,
                discount: 0,
                benefits: 'Full Gym Access, Free Locker',
                active: true,
              })}
              className="px-4 py-2.5 rounded-xl bg-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider hover:bg-yellow-400 flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition"
            >
              <Plus size={16} />
              <span>Create New Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-3xl bg-[#111622] border border-slate-800 flex flex-col justify-between relative shadow-xl hover:border-slate-700 transition group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-white text-lg">{p.name}</span>
                    <button
                      onClick={() => setPlanModal({
                        ...p,
                        benefits: Array.isArray(p.benefits) ? p.benefits.join(', ') : p.benefits,
                      })}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-black text-yellow-400">${p.effectivePrice.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {p.durationMonths} mo</span>
                    {p.discount > 0 && (
                      <span className="block text-xs text-emerald-400 font-semibold mt-0.5">
                        ${p.discount} Discount Applied
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300">
                    {p.benefits?.map((b, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-yellow-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500">
                  <span>Duration: {p.durationMonths} Months</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">
              Edit Member Details
            </h3>
            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editMemberModal.name}
                  onChange={(e) => setEditMemberModal({ ...editMemberModal, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editMemberModal.phone}
                  onChange={(e) => setEditMemberModal({ ...editMemberModal, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editMemberModal.email}
                  onChange={(e) => setEditMemberModal({ ...editMemberModal, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Weekly Workout Goal (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={editMemberModal.weeklyGoal || 4}
                  onChange={(e) => setEditMemberModal({ ...editMemberModal, weeklyGoal: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditMemberModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-yellow-500 text-black font-extrabold text-xs uppercase hover:bg-yellow-400 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pause/Freeze Modal */}
      {pauseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
              <Pause size={18} className="text-purple-400" />
              <span>Freeze / Pause Membership</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Freezes gate access and preserves fair workout streaks for travel or medical reasons.
            </p>

            <form onSubmit={handlePauseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason (Medical / Travel)</label>
                <select
                  value={pauseModal.reason}
                  onChange={(e) => setPauseModal({ ...pauseModal, reason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="Medical: Temporary recovery">Medical: Temporary illness or injury</option>
                  <option value="Travel: Out of station vacation">Travel: Work or family trip</option>
                  <option value="Personal: Temporary pause">Personal: Academic or life break</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pause Start</label>
                  <input
                    type="date"
                    required
                    value={pauseModal.startDate}
                    onChange={(e) => setPauseModal({ ...pauseModal, startDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pause End</label>
                  <input
                    type="date"
                    required
                    value={pauseModal.endDate}
                    onChange={(e) => setPauseModal({ ...pauseModal, endDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setPauseModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-purple-500 text-white font-extrabold uppercase hover:bg-purple-400 transition"
                >
                  Confirm Pause
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assisted Check-in Modal */}
      {assistedCheckInModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
              <QrCode size={18} className="text-cyan-400" />
              <span>Assisted Staff Check-In</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Front-desk manual check-in for <strong className="text-white">{assistedCheckInModal.name}</strong>.
              A mandatory staff reason is required for security audits.
            </p>

            <form onSubmit={handleAssistedCheckInSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Mandatory Verification Reason *
                </label>
                <select
                  value={assistedCheckInModal.reason}
                  onChange={(e) => setAssistedCheckInModal({ ...assistedCheckInModal, reason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Select Audit Reason --</option>
                  <option value="Forgot mobile phone / low battery">Forgot mobile phone / low battery</option>
                  <option value="Camera scanner malfunction at gate turnstile">Camera scanner malfunction at turnstile</option>
                  <option value="Front-desk verified physical NFC card pass">Front-desk verified physical card pass</option>
                  <option value="First-time orientation tour check-in">First-time orientation tour check-in</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setAssistedCheckInModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold uppercase hover:bg-cyan-400 transition"
                >
                  Open Gate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-yellow-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">
              {planModal.id ? 'Edit Membership Plan' : 'Create New Membership Plan'}
            </h3>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planModal.name}
                  onChange={(e) => setPlanModal({ ...planModal, name: e.target.value })}
                  placeholder="e.g. 6-Month Prime Fitness"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Months</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={planModal.durationMonths}
                    onChange={(e) => setPlanModal({ ...planModal, durationMonths: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planModal.price}
                    onChange={(e) => setPlanModal({ ...planModal, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={planModal.discount || 0}
                    onChange={(e) => setPlanModal({ ...planModal, discount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Benefits (Comma separated)</label>
                <textarea
                  rows={3}
                  value={planModal.benefits}
                  onChange={(e) => setPlanModal({ ...planModal, benefits: e.target.value })}
                  placeholder="Full Gym Access, Free Locker, 2 Guest Passes"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setPlanModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-yellow-500 text-black font-extrabold uppercase hover:bg-yellow-400 transition"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
