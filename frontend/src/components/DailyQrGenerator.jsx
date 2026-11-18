import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, RefreshCw, Download, Users, Clock, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react';

export default function DailyQrGenerator() {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checkins, setCheckins] = useState([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const svgRef = useRef(null);

  const fetchTodayQr = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/attendance/daily-qr/today');
      if (res.data.generated) {
        setQrData(res.data);
      } else {
        setQrData(null);
      }
    } catch (err) {
      setError("Failed to load today's QR code.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayCheckins = useCallback(async () => {
    try {
      setCheckinsLoading(true);
      const res = await api.get('/api/attendance/today');
      setCheckins(res.data || []);
    } catch (err) {
      // non-critical
    } finally {
      setCheckinsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayQr();
    fetchTodayCheckins();
    const interval = setInterval(fetchTodayCheckins, 30000);
    return () => clearInterval(interval);
  }, [fetchTodayQr, fetchTodayCheckins]);

  const generateQr = async () => {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/api/attendance/daily-qr/generate');
      setQrData(res.data);
      setSuccessMsg('New daily QR code generated successfully!');
      fetchTodayCheckins();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate QR code.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToken = () => {
    if (!qrData?.qrToken) return;
    navigator.clipboard.writeText(qrData.qrToken);
    setSuccessMsg('QR Token copied to clipboard!');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const downloadQr = () => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size + 80;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.drawImage(img, (size - 300) / 2, 20, 300, 300);
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GYM DAILY QR CODE', size / 2, 350);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#555';
      ctx.fillText(qrData?.date || '', size / 2, 372);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(qrData?.qrToken?.substring(0, 30) + '...', size / 2, 392);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `gym-qr-${qrData?.date || 'today'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  const printQr = () => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Daily QR Code - ${qrData?.date}</title>
      <style>
        body { font-family: Arial, sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; background:#fff; }
        h1 { font-size:24px; margin-bottom:4px; }
        p { color:#666; font-size:13px; margin:4px 0; }
        .token { font-family:monospace; font-size:11px; color:#888; word-break:break-all; max-width:320px; text-align:center; }
        svg { margin:20px 0; }
      </style></head>
      <body>
        <h1>GYM DAILY QR CODE</h1>
        <p>${qrData?.date}</p>
        ${svgStr}
        <p class="token">${qrData?.qrToken}</p>
        <p style="margin-top:16px;color:#333;font-size:12px;">Scan this QR code with the Gym Member App to check in today.</p>
        <script>window.print();<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 bg-[#0d121d] border border-slate-800 rounded-3xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <QrCode className="text-yellow-400" size={24} />
            <span>Daily QR Attendance</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Generate today's unique QR code for member check-in. One active code per calendar day.
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="text-yellow-400 font-mono font-bold">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Alert messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle size={18} /> <span className="text-xs font-semibold">{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle size={18} /> <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* QR Code Panel */}
        <div className="bg-[#111622] rounded-3xl border border-slate-800/80 p-6 flex flex-col items-center gap-5">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Today's QR Code</span>
            {qrData && (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● ACTIVE
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
              <Loader2 size={36} className="animate-spin text-yellow-400" />
              <span className="text-sm">Loading QR code...</span>
            </div>
          ) : qrData ? (
            <>
              <div ref={svgRef} className="p-5 bg-white rounded-2xl shadow-2xl shadow-yellow-500/5">
                <QRCodeSVG value={qrData.qrToken} size={220} level="H" includeMargin={true} />
              </div>

              <div className="w-full space-y-2 text-center">
                <div className="text-slate-300 font-semibold text-sm">{qrData.date}</div>
                <div className="flex items-center justify-center gap-2 font-mono text-xs text-slate-400 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 break-all">
                  <span>{qrData.qrToken}</span>
                  <button
                    onClick={copyToken}
                    title="Copy Token"
                    className="p-1 rounded hover:bg-slate-800 text-yellow-400 shrink-0"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {qrData.createdAt && (
                  <div className="text-[11px] text-slate-500">Generated at {formatTime(qrData.createdAt)}</div>
                )}
              </div>

              <div className="w-full flex gap-3">
                <button
                  onClick={downloadQr}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition-all border border-slate-700"
                >
                  <Download size={15} /> Download PNG
                </button>
                <button
                  onClick={printQr}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition-all border border-slate-700"
                >
                  Print QR
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-24 h-24 rounded-2xl bg-slate-800/60 border-2 border-dashed border-slate-700 flex items-center justify-center">
                <QrCode size={40} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm">No QR code generated yet for today.</p>
              <p className="text-slate-600 text-xs">Click the button below to generate.</p>
            </div>
          )}

          <button
            onClick={generateQr}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/20"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
            ) : qrData ? (
              <>
                <RefreshCw size={16} /> Regenerate QR Code
              </>
            ) : (
              <>
                <QrCode size={16} /> Generate Today's QR Code
              </>
            )}
          </button>

          {qrData && (
            <p className="text-[11px] text-slate-500 text-center">
              Regenerating will invalidate any previously generated code for today.
            </p>
          )}
        </div>

        {/* Today's Check-ins Panel */}
        <div className="bg-[#111622] rounded-3xl border border-slate-800/80 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Today's QR Check-ins</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                {checkins.length}
              </span>
              <button
                onClick={fetchTodayCheckins}
                disabled={checkinsLoading}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                title="Refresh"
              >
                <RefreshCw size={14} className={checkinsLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1">
            {checkinsLoading && checkins.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-600">
                <Loader2 size={24} className="animate-spin text-yellow-400/50" />
              </div>
            ) : checkins.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Clock size={32} className="text-slate-700" />
                <p className="text-slate-500 text-sm">No check-ins yet today.</p>
                <p className="text-slate-600 text-xs">Members who scan the QR code will appear here.</p>
              </div>
            ) : (
              checkins.map((c, i) => (
                <div
                  key={c.id || i}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 text-xs font-bold">
                      {(c.memberName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{c.memberName || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-500">{c.source?.replace('_', ' ') || 'QR Scan'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <Clock size={12} />
                    {formatTime(c.checkInTime)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}