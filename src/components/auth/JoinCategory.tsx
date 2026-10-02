import React from 'react';
import { store } from '../../lib/store';
import { Language, fmt } from '../../lib/i18n';
import { useCategory, useT } from '../../config/CategoryContext';
import { CategoryIcon } from '../../config/CategoryIcon';
import { l10n } from '../../config/categories';

interface JoinCategoryProps {
  currentLang: Language;
}

/** Shown to a signed-in user who opens a category where they hold no role yet. */
export const JoinCategory: React.FC<JoinCategoryProps> = ({ currentLang }) => {
  const t = useT(currentLang);
  const { category } = useCategory();

  return (
    <div className="max-w-md mx-auto py-10 space-y-5 text-center" data-testid="join-category">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
        <CategoryIcon icon={category.icon} className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-white">{fmt(t.join_title, { category: l10n(category.label, currentLang) })}</h2>
      <p className="text-xs text-slate-400">{t.join_desc}</p>

      <div className="space-y-2">
        {category.roles.map(role => (
          <button
            key={role.id}
            type="button"
            data-testid={`join-role-${role.id}`}
            onClick={() => store.addMembership({ category: category.id, role: role.id })}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-600/60 text-white text-sm font-semibold transition"
          >
            {fmt(t.join_as, { role: l10n(role.label, currentLang) })}
          </button>
        ))}
      </div>
    </div>
  );
};
