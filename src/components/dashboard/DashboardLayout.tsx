import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserRole } from '../../services/authService';
import StatusBadge from './StatusBadge';
import {
  MenuIcon,
  XIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from './DashboardIcons';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  roleBadge?: UserRole;
  navItems: DashboardNavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  actions?: React.ReactNode;
  error?: string | null;
  success?: string | null;
  onClearError?: () => void;
  onClearSuccess?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  roleBadge,
  navItems,
  activeTab,
  onTabChange,
  actions,
  error,
  success,
  onClearError,
  onClearSuccess,
  children,
}) => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  const effectiveRole = roleBadge || role;

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col transition-colors">
      <div className="flex flex-1">
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar (Mobile Drawer + Desktop Fixed) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/80 transition-all duration-300 ease-in-out lg:static lg:z-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${collapsed ? 'w-20' : 'w-64'}`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700/80">
            <NavLink
              to="/"
              className={`flex items-center gap-3 font-poppins font-bold text-gray-900 dark:text-white overflow-hidden transition-all ${
                collapsed ? 'justify-center w-full' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-sm">
                G
              </div>
              {!collapsed && (
                <div className="flex flex-col leading-tight">
                  <span className="text-base tracking-wide">Galileo</span>
                  <span className="text-[10px] font-normal uppercase tracking-widest text-teal">
                    Plateforme
                  </span>
                </div>
              )}
            </NavLink>

            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              aria-label="Fermer le menu"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Role pill when not collapsed */}
          {!collapsed && effectiveRole && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Espace</span>
              <StatusBadge role={effectiveRole} size="sm" />
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-teal' : 'text-gray-400 dark:text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full bg-teal text-white">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer with Collapse Button */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700/80 hidden lg:block">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
            >
              {collapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeftIcon className="w-4 h-4" />
                  <span>Réduire le volet</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            {/* Left: Mobile hamburger + Titles */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                aria-label="Ouvrir le menu de navigation"
              >
                <MenuIcon className="w-6 h-6" />
              </button>

              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions + Theme + Profile + Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              {actions && <div className="flex items-center gap-2">{actions}</div>}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
                aria-label="Changer le thème"
              >
                {theme === 'dark' ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5" />}
              </button>

              {/* User email & logout */}
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="hidden md:flex flex-col text-right leading-tight max-w-[160px]">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {user?.displayName || user?.email?.split('@')[0] || 'Utilisateur'}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Se déconnecter"
                  aria-label="Se déconnecter"
                >
                  <LogoutIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Feedback Alerts */}
          {(error || success) && (
            <div className="px-4 sm:px-6 lg:px-8 pt-4">
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircleIcon className="w-5 h-5 flex-shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </div>
                  {onClearError && (
                    <button
                      onClick={onClearError}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 p-0.5 rounded transition-colors"
                      aria-label="Masquer l'alerte d'erreur"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-start justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                    <span>{success}</span>
                  </div>
                  {onClearSuccess && (
                    <button
                      onClick={onClearSuccess}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 p-0.5 rounded transition-colors"
                      aria-label="Masquer l'alerte de succès"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

