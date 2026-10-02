import React from 'react';
import { formatMoney } from '../../lib/money';
import { AppState } from '../../lib/store';
import { LabourJob } from '../../types';
import { Language, tReviewStatus, tSkill, tTaskType } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { Send } from 'lucide-react';

interface MarketplaceTabProps {
  state: AppState;
  currentLang: Language;
  /** Open jobs in the active category. */
  jobs: LabourJob[];
  userId?: string;
  onBid: (job: LabourJob) => void;
}

export const MarketplaceTab: React.FC<MarketplaceTabProps> = ({ state, currentLang, jobs, userId, onBid }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {jobs.map((job) => {
          const myBid = state.bids.find(b => b.job_id === job.id && b.supervisor_id === userId);

          return (
            <div
              key={job.id}
              data-testid="open-job-card"
              data-job-task={job.task_type}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                      {t.open_for_bids}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{tTaskType(job.task_type, currentLang)}</h3>
                    <p className="text-xs text-slate-400">{job.estate_name} • {job.estate_location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{t.owner_budget}</div>
                    <div className="text-sm font-bold text-emerald-400">{formatMoney(job.wage_budget, currentLang)}</div>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs grid grid-cols-2 gap-2 text-slate-400">
                  <div>{t.start_date}: <strong className="text-white">{job.starts_at}</strong></div>
                  <div>{t.end_date}: <strong className="text-white">{job.ends_at}</strong></div>
                  <div>{t.required_crew}: <strong className="text-white">{job.worker_count} {t.common_workers}</strong></div>
                  <div>{t.duration_label}: <strong className="text-white">{job.duration_days} {t.common_days}</strong></div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.required_skills.map((sk, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {tSkill(sk, currentLang)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                {myBid ? (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-medium">
                      {t.your_bid}: {formatMoney(myBid.price, currentLang)} ({tReviewStatus(myBid.status, currentLang)})
                    </span>
                    <span className="text-[11px] text-slate-400">{myBid.crew_member_ids.length} {t.crew_selected}</span>
                  </div>
                ) : (
                  <button
                    data-testid="place-bid"
                    onClick={() => onBid(job)}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.submit_crew_bid_arrow}</span>
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
