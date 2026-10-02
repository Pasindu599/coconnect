import React from 'react';
import { AppState } from '../../lib/store';
import { Language, tAuditAction, tSubjectType } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { History } from 'lucide-react';

interface AuditTabProps {
  state: AppState;
  currentLang: Language;
}

export const AuditTab: React.FC<AuditTabProps> = ({ state, currentLang }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <History className="w-5 h-5 text-slate-400" />
          <span>{t.audit_title}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t.audit_desc}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto font-mono text-xs">
          {state.auditLogs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400 font-bold">[{tAuditAction(log.action, currentLang)}]</span>
                  <span className="text-slate-300 font-semibold">{log.actor_name}</span>
                  <span className="text-slate-500 text-[10px]">({tSubjectType(log.subject_type, currentLang)})</span>
                </div>
                <div className="text-slate-400 text-[11px] font-sans">{log.details}</div>
              </div>
              <div className="text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(log.at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
