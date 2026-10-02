import React from 'react';
import { store } from '../../lib/store';
import { Language, tSkill } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { Unlock, Phone, X } from 'lucide-react';

interface ContactsModalProps {
  currentLang: Language;
  awardId: string;
  onClose: () => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({ currentLang, awardId, onClose }) => {
  const t = useT(currentLang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
            <Unlock className="w-5 h-5" />
            <span>{t.contacts_released_title}</span>
          </div>
          <button onClick={() => onClose()} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {(() => {
          const res = store.getAwardContacts(awardId);
          if (!res.success || !res.contacts) {
            return (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl">
                {res.error || t.contacts_locked}
              </div>
            );
          }
          const { supervisor_name, supervisor_phone, crew } = res.contacts;

          return (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">{t.supervisor_contact}</div>
                <div className="text-sm font-bold text-white mt-1">{supervisor_name}</div>
                <div className="text-emerald-400 font-mono text-sm mt-0.5 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span data-testid="contact-phone">{supervisor_phone}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">{t.confirmed_crew}</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {crew.map((w, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{w.name}</div>
                        <div className="text-[11px] text-slate-500">{w.skills.map((sk) => tSkill(sk, currentLang)).join(', ')}</div>
                      </div>
                      <div className="font-mono text-emerald-400 text-[11px]">{w.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        <button
          onClick={() => onClose()}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
        >
          {t.common_close}
        </button>
      </div>
    </div>
  );
};
