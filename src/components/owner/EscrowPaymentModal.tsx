import React from 'react';
import { Award } from '../../types';
import { Language, fmt } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { ShieldCheck, CreditCard } from 'lucide-react';

interface EscrowPaymentModalProps {
  currentLang: Language;
  award: Award;
  onClose: () => void;
  onConfirm: (awardId: string) => void;
}

export const EscrowPaymentModal: React.FC<EscrowPaymentModalProps> = ({ currentLang, award, onClose, onConfirm }) => {
  const t = useT(currentLang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
          <CreditCard className="w-5 h-5" />
          <span>{t.escrow_deposit_title}</span>
        </div>

        <p className="text-xs text-slate-300">
          {fmt(t.escrow_deposit_desc, { id: award.id })}
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>{t.supervisor_label}:</span>
            <strong className="text-white">{award.supervisor_name}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>{t.payment_gate}:</span>
            <strong className="text-emerald-400">{t.payment_gate_value}</strong>
          </div>
          <div className="flex justify-between text-slate-200 font-bold text-sm pt-2 border-t border-slate-800">
            <span>{t.total_escrow_deposit}:</span>
            <span className="text-emerald-400">LKR {award.escrow_amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => onClose()}
            className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
          >
            {t.common_cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(award.id)}
            className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.confirm_deposit}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
