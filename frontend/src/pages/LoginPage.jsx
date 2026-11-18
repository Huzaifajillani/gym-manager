import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Shield, User, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(identifier, password);
      if (data.role === 'ROLE_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/member/home');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (id, pass) => {
    setIdentifier(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Neon Accent Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 text-black shadow-xl shadow-yellow-500/20 mb-4 transform -rotate-6">
          <Dumbbell size={32} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white uppercase">
          Apex<span className="text-yellow-400">Gym</span> OS
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Gym Operations, Member Retention & Churn Prevention
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#111622] border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl relative">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address or Phone Number
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@gym.com or +1555010001"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-extrabold text-sm uppercase tracking-wider hover:from-yellow-400 hover:to-amber-300 focus:outline-none shadow-lg shadow-yellow-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Demo Roles
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin@gym.com', 'admin123')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left transition group"
              >
                <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold mb-0.5">
                  <Shield size={14} />
                  <span>Admin / Owner</span>
                </div>
                <div className="text-[11px] text-slate-400">admin@gym.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('john@example.com', 'member123')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left transition group"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-0.5">
                  <User size={14} />
                  <span>Gym Member</span>
                </div>
                <div className="text-[11px] text-slate-400">john@example.com</div>
              </button>
            </div>
          </div>

          {/* Walk-in Registration Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Front-desk staff walk-in?{' '}
            <Link to="/register-member" className="text-yellow-400 font-bold hover:underline">
              Register New Member Walk-In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
