import React from 'react';
import { Worker } from '../../types';
import { Language, tConsent, tSkill } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { Check } from 'lucide-react';

interface RosterTabProps {
  currentLang: Language;
  workers: Worker[];
}

export const RosterTab: React.FC<RosterTabProps> = ({ currentLang, workers }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((w) => {
          return (
            <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 font-bold flex items-center justify-center">
                      {w.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{w.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{w.phone}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    ⭐ {w.rating.toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-400 space-y-1">
                  <div>{t.roster_nic}: <span className="text-slate-200 font-mono">{w.nic_ref}</span></div>
                  <div>{t.roster_bank}: <span className="text-slate-200">{w.bank_ref || t.roster_cash_on_site}</span></div>
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-medium">
                      {t.roster_consent}: {tConsent(w.consent_method, currentLang)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t.common_jobs}: {w.jobs_completed}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {w.skills.map((sk, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {tSkill(sk, currentLang)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-emerald-400 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.roster_confirmed}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
