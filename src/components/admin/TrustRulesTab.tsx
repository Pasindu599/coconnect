import React from 'react';
import { AppState } from '../../lib/store';
import { Language } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { Sliders } from 'lucide-react';

interface TrustRulesTabProps {
  state: AppState;
  currentLang: Language;
}

export const TrustRulesTab: React.FC<TrustRulesTabProps> = ({ state, currentLang }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <span>{t.trust_engine_title}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t.trust_engine_desc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
          <div className="font-bold text-white text-sm">{t.active_weights} ({state.scoringRule.version})</div>
          
          <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">{t.weight_star_ratings}</span>
            <span className="font-bold text-amber-400 font-mono">{(state.scoringRule.weights.ratings * 100).toFixed(0)}%</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">{t.weight_job_completion}</span>
            <span className="font-bold text-emerald-400 font-mono">{(state.scoringRule.weights.completion_rate * 100).toFixed(0)}%</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">{t.weight_nic_bonus}</span>
            <span className="font-bold text-teal-400 font-mono">{(state.scoringRule.weights.verification_bonus * 100).toFixed(0)}%</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">{t.weight_dispute_penalty}</span>
            <span className="font-bold text-rose-400 font-mono">{(state.scoringRule.weights.dispute_penalty * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
          <div className="font-bold text-white text-sm">{t.bands_title}</div>
          
          <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 font-semibold">{t.band_elite}</span>
            <span className="text-white font-mono">&ge; {state.scoringRule.bands.elite.toFixed(2)} {t.band_elite_note}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-teal-400 font-semibold">{t.band_trusted}</span>
            <span className="text-white font-mono">&ge; {state.scoringRule.bands.trusted.toFixed(2)} {t.band_trusted_note}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-amber-400 font-semibold">{t.band_standard}</span>
            <span className="text-white font-mono">&ge; {state.scoringRule.bands.standard.toFixed(2)} {t.band_standard_note}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-rose-400 font-semibold">{t.band_restricted}</span>
            <span className="text-white font-mono">&lt; {state.scoringRule.bands.restricted.toFixed(2)} {t.band_restricted_note}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
