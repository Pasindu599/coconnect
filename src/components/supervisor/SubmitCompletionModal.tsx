import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { LabourJob, Worker, Award, WageRecord } from '../../types';
import { Language } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { DollarSign, X } from 'lucide-react';

interface SubmitCompletionModalProps {
  state: AppState;
  currentLang: Language;
  job: LabourJob;
  workers: Worker[];
  awards: Award[];
  onClose: () => void;
}

export const SubmitCompletionModal: React.FC<SubmitCompletionModalProps> = ({ state, currentLang, job, workers, awards, onClose }) => {
  const t = useT(currentLang);
  const award = awards.find(a => a.job_id === job.id);
  const bid = state.bids.find(b => b.id === award?.bid_id);
  const crew = workers.filter(w => bid?.crew_member_ids.includes(w.id));

  const defaultDailyRate = Math.round((job.wage_budget * 0.85) / (job.worker_count * job.duration_days));
  const [wageInputs, setWageInputs] = useState<{ [workerId: string]: { days: number; rate: number } }>(() => {
    const initial: { [id: string]: { days: number; rate: number } } = {};
    crew.forEach(w => {
      initial[w.id] = { days: job.duration_days, rate: defaultDailyRate };
    });
    return initial;
  });
  const [completionNotes, setCompletionNotes] = useState(t.completion_notes_default);

  const handleSubmitCompletion = (e: React.FormEvent) => {
    e.preventDefault();

    const wageRecords: WageRecord[] = crew.map(w => {
      const entry = wageInputs[w.id] || { days: 2, rate: 4500 };
      return {
        worker_id: w.id,
        worker_name: w.name,
        days_worked: entry.days,
        daily_rate: entry.rate,
        amount: entry.days * entry.rate,
        currency: 'LKR'
      };
    });

    const fee = bid ? bid.supervisor_fee : 4000;
    store.submitCompletion(job.id, wageRecords, fee, completionNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>{t.completion_modal_title}</span>
          </div>
          <button onClick={() => onClose()} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitCompletion} className="space-y-3">
          <div className="text-xs text-slate-400">
            {t.completion_desc}
          </div>

          <div className="space-y-2">
            {Object.keys(wageInputs).map((wid) => {
              const worker = state.workers.find(w => w.id === wid);
              const current = wageInputs[wid];

              return (
                <div key={wid} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 items-center text-xs">
                  <div className="font-semibold text-white">{worker?.name}</div>
                  <div>
                    <span className="text-[10px] text-slate-400">{t.days_label}</span>
                    <input
                      type="number"
                      min="1"
                      value={current.days}
                      onChange={(e) => {
                        setWageInputs({
                          ...wageInputs,
                          [wid]: { ...current, days: parseInt(e.target.value, 10) || 1 }
                        });
                      }}
                      className="w-full px-2 py-1 bg-slate-800 rounded border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">{t.rate_label}</span>
                    <input
                      type="number"
                      step="100"
                      value={current.rate}
                      onChange={(e) => {
                        setWageInputs({
                          ...wageInputs,
                          [wid]: { ...current, rate: parseFloat(e.target.value) || 0 }
                        });
                      }}
                      className="w-full px-2 py-1 bg-slate-800 rounded border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t.completion_notes}</label>
            <textarea
              rows={2}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 bg-slate-800"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
            >
              {t.send_to_owner}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
