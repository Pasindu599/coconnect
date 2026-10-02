import React from 'react';
import { ArrowRight, Briefcase, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { Language } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { CATEGORY_LIST, l10n } from '../../config/categories';
import { ACCENT, CategoryIcon } from '../../config/CategoryIcon';
import type { CategoryId } from '../../types/category';

interface HomePageProps {
  currentLang: Language;
  onSelectCategory: (category: CategoryId) => void;
  onLanguageChange: (lang: Language) => void;
}

const STEPS = [
  { icon: Briefcase, title: 'home_step1_title', desc: 'home_step1_desc' },
  { icon: Users, title: 'home_step2_title', desc: 'home_step2_desc' },
  { icon: ShieldCheck, title: 'home_step3_title', desc: 'home_step3_desc' },
  { icon: CheckCircle2, title: 'home_step4_title', desc: 'home_step4_desc' },
] as const;

export const HomePage: React.FC<HomePageProps> = ({ currentLang, onSelectCategory, onLanguageChange }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-14 pb-12">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto pt-4 sm:pt-10 space-y-5">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t.home_badge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">{t.home_title}</h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{t.home_subtitle}</p>

        <div className="pt-1 flex items-center justify-center space-x-2 text-xs">
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

      {/* Category picker */}
      <section className="space-y-6" aria-labelledby="category-heading">
        <div className="text-center space-y-1.5">
          <h2 id="category-heading" className="text-2xl sm:text-3xl font-bold text-white">
            {t.home_choose_heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">{t.home_choose_sub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {CATEGORY_LIST.map(category => {
            const accent = ACCENT[category.accent];
            return (
              <button
                key={category.id}
                type="button"
                data-testid={`category-card-${category.id}`}
                onClick={() => onSelectCategory(category.id)}
                className={`group text-left bg-slate-900 border border-slate-800 ${accent.hoverBorder} p-6 rounded-2xl space-y-4 flex flex-col justify-between transition shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-950 border ${accent.border} ${accent.text} flex items-center justify-center`}>
                    <CategoryIcon icon={category.icon} className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{l10n(category.label, currentLang)}</h3>
                  <p className="text-sm text-slate-300">{l10n(category.tagline, currentLang)}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{l10n(category.description, currentLang)}</p>

                  <div className="pt-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">{t.home_card_for}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {category.roles.map(role => (
                        <span key={role.id} className={`text-[11px] px-2 py-0.5 rounded-full border ${accent.chip}`}>
                          {l10n(role.label, currentLang)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center space-x-1.5 text-sm font-bold ${accent.text}`}>
                  <span>{t.home_card_cta}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-white">{t.home_how_heading}</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(({ icon: Icon, title, desc }, index) => (
            <li key={title} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">{t[title]}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t[desc]}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
