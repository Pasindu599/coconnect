import React, { useState } from 'react';
import { X } from 'lucide-react';
import { store } from '../../lib/store';
import { Worker } from '../../types';
import { Language } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { formatBankRef, parseBankRef, validateBankForm, type BankFormError } from '../../lib/bank';
import { BankDetailsFields, type BankFormValue } from '../common/BankDetailsFields';

interface EditWorkerBankModalProps {
  currentLang: Language;
  worker: Worker;
  onClose: () => void;
  /** Called with the confirmation message once the details are saved. */
  onSaved: (message: string) => void;
}

/** Lets the person who registered a worker set or fix the worker's payout bank details. */
export const EditWorkerBankModal: React.FC<EditWorkerBankModalProps> = ({ currentLang, worker, onClose, onSaved }) => {
  const t = useT(currentLang);
  const parsed = parseBankRef(worker.bank_ref);
  const [bank, setBank] = useState<BankFormValue>({ code: parsed?.code ?? '', account: parsed?.account ?? '' });
  const [error, setError] = useState<BankFormError | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateBankForm(bank.code, bank.account);
    if (problem) {
      setError(problem);
      return;
    }
    const ref = bank.code ? formatBankRef(bank.code, bank.account) : '';
    if (store.updateWorkerBank(worker.id, ref).success) {
      onSaved(t.bank_saved);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" data-testid="edit-bank-modal">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-base">{t.bank_edit}</div>
            <div className="text-xs text-slate-400">{worker.name}</div>
          </div>
          <button onClick={onClose} aria-label={t.common_close} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <BankDetailsFields
            currentLang={currentLang}
            value={bank}
            onChange={(value) => {
              setBank(value);
              setError(null);
            }}
            error={error}
          />
          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs text-slate-400 bg-slate-800">
              {t.common_cancel}
            </button>
            <button
              type="submit"
              data-testid="bank-save"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md"
            >
              {t.bank_save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
