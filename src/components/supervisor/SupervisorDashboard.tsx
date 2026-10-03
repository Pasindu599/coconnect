import React, { useState } from 'react';
import { AppState } from '../../lib/store';
import { Award, LabourJob, Worker } from '../../types';
import { Language } from '../../lib/i18n';
import { useCategory, useT } from '../../config/CategoryContext';
import { categoryOf } from '../../config/categories';
import { RosterTab } from './RosterTab';
import { MarketplaceTab } from './MarketplaceTab';
import { FieldAttendanceTab } from './FieldAttendanceTab';
import { ContractsTab } from './ContractsTab';
import { SubmitBidModal } from './SubmitBidModal';
import { OpenDisputeModal } from '../common/OpenDisputeModal';
import { NoticeBanner } from '../common/NoticeBanner';
import { EditWorkerBankModal } from './EditWorkerBankModal';
import { AddWorkerModal } from './AddWorkerModal';
import { SubmitCompletionModal } from './SubmitCompletionModal';
import { Users, PlusCircle, Briefcase, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface SupervisorDashboardProps {
  state: AppState;
  currentLang: Language;
}

/** Bidder dashboard (broker / contractor / subcontractor): crew, open jobs, attendance and contracts for the active category. */
export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  state,
  currentLang,
}) => {
  const t = useT(currentLang);
  const { category } = useCategory();
  const user = state.currentUser;
  const [activeTab, setActiveTab] = useState<'roster' | 'marketplace' | 'attendance' | 'completions'>('roster');

  // Which modal is open
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [selectedJobForBid, setSelectedJobForBid] = useState<LabourJob | null>(null);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<LabourJob | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [disputeAward, setDisputeAward] = useState<Award | null>(null);
  const [bankWorker, setBankWorker] = useState<Worker | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supervisorWorkers = state.workers.filter(w => w.supervisor_id === user?.id && categoryOf(w) === category.id);
  const openJobs = state.jobs.filter(j => j.status === 'OPEN' && categoryOf(j) === category.id);
  const supervisorAwards = state.awards.filter(a => {
    const job = state.jobs.find(j => j.id === a.job_id);
    return a.supervisor_id === user?.id && categoryOf(job) === category.id;
  });
  const awardedJobs = state.jobs.filter(j => supervisorAwards.some(a => a.job_id === j.id));
  // Contracts stay on this tab after sign-off, a dispute or a refund so the timeline can show where the money is
  const activeJobs = awardedJobs.filter(j =>
    ['ACTIVE', 'IN_PROGRESS', 'PENDING_COMPLETION', 'EXCEPTION_OPEN', 'COMPLETED', 'CLOSED_DISPUTED'].includes(j.status)
  );

  const handleBidSubmitted = (message: string) => {
    setBidSuccess(message);
    setTimeout(() => setBidSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{t.sup_portal_title}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 text-xs font-semibold border border-amber-800">
              {t.sup_licensed_badge}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.owner_logged_in_as} <strong className="text-white">{user?.name}</strong> • {t.sup_trust_score}: <strong className="text-amber-400 font-mono">⭐ {user?.trust_score.toFixed(2)}</strong> • {t.sup_overlap}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            data-testid="add-worker"
            onClick={() => setIsAddWorkerOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.add_worker}</span>
          </button>
        </div>
      </div>

      {bidSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{bidSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800 flex items-center space-x-2 overflow-x-auto">
        <button
          data-testid="tab-roster"
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
            activeTab === 'roster' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.tab_crew_roster} ({supervisorWorkers.length})</span>
        </button>

        <button
          data-testid="tab-marketplace"
          onClick={() => setActiveTab('marketplace')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
            activeTab === 'marketplace' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t.tab_open_jobs} ({openJobs.length})</span>
        </button>

        <button
          data-testid="tab-attendance"
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
            activeTab === 'attendance' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-teal-400" />
          <span>{t.tab_daily_checkin}</span>
        </button>

        <button
          data-testid="tab-completions"
          onClick={() => setActiveTab('completions')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
            activeTab === 'completions' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>{t.tab_active_contracts} ({activeJobs.length})</span>
        </button>
      </div>

      {notice && <NoticeBanner message={notice} />}

      {activeTab === 'roster' && (
        <RosterTab currentLang={currentLang} workers={supervisorWorkers} onEditBank={setBankWorker} />
      )}

      {activeTab === 'marketplace' && (
        <MarketplaceTab state={state} currentLang={currentLang} jobs={openJobs} userId={user?.id} onBid={setSelectedJobForBid} />
      )}

      {activeTab === 'attendance' && (
        <FieldAttendanceTab state={state} currentLang={currentLang} workers={supervisorWorkers} jobs={awardedJobs} />
      )}

      {activeTab === 'completions' && (
        <ContractsTab
          state={state}
          currentLang={currentLang}
          jobs={activeJobs}
          awards={supervisorAwards}
          onSubmitCompletion={setSelectedJobForCompletion}
          onOpenDispute={setDisputeAward}
        />
      )}

      {selectedJobForBid && (
        <SubmitBidModal
          currentLang={currentLang}
          job={selectedJobForBid}
          workers={supervisorWorkers}
          onClose={() => setSelectedJobForBid(null)}
          onSubmitted={handleBidSubmitted}
        />
      )}

      {isAddWorkerOpen && <AddWorkerModal currentLang={currentLang} onClose={() => setIsAddWorkerOpen(false)} />}

      {bankWorker && (
        <EditWorkerBankModal
          currentLang={currentLang}
          worker={bankWorker}
          onClose={() => setBankWorker(null)}
          onSaved={setNotice}
        />
      )}

      {disputeAward && (
        <OpenDisputeModal
          currentLang={currentLang}
          award={disputeAward}
          onClose={() => setDisputeAward(null)}
          onOpened={setNotice}
        />
      )}

      {selectedJobForCompletion && (
        <SubmitCompletionModal
          state={state}
          currentLang={currentLang}
          job={selectedJobForCompletion}
          workers={supervisorWorkers}
          awards={supervisorAwards}
          onClose={() => setSelectedJobForCompletion(null)}
        />
      )}
    </div>
  );
};
