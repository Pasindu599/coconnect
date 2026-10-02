import React from 'react';
import { Language } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { SL_BANKS, type BankFormError } from '../../lib/bank';

export interface BankFormValue {
  code: string;
  account: string;
}

interface BankDetailsFieldsProps {
  currentLang: Language;
  value: BankFormValue;
  onChange: (value: BankFormValue) => void;
  /** Shown under the fields once the person has tried to save. */
  error?: BankFormError | null;
}

const INPUT = 'w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs';

/** Bank + account number, validated by `validateBankForm` in src/lib/bank.ts. */
export const BankDetailsFields: React.FC<BankDetailsFieldsProps> = ({ currentLang, value, onChange, error }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-2" data-testid="bank-fields">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">{t.bank_label}</label>
          <select
            data-testid="bank-code"
            value={value.code}
            onChange={(e) => onChange({ ...value, code: e.target.value })}
            aria-invalid={error === 'bank-required'}
            className={INPUT}
          >
            <option value="">{t.bank_select}</option>
            {SL_BANKS.map(bank => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">{t.bank_account_label}</label>
          <input
            data-testid="bank-account"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={value.account}
            onChange={(e) => onChange({ ...value, account: e.target.value })}
            placeholder={t.bank_account_ph}
            aria-invalid={error === 'account-invalid'}
            className={`${INPUT} font-mono`}
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-[11px] text-rose-300">
          {error === 'bank-required' ? t.bank_err_bank : t.bank_err_account}
        </p>
      ) : (
        <p className="text-[11px] text-slate-500">{t.bank_hint}</p>
      )}
    </div>
  );
};
