import React, { useState } from 'react';
import { Landmark } from 'lucide-react';
import { store } from '../../lib/store';
import { User } from '../../types';
import { Language } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { describeBankRef, formatBankRef, parseBankRef, validateBankForm, type BankFormError } from '../../lib/bank';
import { BankDetailsFields, type BankFormValue } from '../common/BankDetailsFields';

interface PayoutAccountCardProps {
  currentLang: Language;
  user: User;
}

/** Where a contractor / broker is paid once a client confirms completion. An admin sends the payout here. */
export const PayoutAccountCard: React.FC<PayoutAccountCardProps> = ({ currentLang, user }) => {
  const t = useT(currentLang);
  const parsed = parseBankRef(user.payout_bank_ref);
  const [bank, setBank] = useState<BankFormValue>({ code: parsed?.code ?? '', account: parsed?.account ?? '' });
  const [error, setError] = useState<BankFormError | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateBankForm(bank.code, bank.account);
    setError(problem);
    if (problem) return;
    store.updatePayoutBank(bank.code ? formatBankRef(bank.code, bank.account) : '');
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4" data-testid="payout-account">
      <div>
        <div className="flex items-center space-x-2 text-base font-bold text-white">
          <Landmark className="w-5 h-5 text-amber-400" />
          <span>{t.profile_payout_title}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{t.profile_payout_desc}</p>
        <p className="text-xs text-slate-300 mt-2 font-mono" data-testid="payout-current">
          {describeBankRef(user.payout_bank_ref) ?? t.bank_none}
        </p>
      </div>

      <BankDetailsFields
        currentLang={currentLang}
        value={bank}
        onChange={(value) => {
          setBank(value);
          setError(null);
          setSaved(false);
        }}
        error={error}
      />

      <div className="flex items-center space-x-3">
        <button
          type="submit"
          data-testid="payout-save"
          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md"
        >
          {t.bank_save}
        </button>
        {saved && (
          <span role="status" className="text-xs text-emerald-300">
            {t.bank_saved}
          </span>
        )}
      </div>
    </form>
  );
};
