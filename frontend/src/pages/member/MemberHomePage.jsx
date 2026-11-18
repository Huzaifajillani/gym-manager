import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/client';
import {
  Flame,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Camera,
  CameraOff,
  ChevronRight,
  Sparkles,
  KeyRound
} from 'lucide-react';

export default function MemberHomePage() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live QR Scanner & Check-in state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);
  const [checkInError, setCheckInError] = useState(null);

  const loadMemberData = () => {
    if (!user?.memberId) return;
    setLoading(true);

    Promise.all([
      api.get(`/api/members/${user.memberId}`),
      api.get(`/api/attendance/member/${user.memberId}`),
    ])
      .then(([resProfile, resAttendance]) => {
        setProfile(resProfile.data);
        setAttendanceList(resAttendance.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMemberData();
  }, [user?.memberId]);

  // Submit scanned or pasted daily QR token to backend
  const submitDailyQrScan = async (scannedToken) => {
    if (!scannedToken?.trim()) return;
    setSubmitting(true);
    setCheckInResult(null);
    setCheckInError(null);

    try {
      const res = await api.post('/api/attendance/scan', {
        qrToken: scannedToken.trim(),
        memberId: user.memberId,
      });
      setCheckInResult(res.data);
      setManualToken('');
      refreshProfile();
      loadMemberData();
    } catch (err) {
      setCheckInError(
        err.response?.data?.error || 'Invalid or expired QR code. Please scan today\'s QR at the front desk.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Initialize Camera Scanner when cameraOpen is true
  useEffect(() => {
    if (!cameraOpen) return;

    const scanner = new Html5QrcodeScanner(
      'member-daily-qr-reader',
      {
        fps: 10,
        qrbox: { width: 230, height: 230 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear().catch(() => {});
        setCameraOpen(false);
        submitDailyQrScan(decodedText);
      },
      () => {
        // Ignore continuous frame scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [cameraOpen]);

  const membership = profile?.membership;
  const isExpired = profile?.status === 'Expired';
  const isPaused = profile?.status === 'Paused';

  // QR_SCAN and DAILY_QR are both QR check-ins; only ASSISTED is a front-desk check-in
  const getSourceLabel = (log) =>
    log.source === 'ASSISTED'
      ? `Assisted: ${log.assistedReason || 'Front Desk'}`
      : 'Daily QR Scan';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
              {profile?.memberCode || user?.memberCode}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                isExpired
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : isPaused
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {profile?.status || 'Active'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Welcome Back, <span className="text-yellow-400">{profile?.name || user?.name}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Your personal fitness gateway, workout streak, and daily QR attendance scanner
          </p>
        </div>

        {isExpired && (
          <Link
            to="/member/renew"
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-red-500/20"
          >
            <RefreshCw size={15} />
            <span>Renew Membership Now</span>
          </Link>
        )}
      </div>

      {/* Main Grid: Membership Card & Streak Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Membership VIP Card */}
        <div className="lg:col-span-2 relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#131c2e] via-[#101522] to-[#0b0e14] border border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-yellow-400 block mb-1">
                  Digital Gate Pass & Tier
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {membership?.planName || 'Standard Gym Plan'}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Access Status</span>
                <span
                  className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                    isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isExpired ? 'Expired' : 'Gate Authorized'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-black/40 border border-slate-800/80 mb-6 backdrop-blur-sm">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Start Date</span>
                <span className="font-mono text-xs font-bold text-white">{membership?.startDate || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Valid Until</span>
                <span className={`font-mono text-xs font-bold ${isExpired ? 'text-red-400' : 'text-yellow-400'}`}>
                  {membership?.expiryDate || '—'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 block mb-0.5">Days Remaining</span>
                <span className="font-bold text-sm text-emerald-400">{profile?.daysRemaining ?? 0} Days</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">ID: {profile?.memberCode}</span>
            <Link
              to="/member/renew"
              className="text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 transition"
            >
              <span>Renew or Upgrade Plan</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Streak & Fair Rest-Day Tracker */}
        <div className="p-6 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workout Streak</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame size={20} className="fill-amber-400" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-white">{profile?.streakCount ?? 0}</span>
              <span className="text-sm font-bold text-amber-400 uppercase">Day Streak</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Goal: <strong>{profile?.weeklyGoal || 4} days / week</strong>. Scan the front-desk QR daily!
            </p>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] space-y-1 text-slate-300">
              <div className="font-bold text-yellow-400 flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Fair Streak Protected</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                1 rest day in between workouts does not reset your streak, and paused memberships freeze your record safely!
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Last Visited: <span className="text-slate-300 font-mono">{profile?.lastVisitDate || 'Never'}</span>
          </div>
        </div>
      </div>

      {/* Daily QR Code Scanner & Attendance Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live QR Scanner Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl relative overflow-hidden space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <QrCode size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Scan Daily Attendance QR</h2>
                <p className="text-xs text-slate-400">Scan today's QR code displayed at the gym reception</p>
              </div>
            </div>
          </div>

          {/* Success / Error Banners */}
          {checkInResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-400 text-xs">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold">{checkInResult.message}</strong>
                <span>Attendance recorded for {checkInResult.date}. Your streak is updated!</span>
              </div>
            </div>
          )}

          {checkInError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold">Check-In Blocked</strong>
                <span>{checkInError}</span>
              </div>
            </div>
          )}

          {/* Camera Toggle Button */}
          <button
            onClick={() => {
              setCheckInError(null);
              setCameraOpen(!cameraOpen);
            }}
            disabled={submitting || isExpired || isPaused}
            className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2 ${
              isExpired || isPaused
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : cameraOpen
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black hover:from-yellow-400 hover:to-amber-300 shadow-yellow-500/20'
            }`}
          >
            {isExpired ? (
              <span>Access Denied: Membership Expired</span>
            ) : isPaused ? (
              <span>Access Denied: Membership Paused</span>
            ) : cameraOpen ? (
              <>
                <CameraOff size={18} />
                <span>Close Camera Scanner</span>
              </>
            ) : (
              <>
                <Camera size={18} />
                <span>Open Camera to Scan Today's QR</span>
              </>
            )}
          </button>

          {/* Live Camera Viewfinder */}
          {cameraOpen && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-yellow-500/40">
              <div id="member-daily-qr-reader" className="w-full overflow-hidden rounded-xl" />
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Point your camera at the Admin's Daily QR Code
              </p>
            </div>
          )}

          {/* Manual Token Entry Fallback (for desktop/laptop testing without camera) */}
          {!isExpired && !isPaused && (
            <div className="pt-4 border-t border-slate-800/80">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <KeyRound size={13} className="text-yellow-400" />
                <span>Or Enter Today's QR Code Token Manually</span>
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitDailyQrScan(manualToken);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste daily token (e.g. GYM_2026-11-17_...)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                />
                <button
                  type="submit"
                  disabled={submitting || !manualToken.trim()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-yellow-400 border border-slate-700 font-extrabold text-xs uppercase transition"
                >
                  {submitting ? 'Checking...' : 'Check In'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Live Attendance History Feed */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Your Attendance Log</h2>
              <p className="text-xs text-slate-400">Verified daily QR scans and assisted check-ins</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">{attendanceList.length} Total Visits</span>
          </div>

          {attendanceList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No check-ins logged yet. Scan today's QR code to record your first visit!
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {attendanceList.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center justify-center font-bold">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Gym Floor Workout</span>
                      <span className="text-[11px] text-slate-400">{getSourceLabel(log)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-slate-200 font-semibold">
                      {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-slate-500">{log.checkInDate}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}