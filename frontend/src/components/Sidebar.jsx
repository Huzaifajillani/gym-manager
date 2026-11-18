import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  CreditCard,
  UserPlus,
  Home,
  RefreshCw,
  ShoppingBag,
  Clock,
  UserCog,
  Calculator,
  CalendarDays
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { isAdmin } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/members', label: 'Members & Plans', icon: Users },
    { to: '/admin/red-list', label: 'No-Show Red List', icon: AlertTriangle, badge: '10+ Days' },
    { to: '/admin/payments', label: 'Payments & Renewals', icon: CreditCard },
    { to: '/register-member', label: 'Walk-In Registration', icon: UserPlus },
    { to: '/bmi-calculator', label: 'BMI Calculator', icon: Calculator },
    { to: '/edit-profile', label: 'Edit Profile', icon: UserCog },
  ];

  const memberLinks = [
    { to: '/member/home', label: 'Member Home & QR', icon: Home },
    { to: '/member/attendance', label: 'Attendance History', icon: CalendarDays },
    { to: '/member/renew', label: 'Renew Membership', icon: RefreshCw },
    { to: '/member/addons', label: 'Add-ons & Privacy', icon: ShoppingBag },
    { to: '/bmi-calculator', label: 'BMI Calculator', icon: Calculator },
    { to: '/edit-profile', label: 'Edit Profile', icon: UserCog },
  ];

  const links = isAdmin ? adminLinks : memberLinks;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#0d121c] border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between p-4`}
      >
        <div>
          <div className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isAdmin ? 'Owner & Front Desk' : 'Member Workspace'}
          </div>

          <nav className="space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/40">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
            <Clock size={14} />
            <span>Facility Gate Schedule</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Open 24/7 for QR scanned access. Staff desk: 6:00 AM – 10:00 PM.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Server Cron</span>
            <span className="text-emerald-400 font-mono">@Scheduled Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}