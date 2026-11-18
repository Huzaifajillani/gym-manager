import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Target,
  Dumbbell,
  Trophy
} from 'lucide-react';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const pad = (n) => String(n).padStart(2, '0');
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const sourceLabel = (log) => {
  if (log.source === 'ASSISTED') return `Assisted: ${log.assistedReason || 'Front Desk'}`;
  return 'Daily QR Scan';
};

const formatTime = (value) => {
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayKey);

  useEffect(() => {
    if (!user?.memberId) return;
    setLoading(true);
    setError('');

    Promise.all([
      api.get(`/api/members/${user.memberId}`),
      api.get(`/api/attendance/member/${user.memberId}`),
    ])
      .then(([resProfile, resAttendance]) => {
        setProfile(resProfile.data);
        setAttendanceList(Array.isArray(resAttendance.data) ? resAttendance.data : []);
      })
      .catch((err) => {
        console.error(err);
        setError('Attendance data load nahi ho saka. Please dobara try karein.');
      })
      .finally(() => setLoading(false));
  }, [user?.memberId]);

  // Map: 'YYYY-MM-DD' -> list of visits that day
  const visitsByDate = useMemo(() => {
    const map = {};
    attendanceList.forEach((log) => {
      if (!log.checkInDate) return;
      if (!map[log.checkInDate]) map[log.checkInDate] = [];
      map[log.checkInDate].push(log);
    });
    return map;
  }, [attendanceList]);

  // Calendar cells for the viewed month (week starts Monday)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  // Stats
  const monthPrefix = `${viewYear}-${pad(viewMonth + 1)}-`;
  const monthVisitDays = Object.keys(visitsByDate).filter((k) => k.startsWith(monthPrefix)).length;
  const monthVisitsTotal = attendanceList.filter(
    (log) => log.checkInDate && log.checkInDate.startsWith(monthPrefix)
  );

  const weekDaysAttended = useMemo(() => {
    const now = new Date();
    const dayIndex = (now.getDay() + 6) % 7;
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayIndex + i);
      const key = toKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (visitsByDate[key]) count++;
    }
    return count;
  }, [visitsByDate]);

  const weeklyGoal = profile?.weeklyGoal || 4;
  const goalPercent = Math.min(100, Math.round((weekDaysAttended / weeklyGoal) * 100));
  const totalDaysAttended = Object.keys(visitsByDate).length;

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedKey(null);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedKey(null);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedKey(todayKey);
  };

  const selectedVisits = selectedKey ? visitsByDate[selectedKey] || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <CalendarDays size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Attendance History</h1>
          <p className="text-xs text-slate-400">Apne gym visits, streak aur weekly goal ka poora record</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#111622] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Streak</span>
            <Flame size={16} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {profile?.streakCount ?? 0}
            <span className="text-xs font-bold text-amber-400 ml-1.5 uppercase">Days</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111622] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {MONTH_NAMES[viewMonth].slice(0, 3)} Visits
            </span>
            <Dumbbell size={16} className="text-yellow-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {monthVisitDays}
            <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">Days</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111622] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Days</span>
            <Trophy size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {totalDaysAttended}
            <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">All Time</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111622] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Weekly Goal</span>
            <Target size={16} className="text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {weekDaysAttended}
            <span className="text-xs font-bold text-slate-400 ml-1.5">/ {weeklyGoal} days</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                goalPercent >= 100 ? 'bg-emerald-400' : 'bg-yellow-400'
              }`}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToday}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-yellow-400 text-[11px] font-bold uppercase transition"
              >
                Today
              </button>
              <button
                onClick={goPrevMonth}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={goNextMonth}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;

              const key = toKey(viewYear, viewMonth, day);
              const visits = visitsByDate[key];
              const attended = !!visits;
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              const isFuture = key > todayKey;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={`relative aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center transition border ${
                    attended
                      ? 'bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400'
                      : isFuture
                      ? 'bg-slate-900/40 text-slate-600 border-slate-800/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                  } ${isToday ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-[#111622]' : ''} ${
                    isSelected && !attended ? 'border-yellow-500' : ''
                  } ${isSelected && attended ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111622]' : ''}`}
                >
                  <span>{day}</span>
                  {attended && visits.length > 1 && (
                    <span className="absolute bottom-0.5 text-[8px] font-black leading-none">
                      x{visits.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-500 inline-block"></span>
              <span>Gym Visit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-900 border border-slate-700 inline-block"></span>
              <span>No Visit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded ring-2 ring-sky-400 inline-block"></span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Selected day + month list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Selected Day</div>
            <div className="font-mono text-sm font-bold text-yellow-400 mb-4">
              {selectedKey || 'Calendar se koi din select karein'}
            </div>

            {selectedKey && selectedVisits.length === 0 && (
              <div className="text-xs text-slate-500 py-4 text-center">
                {selectedKey > todayKey ? 'Ye din abhi aane wala hai.' : 'Is din gym visit record nahi hui.'}
              </div>
            )}

            <div className="space-y-2.5">
              {selectedVisits.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="text-slate-300">{sourceLabel(log)}</span>
                  </div>
                  <span className="font-mono font-semibold text-white">{formatTime(log.checkInTime)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#111622] border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                {MONTH_NAMES[viewMonth]} Log
              </h3>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {monthVisitsTotal.length} Check-ins
              </span>
            </div>

            {monthVisitsTotal.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">Is mahine koi check-in nahi hui.</div>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {monthVisitsTotal.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-white block">{log.checkInDate}</span>
                      <span className="text-[11px] text-slate-400">{sourceLabel(log)}</span>
                    </div>
                    <span className="font-mono text-slate-200 font-semibold">{formatTime(log.checkInTime)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}