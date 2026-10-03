import React from 'react';
import { formatMoney } from '../../lib/money';
import { Language } from '../../lib/i18n';
import { AppState } from '../../lib/store';
import { useCategory, useT } from '../../config/CategoryContext';
import { CategoryIcon } from '../../config/CategoryIcon';
import { categoryOf, CategoryRole, l10n } from '../../config/categories';
import type { Capability, CategoryRoleId } from '../../types/category';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HardHat,
  KeyRound,
  MapPin,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface CategoryLandingProps {
  state: AppState;
  currentLang: Language;
  onOpenLogin: (roleId?: CategoryRoleId) => void;
  onExploreMap: () => void;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
}

// Tailwind needs the full class names present in the source.
const ROLE_STYLE: Record<Capability, { card: string; icon: string; title: string; check: string; button: string }> = {
  poster: {
    card: 'hover:border-emerald-600/60',
    icon: 'bg-emerald-950 border-emerald-800 text-emerald-400',
    title: 'group-hover:text-emerald-300',
    check: 'text-emerald-400',
    button: 'bg-emerald-600/90 hover:bg-emerald-600',
  },
  bidder: {
    card: 'hover:border-amber-600/60',
    icon: 'bg-amber-950 border-amber-800 text-amber-400',
    title: 'group-hover:text-amber-300',
    check: 'text-amber-400',
    button: 'bg-amber-600/90 hover:bg-amber-600',
  },
  crew: {
    card: 'hover:border-teal-600/60',
    icon: 'bg-teal-950 border-teal-800 text-teal-400',
    title: 'group-hover:text-teal-300',
    check: 'text-teal-400',
    button: 'bg-teal-600/90 hover:bg-teal-600',
  },
};

const RoleIcon: React.FC<{ role: CategoryRole; categoryIcon: 'trees' | 'building'; className?: string }> = ({
  role,
  categoryIcon,
  className,
}) => {
  if (role.capability === 'poster') return <CategoryIcon icon={categoryIcon} className={className} />;
  if (role.capability === 'bidder') return <HardHat className={className} />;
  return <UserCheck className={className} />;
};

export const CategoryLanding: React.FC<CategoryLandingProps> = ({
  state,
  currentLang,
  onOpenLogin,
  onExploreMap,
  onLanguageChange,
  onBack,
}) => {
  const t = useT(currentLang);
  const { category } = useCategory();

  const sites = state.estates.filter(e => categoryOf(e) === category.id);
  const jobs = state.jobs.filter(j => categoryOf(j) === category.id);
  const workers = state.workers.filter(w => categoryOf(w) === category.id);

  const siteStat =
    category.landingStat === 'tree_count' ? sites.reduce((sum, e) => sum + (e.tree_count || 0), 0) : sites.length;

  const firstPoster = category.roles.find(r => r.capability === 'poster');
  const wideGrid = category.roles.length >= 4;

  return (
    <div className="space-y-16 pb-12">
      {/* Top bar: back to categories + login */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{t.hero_badge}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900 text-emerald-300 border border-emerald-700">
                {t.landing_escrow_badge}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{t.landing_coverage}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.home_back_to_categories}</span>
          </button>
          <button
            onClick={() => onOpenLogin()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <span>{t.login}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative text-center max-w-4xl mx-auto pt-4 sm:pt-8 space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium shadow-inner">
          <CategoryIcon icon={category.icon} className="w-4 h-4 text-emerald-400" />
          <span>{l10n(category.label, currentLang)}</span>
          <span className="text-slate-600">•</span>
          <span>{t.tagline}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          {t.hero_title}
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.hero_subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
          <button
            onClick={() => onOpenLogin(firstPoster?.id)}
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

        <div className="pt-2 flex items-center justify-center space-x-2 text-xs">
          <span className="text-slate-500">{t.landing_lang_label}</span>
          {(['en', 'si', 'ta'] as Language[]).map(lang => (
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

      {/* Live stats for this category */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800/90 p-5 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{siteStat.toLocaleString()}</div>
          <div className="text-xs text-slate-400 font-medium">{t.stat_palms}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 p-5 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {formatMoney(jobs.reduce((acc, j) => acc + (j.wage_budget || 0), 0), currentLang)}
          </div>
          <div className="text-xs text-slate-400 font-medium">{t.stat_escrow}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 p-5 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-teal-400">
            {workers.length}+ {t.landing_active_suffix}
          </div>
          <div className="text-xs text-slate-400 font-medium">{t.stat_climbers}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 p-5 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">99.4%</div>
          <div className="text-xs text-slate-400 font-medium">{t.stat_satisfaction}</div>
        </div>
      </section>

      {/* Role cards from the registry */}
      <section className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{t.roles_heading}</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">{t.roles_subheading}</p>
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${wideGrid ? 'lg:grid-cols-4' : 'md:grid-cols-3'} gap-5`}
          data-testid="role-cards"
        >
          {category.roles.map(role => {
            const style = ROLE_STYLE[role.capability];
            return (
              <div
                key={role.id}
                data-testid={`role-card-${role.id}`}
                className={`bg-slate-900 border border-slate-800 ${style.card} p-6 rounded-2xl space-y-4 flex flex-col justify-between transition group shadow-lg`}
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${style.icon}`}>
                    <RoleIcon role={role} categoryIcon={category.icon} className="w-6 h-6" />
                  </div>
                  <h3 className={`text-lg font-bold text-white transition ${style.title}`}>
                    {l10n(role.card.title, currentLang)}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{l10n(role.card.desc, currentLang)}</p>
                  <ul className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                    {role.card.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${style.check}`} />
                        <span>{l10n(bullet, currentLang)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onOpenLogin(role.id)}
                  className={`w-full py-2.5 rounded-xl text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 ${style.button}`}
                >
                  <span>{l10n(role.card.action, currentLang)}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core pillars (wording follows the category) */}
      <section className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{t.features_title}</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">{t.features_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, tone: 'bg-emerald-950 border-emerald-800 text-emerald-400', title: t.feat_escrow_title, desc: t.feat_escrow_desc },
            { icon: KeyRound, tone: 'bg-amber-950 border-amber-800 text-amber-400', title: t.feat_dual_pin_title, desc: t.feat_dual_pin_desc },
            { icon: MapPin, tone: 'bg-blue-950 border-blue-800 text-blue-400', title: t.feat_gis_map_title, desc: t.feat_gis_map_desc },
            { icon: UserCheck, tone: 'bg-purple-950 border-purple-800 text-purple-400', title: t.feat_nic_title, desc: t.feat_nic_desc },
            { icon: Sparkles, tone: 'bg-teal-950 border-teal-800 text-teal-400', title: t.feat_trust_title, desc: t.feat_trust_desc },
            { icon: Smartphone, tone: 'bg-rose-950 border-rose-800 text-rose-400', title: t.feat_mobile_title, desc: t.feat_mobile_desc },
          ].map(({ icon: Icon, tone, title, desc }) => (
            <div key={title} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tone}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">{title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
