import React from 'react';
import { Language, translations } from '../../lib/i18n';
import { AppState } from '../../lib/store';
import { Role } from '../../types';
import { 
  Trees, 
  ShieldCheck, 
  KeyRound, 
  MapPin, 
  UserCheck, 
  HardHat, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  Sparkles,
  Users,
  Briefcase
} from 'lucide-react';

interface LandingWebsiteProps {
  state: AppState;
  currentLang: Language;
  onOpenLogin: (preselectedRole?: Role) => void;
  onExploreMap: () => void;
  onLanguageChange: (lang: Language) => void;
}

export const LandingWebsite: React.FC<LandingWebsiteProps> = ({
  state,
  currentLang,
  onOpenLogin,
  onExploreMap,
  onLanguageChange,
}) => {
  const t = translations[currentLang] || translations.en;

  const handleRoleClick = (role: Role) => {
    // If demo user exists, quick switch or open login for that role
    onOpenLogin(role);
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {t.hero_badge}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900 text-emerald-300 border border-emerald-700">
                100% Escrow Secured
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Coconut Triangle Coverage: Kurunegala, Puttalam, Gampaha, Chilaw, Kuliyapitiya & Beyond
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenLogin('owner')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <span>{t.login}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-4 sm:pt-8 space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium shadow-inner">
          <Trees className="w-4 h-4 text-emerald-400" />
          <span>{t.tagline}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          {t.hero_title}
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.hero_subtitle}
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
          <button
            onClick={() => onOpenLogin('owner')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition flex items-center justify-center space-x-2 group"
          >
            <span>{t.hero_cta_primary}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={onExploreMap}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition flex items-center justify-center space-x-2"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{t.hero_cta_secondary}</span>
          </button>

        </div>

        {/* Language Quick Switcher on Hero */}
        <div className="pt-2 flex items-center justify-center space-x-2 text-xs">
          <span className="text-slate-500">Language / භාෂාව / மொழி:</span>
          {(['en', 'si', 'ta'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                currentLang === lang
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'en' ? 'English (EN)' : lang === 'si' ? 'සිංහල (SI)' : 'தமிழ் (TA)'}
            </button>
          ))}
        </div>
      </section>

      {/* Live Operational Stats Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800/90 p-5 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {state.estates.reduce((acc, e) => acc + (e.tree_count || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-medium">{t.stat_palms}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 p-5 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            Rs. {state.jobs.reduce((acc, j) => acc + (j.wage_budget || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-medium">{t.stat_escrow}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 p-5 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-teal-400">
            {state.workers.length}+ Active
          </div>
          <div className="text-xs text-slate-400 font-medium">{t.stat_climbers}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 p-5 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
            99.4%
          </div>
          <div className="text-xs text-slate-400 font-medium">{t.stat_satisfaction}</div>
        </div>
      </section>

      {/* Role-Specific Portal Entry Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {t.roles_heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Choose your role to access customized dashboards, tools, and escrow workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Owner Role Card */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-600/60 p-6 rounded-2xl space-y-4 flex flex-col justify-between transition group shadow-lg">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <Trees className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                {t.role_owner_title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.role_owner_desc}
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Maps boundary registration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deposit escrow to unlock crew contacts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dual 4-digit PIN completion release</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleClick('owner')}
              className="w-full py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5"
            >
              <span>{t.role_owner_action}</span>
            </button>
          </div>

          {/* Supervisor / Broker Role Card */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-600/60 p-6 rounded-2xl space-y-4 flex flex-col justify-between transition group shadow-lg">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                {t.role_supervisor_title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.role_supervisor_desc}
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manage climber crew roster</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bid on coconut plucking contracts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline field attendance & wage tracking</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleClick('supervisor')}
              className="w-full py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5"
            >
              <span>{t.role_supervisor_action}</span>
            </button>
          </div>

          {/* Worker Role Card */}
          <div className="bg-slate-900 border border-slate-800 hover:border-teal-600/60 p-6 rounded-2xl space-y-4 flex flex-col justify-between transition group shadow-lg">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition">
                {t.role_worker_title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.role_worker_desc}
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Fair per-palm plucking wages</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Verified attendance & wage ledger</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Build national climber trust rating</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleClick('worker')}
              className="w-full py-2.5 rounded-xl bg-teal-600/90 hover:bg-teal-600 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5"
            >
              <span>{t.role_worker_action}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6 Core Architectural Pillars */}
      <section className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {t.features_title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {t.features_subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">{t.feat_escrow_title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat_escrow_desc}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">{t.feat_dual_pin_title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat_dual_pin_desc}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">{t.feat_gis_map_title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat_gis_map_desc}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">{t.feat_nic_title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat_nic_desc}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">{t.feat_trust_title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat_trust_desc}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="w-9 h-9 rounded-xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">{t.feat_mobile_title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat_mobile_desc}</p>
          </div>
        </div>
      </section>

    </div>
  );
};
