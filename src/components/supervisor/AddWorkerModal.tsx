import React, { useState } from 'react';
import { store } from '../../lib/store';
import { Language, tConsent, tSkill } from '../../lib/i18n';
import { useCategory, useT } from '../../config/CategoryContext';
import { UserCheck, X } from 'lucide-react';

interface AddWorkerModalProps {
  currentLang: Language;
  onClose: () => void;
}

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ currentLang, onClose }) => {
  const t = useT(currentLang);
  const { category } = useCategory();
  const [wName, setWName] = useState('');
  const [wPhone, setWPhone] = useState('+94 7');
  const [wNic, setWNic] = useState('199');
  const [wBank, setWBank] = useState('BOC 889922');
  const [wConsent, setWConsent] = useState<'sms' | 'written' | 'verbal_recorded'>('sms');
  const [wSkills, setWSkills] = useState<string[]>(category.defaults.skills);

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wName || !wPhone || !wNic) return;

    store.addWorker({
      name: wName,
      phone: wPhone,
      skills: wSkills,
      nic_ref: wNic,
      bank_ref: wBank,
      consent_method: wConsent,
      category: category.id
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <span>{t.add_worker}</span>
          </div>
          <button onClick={() => onClose()} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAddWorker} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t.common_full_name}</label>
            <input
              type="text"
              required
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder={t.worker_name_ph}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t.phone_number}</label>
              <input
                type="text"
                required
                value={wPhone}
                onChange={(e) => setWPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t.common_nic_number}</label>
              <input
                type="text"
                required
                value={wNic}
                onChange={(e) => setWNic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t.consent_method_label}</label>
            <select
              value={wConsent}
              onChange={(e) => setWConsent(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            >
              <option value="sms">{tConsent('sms', currentLang)}</option>
              <option value="written">{tConsent('written', currentLang)}</option>
              <option value="verbal_recorded">{tConsent('verbal_recorded', currentLang)}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t.worker_skills_label}</label>
            <div className="flex flex-wrap gap-1.5">
              {category.skills.map((sk) => {
                const selected = wSkills.includes(sk);
                return (
                  <button
                    type="button"
                    key={sk}
                    aria-pressed={selected}
                    onClick={() => setWSkills(selected ? wSkills.filter(s => s !== sk) : [...wSkills, sk])}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      selected
                        ? 'bg-amber-950 text-amber-300 border-amber-600 font-semibold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {tSkill(sk, currentLang)} {selected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t.bank_payout}</label>
            <input
              type="text"
              value={wBank}
              onChange={(e) => setWBank(e.target.value)}
              placeholder={t.bank_payout_ph}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 bg-slate-800"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md"
            >
              {t.register_worker}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
