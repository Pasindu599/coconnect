import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { store, type DisputeError } from '../../lib/store';
import { Award, ExceptionIssue } from '../../types';
import { Language, tReasonCode } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';

interface OpenDisputeModalProps {
  currentLang: Language;
  award: Award;
  onClose: () => void;
  /** Called with the confirmation message once the escrow is frozen. */
  onOpened: (message: string) => void;
}

const REASONS: ExceptionIssue['reason_code'][] = ['WORKER_NO_SHOW', 'WAGE_DISPUTE', 'POOR_WORKMANSHIP', 'ESTATE_ACCESS_ISSUE'];

/** Either party can open a dispute while the money is in escrow; that freezes it until an admin decides. */
export const OpenDisputeModal: React.FC<OpenDisputeModalProps> = ({ currentLang, award, onClose, onOpened }) => {
  const t = useT(currentLang);
  const [reason, setReason] = useState<ExceptionIssue['reason_code']>('WORKER_NO_SHOW');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<DisputeError | null>(null);

  const errorText: Record<DisputeError, string> = {
    unauthorized: t.dispute_err_unknown,
    'not-found': t.dispute_err_unknown,
    'not-party': t.dispute_err_not_party,
    'not-disputable': t.dispute_err_not_disputable,
    'description-too-short': t.dispute_err_short,
  };

  const reasonLabel = (code: ExceptionIssue['reason_code']) =>
    code === 'ESTATE_ACCESS_ISSUE' ? t.dispute_reason_access : tReasonCode(code, currentLang);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = store.openDispute({ award_id: award.id, reason_code: reason, description });
    if (result.success) {
      onOpened(t.dispute_opened);
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" data-testid="dispute-modal">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-300 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>{t.dispute_title}</span>
          </div>
          <button onClick={onClose} aria-label={t.common_close} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <p className="text-xs text-slate-300 p-3 rounded-xl bg-rose-950/40 border border-rose-900">{t.dispute_intro}</p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.dispute_reason_label}
            </label>
            <select
              data-testid="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ExceptionIssue['reason_code'])}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            >
              {REASONS.map(code => (
                <option key={code} value={code}>
                  {reasonLabel(code)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.dispute_description_label}
            </label>
            <textarea
              data-testid="dispute-description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              placeholder={t.dispute_description_ph}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
              {errorText[error]}
            </div>
          )}

          <div className="pt-1 flex items-center justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800">
              {t.common_cancel}
            </button>
            <button
              type="submit"
              data-testid="dispute-submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md"
            >
              {t.dispute_submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
