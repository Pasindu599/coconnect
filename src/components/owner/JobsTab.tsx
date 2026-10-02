import React from 'react';
import { AppState } from '../../lib/store';
import { LabourJob, Award } from '../../types';
import { Language, tJobStatus, tSkill, tTaskType } from '../../lib/i18n';
import { useCategory, useT } from '../../config/CategoryContext';
import { CategoryIcon } from '../../config/CategoryIcon';
import { contactsUnlocked } from '../../config/escrow';
import { EscrowTimeline } from '../common/EscrowTimeline';
import { ShieldCheck, Lock, Phone, CheckCircle2 } from 'lucide-react';

interface JobsTabProps {
  state: AppState;
  currentLang: Language;
  jobs: LabourJob[];
  onReviewBids: (job: LabourJob) => void;
  onPayEscrow: (award: Award) => void;
  onViewContacts: (awardId: string) => void;
  onVerifyCompletion: (job: LabourJob) => void;
}

export const JobsTab: React.FC<JobsTabProps> = ({ state, currentLang, jobs, onReviewBids, onPayEscrow, onViewContacts, onVerifyCompletion }) => {
  const t = useT(currentLang);
  const { category } = useCategory();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {jobs.map((job) => {
          const bids = state.bids.filter(b => b.job_id === job.id);
          const award = state.awards.find(a => a.job_id === job.id);
          const completion = state.completions.find(c => c.job_id === job.id);

          return (
            <div
              key={job.id}
              data-testid="job-card"
              data-job-task={job.task_type}
              data-job-status={job.status}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      job.status === 'OPEN' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                      job.status === 'AWARDED_PENDING_FEE' ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse' :
                      job.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      job.status === 'IN_PROGRESS' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      job.status === 'PENDING_COMPLETION' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800 font-bold' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {tJobStatus(job.status, currentLang)}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{tTaskType(job.task_type, currentLang)}</h3>
                    <p className="text-xs text-slate-400 flex items-center mt-1">
                      <CategoryIcon icon={category.icon} className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                      <span>{job.estate_name} ({job.estate_location})</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">{t.job_budget}</div>
                    <div className="text-sm font-bold text-emerald-400">LKR {job.wage_budget.toLocaleString()}</div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-300 line-clamp-2">
                  {job.description || t.job_no_description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.required_skills.map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {tSkill(s, currentLang)}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>{t.job_dates}: <span className="text-slate-200">{job.starts_at} → {job.ends_at}</span></div>
                  <div>{t.job_crew_size}: <span className="text-slate-200">{job.worker_count} {t.common_workers}</span></div>
                </div>
              </div>

              {award && (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <EscrowTimeline status={award.escrow_status} currentLang={currentLang} />
                </div>
              )}

              {/* Actions depending on status */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                {job.status === 'OPEN' && (
                  <>
                    <span className="text-xs text-slate-400">
                      <strong>{bids.length}</strong> {t.bids_received_label}
                    </span>
                    <button
                      data-testid="review-bids"
                      onClick={() => onReviewBids(job)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                    >
                      {t.review_bids} ({bids.length}) →
                    </button>
                  </>
                )}

                {job.status === 'AWARDED_PENDING_FEE' && award && (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-medium flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t.escrow_deposit_required}</span>
                    </span>
                    <button
                      onClick={() => onPayEscrow(award)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md animate-pulse"
                    >
                      {t.pay_into_escrow} (LKR {award.escrow_amount.toLocaleString()}) →
                    </button>
                  </div>
                )}

                {['ACTIVE', 'IN_PROGRESS'].includes(job.status) && award && (
                  <div className="w-full flex items-center justify-between">
                    {contactsUnlocked(award.escrow_status) ? (
                      <>
                        <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{t.escrow_held_secured}</span>
                        </span>
                        <button
                          data-testid="view-contacts"
                          onClick={() => onViewContacts(award.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-800 text-xs font-medium flex items-center space-x-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{t.view_direct_contacts}</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-amber-300 font-medium flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{t.contacts_locked_until_paid}</span>
                      </span>
                    )}
                  </div>
                )}

                {job.status === 'PENDING_COMPLETION' && (
                  <div className="w-full flex items-center justify-between bg-yellow-950/40 p-2 rounded-xl border border-yellow-800/80">
                    <span className="text-xs text-yellow-300 font-medium">
                      {t.sup_submitted_completion}
                    </span>
                    <button
                      onClick={() => onVerifyCompletion(job)}
                      className="px-3 py-1.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold shadow-md"
                    >
                      {t.verify_release_escrow}
                    </button>
                  </div>
                )}

                {job.status === 'COMPLETED' && (
                  <div className="w-full flex items-center justify-between text-xs text-emerald-400">
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.job_completed_released}</span>
                    </span>
                    <span className="font-mono text-slate-400">{t.archived}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
