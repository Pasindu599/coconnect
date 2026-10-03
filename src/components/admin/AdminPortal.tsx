import React, { useState } from 'react';
import { AppState } from '../../lib/store';
import { Language } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { Banknote, History, Lock, Scale, ShieldCheck, Sliders, UserCheck } from 'lucide-react';
import { VerificationsTab } from './VerificationsTab';
import { PayoutsTab } from './PayoutsTab';
import { DisputesTab } from './DisputesTab';
import { AuditTab } from './AuditTab';
import { TrustRulesTab } from './TrustRulesTab';

interface AdminPortalProps {
  state: AppState;
  currentLang: Language;
  onExitAdmin: () => void;
}

type AdminTab = 'verifications' | 'payouts' | 'disputes' | 'audit' | 'trust_rules';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  state,
  currentLang,
  onExitAdmin,
}) => {
  const t = useT(currentLang);
  const user = state.currentUser;
  const [adminTab, setAdminTab] = useState<AdminTab>('verifications');

  // Strict Separation Check: Standard users have no access
  const isAdmin = user && user.roles.includes('admin');

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">{t.admin_403_title}</h2>
        <p className="text-xs text-slate-400 max-w-md mt-2">
          {t.admin_403_desc}
        </p>
      </div>
    );
  }

  const pendingDocs = state.verificationDocs.filter(d => d.status === 'pending');
  const pendingNicSubmissions = (state.nicSubmissions || []).filter(s => s.status === 'pending');
  const totalPendingVerifications = pendingDocs.length + pendingNicSubmissions.length;
  const openExceptions = state.exceptions.filter(e => e.status !== 'resolved');
  const payoutsWaiting = state.awards.filter(a => a.escrow_status === 'release_requested').length;

  const tabs: { id: AdminTab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'verifications', label: t.admin_tab_verifications, count: totalPendingVerifications, icon: <UserCheck className="w-4 h-4" /> },
    { id: 'payouts', label: t.admin_tab_payouts, count: payoutsWaiting, icon: <Banknote className="w-4 h-4 text-emerald-400" /> },
    { id: 'disputes', label: t.admin_tab_exceptions, count: openExceptions.length, icon: <Scale className="w-4 h-4 text-rose-400" /> },
    { id: 'audit', label: t.admin_tab_audit, count: state.auditLogs.length, icon: <History className="w-4 h-4 text-slate-400" /> },
    { id: 'trust_rules', label: t.admin_tab_trust, icon: <Sliders className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <div className="space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-slate-900 border border-purple-900/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-700 text-purple-300 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{t.admin_panel_title}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 text-xs font-mono font-semibold border border-purple-800">
                {t.admin_role_badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.staff_officer}: <strong className="text-white">{user.name}</strong> • {t.admin_endpoint_note} <code className="text-purple-300">/admin/*</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onExitAdmin}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            {t.return_client_app}
          </button>
        </div>
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">{t.metric_pending_verifications}</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingDocs.length} {t.metric_queue}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{t.metric_nic_land}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">{t.metric_active_disputes}</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{openExceptions.length} {t.metric_open}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{t.metric_attendance_wages}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">{t.metric_audit_logs}</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{state.auditLogs.length} {t.metric_events}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{t.metric_immutable}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">{t.metric_scoring_rule}</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{state.scoringRule.version}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{t.metric_frozen_until}</div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="border-b border-slate-800 flex items-center space-x-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-testid={`admin-tab-${tab.id}`}
            onClick={() => setAdminTab(tab.id)}
            className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
              adminTab === tab.id
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>
              {tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
            </span>
          </button>
        ))}
      </div>

      {adminTab === 'verifications' && <VerificationsTab state={state} currentLang={currentLang} />}
      {adminTab === 'payouts' && <PayoutsTab state={state} currentLang={currentLang} />}
      {adminTab === 'disputes' && <DisputesTab state={state} currentLang={currentLang} />}
      {adminTab === 'audit' && <AuditTab state={state} currentLang={currentLang} />}
      {adminTab === 'trust_rules' && <TrustRulesTab state={state} currentLang={currentLang} />}
    </div>
  );
};
