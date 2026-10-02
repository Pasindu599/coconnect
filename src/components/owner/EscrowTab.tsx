import React from 'react';
import { AppState } from '../../lib/store';
import { Award } from '../../types';
import { Language, tEscrowStatus, tTaskType } from '../../lib/i18n';
import { contactsUnlocked } from '../../config/escrow';
import { EscrowTimeline } from '../common/EscrowTimeline';
import { useT } from '../../config/CategoryContext';
import { ShieldCheck, Unlock } from 'lucide-react';

interface EscrowTabProps {
  state: AppState;
  currentLang: Language;
  awards: Award[];
  onPayEscrow: (award: Award) => void;
  onViewContacts: (awardId: string) => void;
  onOpenDispute: (award: Award) => void;
}

export const EscrowTab: React.FC<EscrowTabProps> = ({ state, currentLang, awards, onPayEscrow, onViewContacts, onOpenDispute }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-base mb-1">
          <ShieldCheck className="w-5 h-5" />
          <span>{t.escrow_engine_title}</span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl">
          {t.escrow_engine_desc}
        </p>
      </div>

      <div className="space-y-3">
        {awards.map((award) => {
          const job = state.jobs.find(j => j.id === award.job_id);
          const status = award.escrow_status;

          return (
            <div key={award.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    status === 'released' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    status === 'disputed' || status === 'refunded' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {t.escrow_label}: {tEscrowStatus(award.escrow_status, currentLang)}
                  </span>
                  <span className="text-xs text-slate-400">{t.award_label} #{award.id}</span>
                </div>

                <h4 className="text-sm font-bold text-white mt-2">{tTaskType(job?.task_type, currentLang)}</h4>
                <p className="text-xs text-slate-400">{t.supervisor_label}: <strong className="text-slate-200">{award.supervisor_name}</strong></p>
                {award.fee_payment_ref && (
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{t.ref_label}: {award.fee_payment_ref}</p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400">{t.secured_amount}</div>
                  <div className="text-base font-bold text-emerald-400">LKR {award.escrow_amount.toLocaleString()}</div>
                </div>

                {contactsUnlocked(status) ? (
                  <button
                    onClick={() => onViewContacts(award.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.view_released_contacts}</span>
                  </button>
                ) : status === 'pending' ? (
                  <button
                    onClick={() => onPayEscrow(award)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
                  >
                    {t.pay_into_escrow} →
                  </button>
                ) : null}
              </div>
              </div>

              <EscrowTimeline status={status} currentLang={currentLang} />
              {(status === 'held' || status === 'release_requested') && (
                <div className="text-right">
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
          );
        })}
      </div>
    </div>
  );
};
