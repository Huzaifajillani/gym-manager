import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import DailyQrGenerator from '../../components/DailyQrGenerator';
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  QrCode,
  AlertTriangle,
  Play,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggeringReport, setTriggeringReport] = useState(false);
  const [reportModalData, setReportModalData] = useState(null);
  const [whatsappToast, setWhatsappToast] = useState('');

  const fetchDashboardData = () => {
    setLoading(true);
    api.get('/api/reports/dashboard-summary')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTriggerSummaryReport = async () => {
    setTriggeringReport(true);
    try {
      const res = await api.post('/api/reports/daily-summary/trigger');
      setReportModalData(res.data);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to trigger daily report: ' + (err.response?.data?.error || err.message));
    } finally {
      setTriggeringReport(false);
    }
  };

  const handleSendReminder = async (phone, memberName) => {
    setWhatsappToast(`Simulated WhatsApp alert dispatched to ${memberName} (${phone})!`);
    setTimeout(() => setWhatsappToast(''), 4000);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const expiringSoon = data?.expiringSoon || [];
  const recentCheckIns = data?.recentCheckIns || [];

  return (
    <div className="space-y-8">
      {/* Toast banner */}
      {whatsappToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-extrabold text-sm shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={20} />
          <span>{whatsappToast}</span>
        </div>
      )}

      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <span>Admin</span>
            <span className="text-yellow-400">Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time gym occupancy, retention signals, and daily automated cron monitor
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerSummaryReport}
            disabled={triggeringReport}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider hover:from-yellow-400 hover:to-amber-300 shadow-lg shadow-yellow-500/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            {triggeringReport ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Play size={15} className="fill-black" />
            )}
            <span>Trigger Daily Summary Report</span>
          </button>
        </div>
      </div>

      {/* 6 Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-[#111622] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Members</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{kpi.totalMembers ?? '—'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Enrolled in database</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111622] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Members</span>
            <UserCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{kpi.activeMembers ?? '—'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Valid gate access</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111622] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expired</span>
            <UserX size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{kpi.expiredMembers ?? '—'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Needs renewal</div>
        </div>

        <Link
          to="/admin/payments"
          className="p-4 rounded-2xl bg-[#111622] border border-amber-500/30 hover:border-amber-400/60 relative overflow-hidden transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pending Pay</span>
            <CreditCard size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 flex items-center justify-between">
            <span>{kpi.pendingPayments ?? '—'}</span>
            <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Click to mark paid</div>
        </Link>

        <div className="p-4 rounded-2xl bg-[#111622] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Visits</span>
            <QrCode size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{kpi.todayCheckIns ?? '—'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Scanned at gate</div>
        </div>

        <Link
          to="/admin/red-list"
          className="p-4 rounded-2xl bg-[#111622] border border-red-500/40 hover:border-red-400 relative overflow-hidden transition group bg-gradient-to-b from-red-500/5 to-transparent"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">10+ Days Absent</span>
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 flex items-center justify-between">
            <span>{kpi.redListCount ?? '—'}</span>
            <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Retention Red-List</div>
        </Link>
      </div>

      {/* Daily QR Code Generator Section */}
      <DailyQrGenerator />

      {/* Actionable Lists Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actionable List 1: Expiring Memberships */}
        <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Clock size={18} className="text-yellow-400" />
                <span>Expiring Memberships (Next 7 Days)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">High-priority renewals requiring reminder or front-desk collection</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
              {expiringSoon.length} Members
            </span>
          </div>

          {expiringSoon.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No memberships expiring in the next 7 days.
            </div>
          ) : (
            <div className="space-y-3">
              {expiringSoon.map((item) => (
                <div
                  key={item.memberId}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.memberName}</span>
                      <span className="text-[11px] font-mono text-slate-400">({item.memberCode})</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>Plan: <strong className="text-slate-300">{item.planName}</strong></span>
                      <span>Expires: <strong className="text-amber-400">{item.expiryDate}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      item.daysRemaining === 0
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {item.daysRemaining === 0 ? 'Expires Today!' : `${item.daysRemaining} days left`}
                    </span>

                    <button
                      onClick={() => handleSendReminder(item.phone, item.memberName)}
                      title="Send WhatsApp Reminder"
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actionable List 2: Recent Check-in Feed */}
        <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <QrCode size={18} className="text-cyan-400" />
                <span>Live Gate Attendance Feed</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time gate scans & assisted front-desk check-ins</p>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Live Gate</span>
            </span>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No check-ins recorded yet today.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {recentCheckIns.slice(0, 8).map((chk) => (
                <div
                  key={chk.id}
                  className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      chk.source === 'QR_SCAN'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {chk.source === 'QR_SCAN' ? 'QR' : 'AST'}
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm block">{chk.memberName}</span>
                      <span className="text-[11px] text-slate-400">
                        {chk.source === 'QR_SCAN' ? 'Gate QR Turnstile' : `Staff Assisted: ${chk.assistedReason || 'Manual'}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-slate-300 font-semibold block">
                      {new Date(chk.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-500">{chk.checkInDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Daily Summary Report Triggered Result */}
      {reportModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-yellow-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-yellow-400 font-black text-lg uppercase tracking-tight">
                <Sparkles size={20} />
                <span>Daily Owner Summary Compiled</span>
              </div>
              <button
                onClick={() => setReportModalData(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {reportModalData.statusMessage}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Total Members</span>
                <span className="text-lg font-bold text-white">{reportModalData.totalMembers}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Active Members</span>
                <span className="text-lg font-bold text-emerald-400">{reportModalData.activeMembers}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Expired Members</span>
                <span className="text-lg font-bold text-red-400">{reportModalData.expiredMembers}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Pending Payments</span>
                <span className="text-lg font-bold text-amber-400">{reportModalData.pendingPayments}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Today's Check-ins</span>
                <span className="text-lg font-bold text-cyan-400">{reportModalData.todayCheckIns}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">10+ Days Red-List</span>
                <span className="text-lg font-bold text-rose-400">{reportModalData.redListCount}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 mb-5">
              <div>CRON SCHEDULE: Every evening @ 9:00 PM (@Scheduled)</div>
              <div>STATUS: Dispatched to Owner Log & WhatsApp Cloud API</div>
            </div>

            <button
              onClick={() => setReportModalData(null)}
              className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs uppercase tracking-wider transition"
            >
              Close & Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}