import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { Role } from '../../types';
import { Language, translations } from '../../lib/i18n';
import { 
  Trees, 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  HardHat, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Layers, 
  Globe, 
  ChevronDown, 
  User as UserIcon,
  Lock,
  ArrowRightLeft
} from 'lucide-react';

interface NavbarProps {
  state: AppState;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  currentLang,
  onLanguageChange,
  activeView,
  onNavigate,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const t = translations[currentLang];
  const user = state.currentUser;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'owner':
        return { label: t.landowner, icon: Trees, color: 'bg-emerald-800 text-emerald-100 border-emerald-700' };
      case 'supervisor':
        return { label: t.supervisor, icon: HardHat, color: 'bg-amber-800 text-amber-100 border-amber-700' };
      case 'worker':
        return { label: t.worker, icon: UserCheck, color: 'bg-teal-800 text-teal-100 border-teal-700' };
      case 'admin':
        return { label: t.admin, icon: ShieldCheck, color: 'bg-slate-800 text-purple-200 border-purple-600' };
    }
  };

  const currentRoleInfo = user ? getRoleBadge(user.active_role) : null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm shadow-emerald-500/20">
              <Trees className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">Coconnect</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-medium border border-emerald-800/80">
                  Labour & Escrow
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Coconut Sector Hiring Platform</p>
            </div>
          </div>

          {/* Center Navigation Links (if logged in) */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {/* Role specific home */}
              {user.active_role === 'owner' && (
                <>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      activeView === 'dashboard' ? 'bg-emerald-800/60 text-emerald-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.my_lands}
                  </button>
                  <button
                    onClick={() => onNavigate('jobs')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      activeView === 'jobs' ? 'bg-emerald-800/60 text-emerald-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.posted_jobs}
                  </button>
                </>
              )}

              {user.active_role === 'supervisor' && (
                <>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      activeView === 'dashboard' ? 'bg-amber-800/60 text-amber-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.crew_roster}
                  </button>
                  <button
                    onClick={() => onNavigate('jobs')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      activeView === 'jobs' ? 'bg-amber-800/60 text-amber-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.open_jobs}
                  </button>
                </>
              )}

              {user.active_role === 'worker' && (
                <>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      activeView === 'dashboard' ? 'bg-teal-800/60 text-teal-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.my_assignments}
                  </button>
                  <button
                    onClick={() => onNavigate('earnings')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      activeView === 'earnings' ? 'bg-teal-800/60 text-teal-200' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.wages_earned}
                  </button>
                </>
              )}

              {/* Shared Profile Page */}
              <button
                onClick={() => onNavigate('profile')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeView === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.profile}
              </button>

              {/* Strict Admin Link (ONLY visible if user has admin role) */}
              {user.roles.includes('admin') && (
                <button
                  onClick={() => {
                    store.switchRole('admin');
                    onNavigate('admin');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition ${
                    activeView === 'admin' 
                      ? 'bg-purple-900/60 text-purple-200 border border-purple-700' 
                      : 'text-purple-300 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Offline Simulator Toggle Button */}
            <button
              onClick={() => store.toggleOfflineMode()}
              title="Toggle rural offline outbox simulation"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                state.isOfflineSimulated
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {state.isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Offline Mode (Outbox Active)</span>
                  <span className="sm:hidden">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Online (Live API)</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(currentLang === 'en' ? 'si' : 'en')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-700"
              title="Switch Language / භාෂාව මාරු කරන්න"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{currentLang === 'en' ? 'සිංහල' : 'EN'}</span>
            </button>

            {/* Quick Demo Persona Switcher (For easy inspection of all 4 roles) */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 text-xs font-medium transition"
                title="Switch Demo Persona"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Demo Switcher</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showPersonaMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50"
                  onMouseLeave={() => setShowPersonaMenu(false)}
                >
                  <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-800 mb-1">
                    Quick Persona Login
                  </div>
                  {state.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        store.switchActiveUser(u.id);
                        setShowPersonaMenu(false);
                        if (u.active_role === 'admin') {
                          onNavigate('admin');
                        } else {
                          onNavigate('dashboard');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                        state.currentUser?.id === u.id ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{u.active_role} • {u.phone}</div>
                      </div>
                      <div className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                        ⭐ {u.trust_score.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current User & Active Role Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-750 text-xs transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="font-semibold text-white leading-tight">{user.name}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                      <span>{currentRoleInfo?.label}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showRoleMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs"
                    onMouseLeave={() => setShowRoleMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800">
                      <div className="font-semibold text-white">{user.name}</div>
                      <div className="text-slate-400 text-[11px]">{user.phone}</div>
                      <div className="mt-1 flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-800">
                          Trust: {user.trust_score.toFixed(2)} / 5.0
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] capitalize">
                          NIC: {user.nic_status}
                        </span>
                      </div>
                    </div>

                    {/* Role Switcher if multi-role */}
                    <div className="py-2 border-b border-slate-800">
                      <div className="px-2 pb-1 text-[11px] font-medium text-slate-400 flex items-center justify-between">
                        <span>Switch Active Role</span>
                        <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                      </div>
                      {(['owner', 'supervisor', 'worker'] as Role[]).map((r) => {
                        const isCurrent = user.active_role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => {
                              store.switchRole(r);
                              setShowRoleMenu(false);
                              onNavigate('dashboard');
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs capitalize flex items-center justify-between ${
                              isCurrent ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>{r === 'owner' ? 'Landowner' : r === 'supervisor' ? 'Supervisor/Broker' : 'Worker'}</span>
                            {isCurrent && <span className="text-[10px] text-emerald-400 font-normal">Active</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowRoleMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Profile & Verification</span>
                      </button>
                      <button
                        onClick={() => {
                          store.logout();
                          setShowRoleMenu(false);
                          onNavigate('login');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logout}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
              >
                {t.login}
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
