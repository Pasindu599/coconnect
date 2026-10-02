import React, { useState } from 'react';
import { useT } from '../../config/CategoryContext';
import { store, AppState } from '../../lib/store';
import { Language } from '../../lib/i18n';
import { 
  Trees, 
  LogOut, 
  Globe, 
  ChevronDown, 
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  state: AppState;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (view: string) => void;
  showAccount?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  currentLang,
  onLanguageChange,
  onNavigate,
  showAccount = true,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = useT(currentLang);
  const user = state.currentUser;

  const langNames: Record<Language, { label: string; code: string }> = {
    en: { label: 'English', code: 'EN' },
    si: { label: 'සිංහල', code: 'සිං' },
    ta: { label: 'தமிழ்', code: 'தம' },
  };

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
                <span className="text-xl font-bold tracking-tight text-white">{t.app_title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-medium border border-emerald-800/80">
                  {t.nav_badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">{t.tagline}</p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Trilingual Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-200 hover:text-white border border-slate-700"
                title={t.nav_lang_tooltip}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="sr-only">{langNames[currentLang].label}</span>
              </button>

              {showLangMenu && (
                <div 
                  className="absolute right-0 mt-2 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs"
                  onMouseLeave={() => setShowLangMenu(false)}
                >
                  <button
                    onClick={() => {
                      onLanguageChange('en');
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between ${
                      currentLang === 'en' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>English</span>
                    <span className="text-[10px] text-slate-400 font-mono">EN</span>
                  </button>

                  <button
                    onClick={() => {
                      onLanguageChange('si');
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between ${
                      currentLang === 'si' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>සිංහල</span>
                    <span className="text-[10px] text-slate-400 font-mono">SI</span>
                  </button>

                  <button
                    onClick={() => {
                      onLanguageChange('ta');
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between ${
                      currentLang === 'ta' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>தமிழ்</span>
                    <span className="text-[10px] text-slate-400 font-mono">TA</span>
                  </button>
                </div>
              )}
            </div>

            {showAccount && (user ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-750 text-xs transition"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="sr-only">{user.name}</span>
                </button>

                {showRoleMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs"
                    onMouseLeave={() => setShowRoleMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-300">
                      {user.name}
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          store.logout();
                          setShowRoleMenu(false);
                          onNavigate('home');
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
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                title={t.login}
              >
                <UserIcon className="w-4 h-4" />
                <span className="sr-only">{t.login}</span>
              </button>
            ))}

          </div>

        </div>
      </div>
    </header>
  );
};
