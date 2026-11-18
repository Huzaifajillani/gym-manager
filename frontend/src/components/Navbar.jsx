import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, LogOut, Shield, User, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#111622]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg lg:hidden hover:bg-slate-800 transition"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/member/home')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 font-black">
            <Dumbbell size={20} className="transform -rotate-45" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-yellow-400 bg-clip-text text-transparent">
              APEX<span className="text-yellow-400 font-black ml-1">GYM</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded">
              Retention OS
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>WhatsApp Cloud API Active</span>
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
              <span className="text-[11px] font-mono text-slate-400">
                {isAdmin ? (
                  <span className="text-yellow-400 font-bold">STAFF / ADMIN</span>
                ) : (
                  user.memberCode || 'MEMBER'
                )}
              </span>
            </div>

            <div 
              onClick={() => navigate('/edit-profile')}
              className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-yellow-400 cursor-pointer hover:border-yellow-500 transition"
              title="Edit Profile"
            >
              {isAdmin ? <Shield size={16} /> : <User size={16} />}
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}