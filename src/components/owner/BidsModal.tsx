import React from 'react';
import { AppState } from '../../lib/store';
import { LabourJob } from '../../types';
import { Language, fmt, tTaskType, tPaymentSchedule } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { Lock, X } from 'lucide-react';

interface BidsModalProps {
  state: AppState;
  currentLang: Language;
  job: LabourJob;
  onClose: () => void;
  onAward: (bidId: string) => void;
}

export const BidsModal: React.FC<BidsModalProps> = ({ state, currentLang, job, onClose, onAward }) => {
  const t = useT(currentLang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">{t.bids_for} {tTaskType(job.task_type, currentLang)}</h3>
            <p className="text-xs text-slate-400">{t.job_budget}: LKR {job.wage_budget.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => onClose()}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{t.contacts_hidden_notice}</span>
          </div>

          {state.bids.filter(b => b.job_id === job.id).map((bid) => {
            const crewMembers = state.workers.filter(w => bid.crew_member_ids.includes(w.id));

            return (
              <div key={bid.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{bid.supervisor_name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                        ⭐ {bid.supervisor_trust_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>{t.phone_protected}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">{t.bid_total}</div>
                    <div className="text-base font-bold text-emerald-400">LKR {bid.price.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">{fmt(t.includes_commission, { amount: bid.supervisor_fee.toLocaleString() })}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <div className="font-semibold text-slate-400 text-[11px] mb-1">
                    {t.crew_plan} ({crewMembers.length} {t.common_workers}):
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {crewMembers.map(w => (
                      <div key={w.id} className="flex items-center justify-between text-[11px] bg-slate-850 p-1.5 rounded">
                        <span>{w.name}</span>
                        <span className="text-amber-400">⭐ {w.rating.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400 capitalize">
                    {t.payment_label}: <strong>{tPaymentSchedule(bid.payment_schedule, currentLang)}</strong>
                  </span>
                  <button
                    onClick={() => onAward(bid.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    {t.award_job} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
