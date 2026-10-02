import React from 'react';
import { AppState } from '../../lib/store';
import { LabourJob, Award } from '../../types';
import { Language, fmt, tJobStatus, tTaskType } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { EscrowTimeline } from '../common/EscrowTimeline';
import { DollarSign } from 'lucide-react';

interface ContractsTabProps {
  state: AppState;
  currentLang: Language;
  /** Awarded jobs that are running or awaiting sign-off. */
  jobs: LabourJob[];
  awards: Award[];
  onSubmitCompletion: (job: LabourJob) => void;
  onOpenDispute: (award: Award) => void;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({ state, currentLang, jobs, awards, onSubmitCompletion, onOpenDispute }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {jobs.map((job) => {
          const award = awards.find(a => a.job_id === job.id);
          const comp = state.completions.find(c => c.job_id === job.id);

          return (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                      {tJobStatus(job.status, currentLang)}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{tTaskType(job.task_type, currentLang)}</h3>
                    <p className="text-xs text-slate-400">{job.estate_name} • {job.estate_location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{t.escrow_held_label}</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">
                      LKR {award?.escrow_amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>{t.landowner_label}:</span>
                    <strong className="text-white">{job.owner_name}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.work_dates}:</span>
                    <span className="text-slate-200">{job.starts_at} to {job.ends_at}</span>
                  </div>
                </div>
              </div>

              {award && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <EscrowTimeline status={award.escrow_status} currentLang={currentLang} />
                  {(award.escrow_status === 'held' || award.escrow_status === 'release_requested') && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        data-testid="open-dispute"
                        onClick={() => onOpenDispute(award)}
                        className="text-[11px] text-rose-300 hover:text-rose-200 underline underline-offset-2"
                      >
                        {t.dispute_open_btn}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-slate-800">
                {comp ? (
                  <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-800 text-yellow-300 text-xs">
                    {fmt(t.wages_submitted_await, { amount: (comp.total_wages + comp.supervisor_fee).toLocaleString() })}
                  </div>
                ) : (
                  <button
                    data-testid="submit-completion"
                    onClick={() => onSubmitCompletion(job)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{t.submit_wages_completion}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
