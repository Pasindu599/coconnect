import React from 'react';
import { CheckCircle2, Circle, Loader2, PauseCircle, Undo2 } from 'lucide-react';
import type { EscrowStatus } from '../../types';
import { Language } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { ESCROW_STEPS, escrowProgress, type EscrowStep } from '../../config/escrow';

interface EscrowTimelineProps {
  status: EscrowStatus;
  currentLang: Language;
}

/** Where an award's money is: awarded, in escrow, completion confirmed, paid out. */
export const EscrowTimeline: React.FC<EscrowTimelineProps> = ({ status, currentLang }) => {
  const t = useT(currentLang);
  const { reached, halted } = escrowProgress(status);

  const labels: Record<EscrowStep, string> = {
    awarded: t.tl_awarded,
    in_escrow: t.tl_in_escrow,
    completion: t.tl_completion,
    paid_out: t.tl_paid_out,
  };

  return (
    <div data-testid="escrow-timeline" data-status={status} className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{t.tl_heading}</div>
      <ol className="flex items-center">
        {ESCROW_STEPS.map((step, index) => {
          const done = index < reached;
          // The first unfinished step is the one the money is waiting on (unless halted)
          const current = !halted && index === reached;
          return (
            <li key={step} className="flex items-center flex-1 last:flex-none">
              <div
                data-testid={`escrow-step-${step}`}
                data-state={done ? 'done' : current ? 'current' : 'todo'}
                className="flex flex-col items-center text-center min-w-0"
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : current ? (
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-700" />
                )}
                <span className={`mt-1 text-[10px] leading-tight ${done ? 'text-slate-200' : current ? 'text-amber-300' : 'text-slate-500'}`}>
                  {index === 1 && status === 'pending' ? t.tl_waiting_payment : labels[step]}
                </span>
              </div>
              {index < ESCROW_STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-1.5 ${index + 1 < reached ? 'bg-emerald-600' : 'bg-slate-800'}`} />
              )}
            </li>
          );
        })}
      </ol>

      {halted === 'disputed' && (
        <div role="status" className="flex items-start space-x-1.5 p-2 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-[11px]">
          <PauseCircle className="w-3.5 h-3.5 mt-px flex-shrink-0" />
          <span>{t.tl_disputed}</span>
        </div>
      )}
      {halted === 'refunded' && (
        <div role="status" className="flex items-start space-x-1.5 p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
          <Undo2 className="w-3.5 h-3.5 mt-px flex-shrink-0" />
          <span>{t.tl_refunded}</span>
        </div>
      )}
    </div>
  );
};
