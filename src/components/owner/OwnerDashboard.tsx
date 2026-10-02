import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { LabourJob, Award } from '../../types';
import { Language } from '../../lib/i18n';
import { useCategory, useT } from '../../config/CategoryContext';
import { CategoryIcon } from '../../config/CategoryIcon';
import { categoryOf } from '../../config/categories';
import { LandManagement } from './LandManagement';
import { JobsTab } from './JobsTab';
import { EscrowTab } from './EscrowTab';
import { AttendanceTab } from './AttendanceTab';
import { PostJobModal } from './PostJobModal';
import { BidsModal } from './BidsModal';
import { EscrowPaymentModal } from './EscrowPaymentModal';
import { ContactsModal } from './ContactsModal';
import { CompletionModal } from './CompletionModal';
import { OpenDisputeModal } from '../common/OpenDisputeModal';
import { NoticeBanner } from '../common/NoticeBanner';
import { Briefcase, CheckCircle2, PlusCircle, ShieldCheck } from 'lucide-react';

interface OwnerDashboardProps {
  state: AppState;
  currentLang: Language;
  onNavigate?: (view: any) => void;
}

/** Poster dashboard (landowner / client): jobs, sites, escrow and attendance for the active category. */
export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  state,
  currentLang,
  onNavigate,
}) => {
  const t = useT(currentLang);
  const { category } = useCategory();
  const user = state.currentUser;
  const [activeTab, setActiveTab] = useState<'jobs' | 'lands' | 'attendance' | 'escrow'>('jobs');

  // Which modal is open
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [postJobEstateId, setPostJobEstateId] = useState<string | undefined>();
  const [selectedJobForBids, setSelectedJobForBids] = useState<LabourJob | null>(null);
  const [selectedAwardForEscrow, setSelectedAwardForEscrow] = useState<Award | null>(null);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<LabourJob | null>(null);
  const [viewContactsAwardId, setViewContactsAwardId] = useState<string | null>(null);
  const [disputeAward, setDisputeAward] = useState<Award | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ownerEstates = state.estates.filter(e => e.owner_id === user?.id && categoryOf(e) === category.id);
  const ownerJobs = state.jobs.filter(j => j.owner_id === user?.id && categoryOf(j) === category.id);
  const ownerAwards = state.awards.filter(a => {
    const job = state.jobs.find(j => j.id === a.job_id);
    return job?.owner_id === user?.id && categoryOf(job) === category.id;
  });

  const handleAwardBid = (bidId: string) => {
    const res = store.awardBid(bidId);
    if (res.success && res.award) {
      setSelectedJobForBids(null);
      setSelectedAwardForEscrow(res.award);
    }
  };

  const openPostJob = (estateId?: string) => {
    setPostJobEstateId(estateId);
    setIsPostJobOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{t.owner_hub_title}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-xs font-semibold border border-emerald-800">
              {t.owner_verified_badge}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.owner_logged_in_as} <strong className="text-white">{user?.name}</strong> • {t.owner_belt_note}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            data-testid="post-job"
            onClick={() => setIsPostJobOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.post_job}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex items-center space-x-2">
        <button
          data-testid="tab-jobs"
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'jobs' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t.tab_posted_jobs} ({ownerJobs.length})</span>
        </button>

        <button
          data-testid="tab-lands"
          onClick={() => setActiveTab('lands')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'lands' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CategoryIcon icon={category.icon} className="w-4 h-4" />
          <span>{t.my_lands} ({ownerEstates.length})</span>
        </button>

        <button
          data-testid="tab-escrow"
          onClick={() => setActiveTab('escrow')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'escrow' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>{t.tab_escrow_awards} ({ownerAwards.length})</span>
        </button>

        <button
          data-testid="tab-attendance"
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'attendance' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{t.tab_dual_attendance}</span>
        </button>
      </div>


      {notice && <NoticeBanner message={notice} />}

      {activeTab === 'jobs' && (
        <JobsTab
          state={state}
          currentLang={currentLang}
          jobs={ownerJobs}
          onReviewBids={setSelectedJobForBids}
          onPayEscrow={setSelectedAwardForEscrow}
          onViewContacts={setViewContactsAwardId}
          onVerifyCompletion={setSelectedJobForCompletion}
          onOpenDispute={setDisputeAward}
        />
      )}

      {activeTab === 'lands' && (
        <LandManagement
          state={state}
          currentLang={currentLang}
          onSelectEstateForJob={openPostJob}
          onViewMap={() => onNavigate && onNavigate('map')}
        />
      )}

      {activeTab === 'escrow' && (
        <EscrowTab
          state={state}
          currentLang={currentLang}
          awards={ownerAwards}
          onPayEscrow={setSelectedAwardForEscrow}
          onViewContacts={setViewContactsAwardId}
          onOpenDispute={setDisputeAward}
        />
      )}

      {activeTab === 'attendance' && <AttendanceTab state={state} currentLang={currentLang} jobs={ownerJobs} />}

      {isPostJobOpen && (
        <PostJobModal
          currentLang={currentLang}
          estates={ownerEstates}
          initialEstateId={postJobEstateId}
          onClose={() => setIsPostJobOpen(false)}
        />
      )}

      {selectedJobForBids && (
        <BidsModal
          state={state}
          currentLang={currentLang}
          job={selectedJobForBids}
          onClose={() => setSelectedJobForBids(null)}
          onAward={handleAwardBid}
        />
      )}

      {selectedAwardForEscrow && (
        <EscrowPaymentModal
          state={state}
          currentLang={currentLang}
          award={selectedAwardForEscrow}
          onClose={() => setSelectedAwardForEscrow(null)}
        />
      )}

      {viewContactsAwardId && (
        <ContactsModal currentLang={currentLang} awardId={viewContactsAwardId} onClose={() => setViewContactsAwardId(null)} />
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
        <CompletionModal
          state={state}
          currentLang={currentLang}
          job={selectedJobForCompletion}
          onClose={() => setSelectedJobForCompletion(null)}
        />
      )}
    </div>
  );
};
