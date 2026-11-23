import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { navItemDefs } from './navItems';

// ── Lucide-style inline SVG icons ─────────────────────────────────────────────
function Icon({ name, className = 'w-5 h-5' }) {
  const icons = {
    Dashboard: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
    Inventory: <><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></>,
    Category: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    PointOfSale: <><line x1="1" y1="1" x2="23" y2="1" /><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" /></>,
    Receipt: <><polyline points="3 7 12 2 21 7" /><path d="M3 7v13h18V7" /><line x1="9" y1="12" x2="15" y2="12" /></>,
    AssignmentReturn: <><path d="M19 14V5a2 2 0 00-2-2H5" /><polyline points="9 14 5 14 5 10" /><path d="M5 14l7-7" /></>,
    BarChart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    ManageAccounts: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
    Settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    Logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    Menu: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>,
    ChevronLeft: <polyline points="15 18 9 12 15 6" />,
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || null}
    </svg>
  );
}

export const DRAWER_WIDTH = 260;
export const COLLAPSED_WIDTH = 64;

export default function Sidebar({ open, onClose, variant = 'permanent', collapsed, onCollapsedChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const appName = import.meta.env.VITE_APP_NAME || import.meta.env.VITE_SHOP_NAME || 'Billing Software';

  const effectiveCollapsed = variant === 'temporary' ? false : collapsed;

  const visibleItems = navItemDefs.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const handleNavClick = (path) => {
    navigate(path);
    if (variant === 'temporary') onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? 'U';

  const content = (
    <div
      className="flex flex-col h-full bg-primary-600 text-white overflow-hidden transition-all duration-200"
      style={{ width: effectiveCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH }}
    >
      {/* Logo / Brand */}
      <div className={`flex items-center min-h-[64px] px-3 border-b border-white/15 ${effectiveCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!effectiveCollapsed && (
          <span className="text-sm font-bold truncate text-white leading-tight flex-1 mr-2">{appName}</span>
        )}
        <button
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label="Toggle sidebar"
        >
          <Icon name={effectiveCollapsed ? 'Menu' : 'ChevronLeft'} className="w-5 h-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              title={effectiveCollapsed ? item.label : undefined}
              className={`
                w-full flex items-center min-h-[44px] mx-auto rounded-xl transition mb-0.5
                ${effectiveCollapsed ? 'justify-center px-0 w-12 mx-2' : 'gap-3 px-3 mx-2 w-[calc(100%-16px)]'}
                ${isActive
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'}
              `}
            >
              <Icon name={item.iconName} className="w-5 h-5 shrink-0" />
              {!effectiveCollapsed && <span className="text-sm truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/15 p-2">
        {effectiveCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-DEFAULT text-white text-sm font-bold flex items-center justify-center">
              {userInitial}
            </div>
            <button
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              onClick={handleLogout}
              title="Logout"
            >
              <Icon name="Logout" className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <div className="w-9 h-9 rounded-full bg-secondary-DEFAULT text-white text-sm font-bold flex items-center justify-center shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name ?? 'User'}</p>
                <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full capitalize">
                  {user?.role ?? ''}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition text-sm"
            >
              <Icon name="Logout" className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'temporary') {
    if (!open) return null;
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
        <div className="fixed left-0 top-0 h-full z-50 shadow-xl">
          {content}
        </div>
      </>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-full z-30 shadow-lg transition-all duration-200"
      style={{ width: effectiveCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH }}>
      {content}
    </div>
  );
}
