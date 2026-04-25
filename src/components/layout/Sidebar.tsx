import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Table2, History, ShoppingBag,
  Package, BarChart3, Settings, CreditCard
} from 'lucide-react';
import { translations } from '../../lib/i18n';

interface Props {
  onClose?: () => void;
}

const navLinks = [
  { to: '/', icon: Table2, label: translations.nav.tables, end: true },
  { to: '/dashboard', icon: LayoutDashboard, label: translations.nav.dashboard },
  { to: '/sessions', icon: History, label: translations.nav.sessions },
  { to: '/orders', icon: ShoppingBag, label: translations.nav.orders },
  { to: '/products', icon: Package, label: translations.nav.products },
  { to: '/payments', icon: CreditCard, label: translations.nav.payments },
  { to: '/reports', icon: BarChart3, label: translations.nav.reports },
  { to: '/settings', icon: Settings, label: translations.nav.settings },
];

export function Sidebar({ onClose }: Props) {
  return (
    <aside className="flex flex-col h-full bg-slate-900 text-white w-64">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <Table2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">JOCKER</h1>
            <p className="text-xs text-slate-400">Billiard Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="px-3 py-2 rounded-xl bg-slate-800 text-xs text-slate-400 text-center">
          JOCKER Manager v1.0
        </div>
      </div>
    </aside>
  );
}
