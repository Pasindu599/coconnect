import React from 'react';
import { Landmark, ShieldCheck } from 'lucide-react';
import { Worker } from '../../types';
import { Language, fmt, tConsent } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { describeBankRef } from '../../lib/bank';

interface WorkerPayoutCardProps {
  currentLang: Language;
  worker: Worker;
}

/** What a worker can see about how they will be paid and what they agreed to (read-only; the registering contractor edits it). */
export const WorkerPayoutCard: React.FC<WorkerPayoutCardProps> = ({ currentLang, worker }) => {
  const t = useT(currentLang);
  const bank = describeBankRef(worker.bank_ref);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="worker-payout-card">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
        <div className="flex items-center space-x-2 text-sm font-bold text-white">
          <Landmark className="w-4 h-4 text-teal-400" />
          <span>{t.worker_payout_title}</span>
        </div>
        {bank ? (
          <p className="text-sm text-slate-200 font-mono" data-testid="worker-payout-bank">{bank}</p>
        ) : (
          <p className="text-xs text-amber-300" data-testid="worker-payout-none">{t.worker_payout_none}</p>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
        <div className="flex items-center space-x-2 text-sm font-bold text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t.worker_consent_title}</span>
        </div>
        <p className="text-xs text-slate-300" data-testid="worker-consent">
          {fmt(t.worker_consent_on, {
            method: tConsent(worker.consent_method, currentLang),
            date: new Date(worker.consent_captured_at).toLocaleDateString(),
          })}
        </p>
      </div>
    </div>
  );
};
