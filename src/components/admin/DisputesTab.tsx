import React, { useState } from 'react';
import { Scale } from 'lucide-react';
import { store, AppState, type ResolveDisputeError } from '../../lib/store';
import { ExceptionIssue } from '../../types';
import { Language, fmt, tReasonCode, tReviewStatus, tSubjectType, tTaskType } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';

interface DisputesTabProps {
  state: AppState;
  currentLang: Language;
}

interface DisputeCardProps {
  state: AppState;
  currentLang: Language;
  dispute: ExceptionIssue;
}

/** One dispute or exception. Disputes over an escrow get a refund/release decision; others keep the text-only resolution. */
const DisputeCard: React.FC<DisputeCardProps> = ({ state, currentLang, dispute }) => {
  const t = useT(currentLang);
  const job = state.jobs.find(j => j.id === dispute.job_id);
  const award = dispute.subject_type === 'award' ? state.awards.find(a => a.id === dispute.subject_id) : undefined;
  const isEscrowDispute = !!award && award.escrow_status === 'disputed';
  const open = dispute.status !== 'resolved';

  const [outcome, setOutcome] = useState<'refunded' | 'released'>('refunded');
  const [notes, setNotes] = useState(isEscrowDispute ? '' : t.resolution_notes_default);
  const [error, setError] = useState<ResolveDisputeError | null>(null);

  const errorText: Record<ResolveDisputeError, string> = {
    unauthorized: t.admin_403_title,
    'not-found': t.dispute_err_resolve,
    'not-open': t.dispute_err_resolve,
    'not-an-escrow-dispute': t.dispute_err_resolve,
    'notes-required': t.dispute_err_notes,
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEscrowDispute) {
      store.adminResolveException(dispute.id, notes);
      return;
    }
    const result = store.adminResolveDispute({ exception_id: dispute.id, outcome, notes });
    if (!result.success) setError(result.error);
  };

  return (
    <form
      onSubmit={handleResolve}
      data-testid="dispute-card"
      data-dispute-id={dispute.id}
      data-dispute-status={dispute.status}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              !open ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {t.dispute_label}: {tReviewStatus(dispute.status, currentLang)}
          </span>
          <h4 className="text-sm font-bold text-white mt-1.5">
            {tReasonCode(dispute.reason_code, currentLang)} — {tTaskType(job?.task_type, currentLang)}
          </h4>
          <p className="text-xs text-slate-400">
            {t.raised_by}: <strong className="text-slate-200">{dispute.raised_by_name}</strong> • {t.subject_label}:{' '}
            {tSubjectType(dispute.subject_type, currentLang)} (#{dispute.subject_id})
          </p>
        </div>

        <div className="text-right text-xs">
          <span className="text-slate-400">{t.deadline_label}</span>
          <div className="font-mono text-rose-400 font-semibold">{dispute.response_deadline.split('T')[0]}</div>
        </div>
      </div>

      <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">"{dispute.description}"</p>

      {isEscrowDispute && open && award && (
        <div className="text-xs text-amber-300 font-medium" data-testid="dispute-frozen">
          {fmt(t.dispute_escrow_frozen, { amount: award.escrow_amount.toLocaleString() })}
        </div>
      )}

      {open ? (
        <div className="pt-1 space-y-3">
          {isEscrowDispute && (
            <fieldset className="flex flex-col sm:flex-row gap-2">
              <legend className="text-[11px] font-semibold text-slate-300 mb-1">{t.dispute_outcome_label}</legend>
              {(['refunded', 'released'] as const).map(value => (
                <label
                  key={value}
                  className={`flex-1 flex items-center space-x-2 p-2.5 rounded-xl border text-xs cursor-pointer ${
                    outcome === value ? 'border-purple-500 bg-purple-950/40 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name={`outcome-${dispute.id}`}
                    data-testid={`outcome-${value}`}
                    checked={outcome === value}
                    onChange={() => setOutcome(value)}
                    className="accent-purple-500"
                  />
                  <span>{value === 'refunded' ? t.dispute_outcome_refund : t.dispute_outcome_release}</span>
                </label>
              ))}
            </fieldset>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <input
              type="text"
              data-testid="dispute-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setError(null);
              }}
              placeholder={isEscrowDispute ? t.dispute_resolve_notes_ph : t.resolution_ph}
              className="w-full sm:w-2/3 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
            <button
              type="submit"
              data-testid="dispute-resolve"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md whitespace-nowrap"
            >
              {isEscrowDispute ? t.dispute_resolve_btn : t.resolve_dispute}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-[11px] text-rose-300">
              {errorText[error]}
            </p>
          )}
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs" data-testid="dispute-resolution">
          {dispute.outcome && (
            <strong className="mr-1.5">
              {dispute.outcome === 'refunded' ? t.dispute_resolved_refunded : t.dispute_resolved_released}.
            </strong>
          )}
          {t.resolution_label}: {dispute.resolution} ({t.resolved_by} {dispute.resolved_by})
        </div>
      )}
    </form>
  );
};

/** Disputes and exceptions. Open ones come first. */
export const DisputesTab: React.FC<DisputesTabProps> = ({ state, currentLang }) => {
  const t = useT(currentLang);
  const ordered = [...state.exceptions].sort((a, b) => Number(a.status === 'resolved') - Number(b.status === 'resolved'));

  return (
    <div className="space-y-4" data-testid="disputes-tab">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Scale className="w-5 h-5 text-rose-400" />
          <span>{t.exceptions_title}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">{t.exceptions_desc}</p>
      </div>

      <div className="space-y-4">
        {ordered.map(dispute => (
          <DisputeCard key={dispute.id} state={state} currentLang={currentLang} dispute={dispute} />
        ))}
      </div>
    </div>
  );
};
