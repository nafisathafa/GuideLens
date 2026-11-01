import React from 'react';
import { 
  LayoutDashboard, 
  Radar, 
  Eye, 
  ShieldAlert, 
  History, 
  Wifi, 
  WifiOff, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  piOnline,
  wsConnected,
  lastSeen,
  darkMode,
  setDarkMode,
  mobileOpen,
  setMobileOpen,
  guardianConfig
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'obstacles', label: 'Obstacle Detection', icon: Radar },
    { id: 'detections', label: 'Object Detection', icon: Eye },
    { id: 'sos', label: 'Emergency SOS', icon: ShieldAlert },
    { id: 'activity', label: 'Activity History', icon: History },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Eye className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
            GuideLens
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Pi status indicator badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            piOnline 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30' 
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${piOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            <span>{piOnline ? 'Online' : 'Offline'}</span>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top brand header */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-none">
                  Guidelens
                </h1>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-1">
                  Vision Assistance System
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Connection Card */}
          <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Raspberry Pi 4
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                piOnline 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${piOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {piOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
              <span className="flex items-center gap-1">
                <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-blue-500 animate-pulse' : 'text-amber-500'}`} />
                {wsConnected ? 'Live Socket' : 'Reconnecting...'}
              </span>
              <span className="text-[11px]">
                {piOnline ? 'Streaming' : 'Standby'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info & dark mode toggle */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
          {guardianConfig?.guardian_name && (
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                Primary Guardian
              </div>
              <div className="font-semibold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                {guardianConfig.guardian_name}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Theme
            </span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 py-1 px-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
