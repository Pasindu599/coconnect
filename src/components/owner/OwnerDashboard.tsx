import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { LabourJob, Bid, Award, AttendanceDay, WageRecord } from '../../types';
import { Language, translations } from '../../lib/i18n';
import { LandManagement } from './LandManagement';
import { 
  Trees, 
  PlusCircle, 
  Briefcase, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Star, 
  Calendar, 
  Users, 
  Eye, 
  Check, 
  Key, 
  X,
  CreditCard,
  Building2,
  FileCheck
} from 'lucide-react';

interface OwnerDashboardProps {
  state: AppState;
  currentLang: Language;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  state,
  currentLang,
}) => {
  const t = translations[currentLang];
  const user = state.currentUser;
  const [activeTab, setActiveTab] = useState<'jobs' | 'lands' | 'attendance' | 'escrow'>('jobs');
  
  // Modals state
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [selectedJobForBids, setSelectedJobForBids] = useState<LabourJob | null>(null);
  const [selectedAwardForEscrow, setSelectedAwardForEscrow] = useState<Award | null>(null);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<LabourJob | null>(null);
  const [viewContactsAwardId, setViewContactsAwardId] = useState<string | null>(null);
  
  // New Job Form State
  const ownerEstates = state.estates.filter(e => e.owner_id === user?.id);
  const [estateId, setEstateId] = useState(ownerEstates[0]?.id || '');
  const [taskType, setTaskType] = useState('Coconut Harvesting & Bunch Lowering');
  const [startsAt, setStartsAt] = useState('2026-09-28');
  const [endsAt, setEndsAt] = useState('2026-09-30');
  const [workerCount, setWorkerCount] = useState('3');
  const [durationDays, setDurationDays] = useState('2');
  const [wageBudget, setWageBudget] = useState('42000');
  const [skillsSelected, setSkillsSelected] = useState<string[]>(['Tree Climbing', 'Coconut Plucking']);
  const [description, setDescription] = useState('');

  // Dual-Confirmation PIN & Rating State
  const [pinInput, setPinInput] = useState('1234');
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('Outstanding punctuality and zero broken bunches.');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual Crew', 'Safe Tree Climbing', 'Clean Estate']);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const ownerJobs = state.jobs.filter(j => j.owner_id === user?.id);
  const ownerAwards = state.awards.filter(a => {
    const job = state.jobs.find(j => j.id === a.job_id);
    return job?.owner_id === user?.id;
  });

  const availableSkills = [
    'Tree Climbing',
    'Coconut Plucking',
    'Nut Gathering',
    'Nut Husking',
    'Fertilizer Trenching',
    'Organic Mulching',
    'Crown Cleaning',
    'Copra Bagging'
  ];

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estateId) return;

    store.createJob({
      estate_id: estateId,
      task_type: taskType,
      starts_at: startsAt,
      ends_at: endsAt,
      worker_count: parseInt(workerCount, 10),
      duration_days: parseInt(durationDays, 10),
      required_skills: skillsSelected,
      wage_budget: parseFloat(wageBudget),
      description
    });

    setIsPostJobOpen(false);
    setDescription('');
  };

  const handleAwardBid = (bidId: string) => {
    const res = store.awardBid(bidId);
    if (res.success && res.award) {
      setSelectedJobForBids(null);
      setSelectedAwardForEscrow(res.award);
    }
  };

  const handleDepositEscrow = (awardId: string) => {
    store.payEscrow(awardId);
    setSelectedAwardForEscrow(null);
  };

  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(null);
    if (!selectedJobForCompletion) return;

    const res = store.confirmCompletion(
      selectedJobForCompletion.id,
      pinInput,
      {
        score: ratingScore,
        review_tags: selectedTags,
        comment: ratingComment
      }
    );

    if (res.success) {
      setSelectedJobForCompletion(null);
    } else {
      setConfirmError(res.error || 'Failed to confirm completion.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Landowner Operations Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-xs font-semibold border border-emerald-800">
              Verified Landowner
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-white">{user?.name}</strong> • Kurunegala Coconut Belt • Escrow Protection Active
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
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
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'jobs' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Posted Jobs ({ownerJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lands')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'lands' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trees className="w-4 h-4" />
          <span>{t.my_lands} ({ownerEstates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('escrow')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'escrow' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Escrow Accounts & Awards ({ownerAwards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'attendance' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>Dual Attendance Check</span>
        </button>
      </div>

      {/* Tab 1: Posted Jobs */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ownerJobs.map((job) => {
              const bids = state.bids.filter(b => b.job_id === job.id);
              const award = state.awards.find(a => a.job_id === job.id);
              const completion = state.completions.find(c => c.job_id === job.id);

              return (
                <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          job.status === 'OPEN' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          job.status === 'AWARDED_PENDING_FEE' ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse' :
                          job.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          job.status === 'IN_PROGRESS' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          job.status === 'PENDING_COMPLETION' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800 font-bold' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                        <h3 className="text-base font-bold text-white mt-2">{job.task_type}</h3>
                        <p className="text-xs text-slate-400 flex items-center mt-1">
                          <Trees className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                          <span>{job.estate_name} ({job.estate_location})</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Budget</div>
                        <div className="text-sm font-bold text-emerald-400">LKR {job.wage_budget.toLocaleString()}</div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-300 line-clamp-2">
                      {job.description || 'No additional description provided.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {job.required_skills.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>Dates: <span className="text-slate-200">{job.starts_at} → {job.ends_at}</span></div>
                      <div>Crew Size: <span className="text-slate-200">{job.worker_count} Workers</span></div>
                    </div>
                  </div>

                  {/* Actions depending on status */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    {job.status === 'OPEN' && (
                      <>
                        <span className="text-xs text-slate-400">
                          <strong>{bids.length}</strong> Bids Received
                        </span>
                        <button
                          onClick={() => setSelectedJobForBids(job)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                        >
                          Review Bids ({bids.length}) →
                        </button>
                      </>
                    )}

                    {job.status === 'AWARDED_PENDING_FEE' && award && (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-amber-300 font-medium flex items-center space-x-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Escrow Deposit Required</span>
                        </span>
                        <button
                          onClick={() => setSelectedAwardForEscrow(award)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md animate-pulse"
                        >
                          Pay into Escrow (LKR {award.escrow_amount.toLocaleString()}) →
                        </button>
                      </div>
                    )}

                    {['ACTIVE', 'IN_PROGRESS'].includes(job.status) && award && (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Escrow Held (Secured)</span>
                        </span>
                        <button
                          onClick={() => setViewContactsAwardId(award.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-800 text-xs font-medium flex items-center space-x-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>View Direct Contacts</span>
                        </button>
                      </div>
                    )}

                    {job.status === 'PENDING_COMPLETION' && (
                      <div className="w-full flex items-center justify-between bg-yellow-950/40 p-2 rounded-xl border border-yellow-800/80">
                        <span className="text-xs text-yellow-300 font-medium">
                          Supervisor submitted completion & wages
                        </span>
                        <button
                          onClick={() => setSelectedJobForCompletion(job)}
                          className="px-3 py-1.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold shadow-md"
                        >
                          Verify & Release Escrow →
                        </button>
                      </div>
                    )}

                    {job.status === 'COMPLETED' && (
                      <div className="w-full flex items-center justify-between text-xs text-emerald-400">
                        <span className="flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Job Completed & Escrow Released</span>
                        </span>
                        <span className="font-mono text-slate-400">Archived</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Land Management */}
      {activeTab === 'lands' && (
        <LandManagement 
          state={state} 
          currentLang={currentLang} 
          onSelectEstateForJob={(eId) => {
            setEstateId(eId);
            setIsPostJobOpen(true);
          }}
        />
      )}

      {/* Tab 3: Escrow Accounts & Awards */}
      {activeTab === 'escrow' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-base mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span>Coconnect Escrow & Contact Gating Engine</span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl">
              Strict Escrow Rule: Telephone numbers and contact details are completely encrypted and withheld until the landowner funds the verified holding escrow account. Funds are released to workers and supervisors only upon dual-confirmation PIN verification at job completion.
            </p>
          </div>

          <div className="space-y-3">
            {ownerAwards.map((award) => {
              const job = state.jobs.find(j => j.id === award.job_id);
              const isHeld = award.escrow_status === 'held';
              const isReleased = award.escrow_status === 'released';

              return (
                <div key={award.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isHeld ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        isReleased ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        Escrow: {award.escrow_status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">Award #{award.id}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2">{job?.task_type}</h4>
                    <p className="text-xs text-slate-400">Supervisor: <strong className="text-slate-200">{award.supervisor_name}</strong></p>
                    {award.fee_payment_ref && (
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">Ref: {award.fee_payment_ref}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Secured Amount</div>
                      <div className="text-base font-bold text-emerald-400">LKR {award.escrow_amount.toLocaleString()}</div>
                    </div>

                    {isHeld || isReleased ? (
                      <button
                        onClick={() => setViewContactsAwardId(award.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-xs font-semibold flex items-center space-x-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Released Contacts</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedAwardForEscrow(award)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
                      >
                        Pay into Escrow →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Dual Attendance Verification */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              <span>Daily Attendance Dual-Confirmation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Neither party can finalize attendance alone. Supervisor records field check-in, owner verifies on estate gate. Mismatches automatically open an exception record.
            </p>
          </div>

          <div className="space-y-4">
            {state.attendanceDays.map((day) => {
              const job = state.jobs.find(j => j.id === day.job_id);
              const entries = state.attendanceEntries.filter(e => e.attendance_day_id === day.id);
              const workers = state.workers;

              return (
                <div key={day.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-mono text-emerald-400">Date: {day.work_date}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{job?.task_type}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      day.status === 'reconciled' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      day.status === 'disputed' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {day.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {entries.filter(e => e.party === 'supervisor').map((supEntry) => {
                      const ownerEntry = entries.find(e => e.party === 'owner' && e.worker_id === supEntry.worker_id);

                      return (
                        <div key={supEntry.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                          <div>
                            <div className="font-semibold text-white">{supEntry.worker_name}</div>
                            <div className="text-[11px] text-slate-400">
                              Supervisor logged: <strong className="text-emerald-400">{supEntry.present ? 'Present' : 'Absent'}</strong>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {ownerEntry ? (
                              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]">
                                Owner verified: {ownerEntry.present ? '✅ Present' : '❌ Absent'}
                              </span>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    store.recordAttendanceEntry({
                                      attendance_day_id: day.id,
                                      worker_id: supEntry.worker_id,
                                      party: 'owner',
                                      present: true
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                                >
                                  Confirm Present
                                </button>
                                <button
                                  onClick={() => {
                                    store.recordAttendanceEntry({
                                      attendance_day_id: day.id,
                                      worker_id: supEntry.worker_id,
                                      party: 'owner',
                                      present: false
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
                                >
                                  Mark Absent
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Post New Job */}
      {isPostJobOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span>{t.post_job}</span>
              </div>
              <button 
                onClick={() => setIsPostJobOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Select Coconut Estate
                </label>
                <select
                  required
                  value={estateId}
                  onChange={(e) => setEstateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Choose land...</option>
                  {ownerEstates.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.area_acres} acres • {e.tree_count} trees) - {e.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Task Type
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Coconut Harvesting & Bunch Lowering">Coconut Harvesting & Bunch Lowering</option>
                  <option value="Fertilizer Ring Application & Mulching">Fertilizer Ring Application & Mulching</option>
                  <option value="Dry Frond Trimming & Crown Cleaning">Dry Frond Trimming & Crown Cleaning</option>
                  <option value="Nut Husking & Copra Drying Batch">Nut Husking & Copra Drying Batch</option>
                  <option value="Undergrowth Tractor Clearing">Undergrowth Tractor Clearing</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Crew Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={workerCount}
                    onChange={(e) => setWorkerCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Budget (LKR)
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={wageBudget}
                    onChange={(e) => setWageBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Required Agricultural Skills
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableSkills.map((sk) => {
                    const selected = skillsSelected.includes(sk);
                    return (
                      <button
                        type="button"
                        key={sk}
                        onClick={() => {
                          if (selected) {
                            setSkillsSelected(skillsSelected.filter(s => s !== sk));
                          } else {
                            setSkillsSelected([...skillsSelected, sk]);
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          selected 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-semibold' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {sk} {selected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Estate Work Instructions
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific requirements, palm height, equipment provided..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPostJobOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  Publish Job to Supervisors
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review Bids & Escrow Gate */}
      {selectedJobForBids && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Bids Received for {selectedJobForBids.task_type}</h3>
                <p className="text-xs text-slate-400">Budget: LKR {selectedJobForBids.wage_budget.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedJobForBids(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{t.contacts_hidden_notice}</span>
              </div>

              {state.bids.filter(b => b.job_id === selectedJobForBids.id).map((bid) => {
                const crewMembers = state.workers.filter(w => bid.crew_member_ids.includes(w.id));

                return (
                  <div key={bid.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{bid.supervisor_name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                            ⭐ {bid.supervisor_trust_score.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Phone: +94 71 ••• •••• (Protected by Escrow)</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Bid Total</div>
                        <div className="text-base font-bold text-emerald-400">LKR {bid.price.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">Includes LKR {bid.supervisor_fee.toLocaleString()} commission</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <div className="font-semibold text-slate-400 text-[11px] mb-1">
                        Crew Plan ({crewMembers.length} Workers):
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {crewMembers.map(w => (
                          <div key={w.id} className="flex items-center justify-between text-[11px] bg-slate-850 p-1.5 rounded">
                            <span>{w.name}</span>
                            <span className="text-amber-400">⭐ {w.rating.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-400 capitalize">
                        Payment: <strong>{bid.payment_schedule.replace('_', ' ')}</strong>
                      </span>
                      <button
                        onClick={() => handleAwardBid(bid.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
                      >
                        {t.award_job} →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Escrow Payment Simulation */}
      {selectedAwardForEscrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
              <CreditCard className="w-5 h-5" />
              <span>Deposit into Escrow Holding Account</span>
            </div>

            <p className="text-xs text-slate-300">
              You are funding the labour holding escrow for award #{selectedAwardForEscrow.id}. Your payment is held safely until you verify completion with your PIN.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Supervisor:</span>
                <strong className="text-white">{selectedAwardForEscrow.supervisor_name}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Gate:</span>
                <strong className="text-emerald-400">PayHere Sri Lanka / Direct Bank</strong>
              </div>
              <div className="flex justify-between text-slate-200 font-bold text-sm pt-2 border-t border-slate-800">
                <span>Total Escrow Deposit:</span>
                <span className="text-emerald-400">LKR {selectedAwardForEscrow.escrow_amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAwardForEscrow(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDepositEscrow(selectedAwardForEscrow.id)}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Deposit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Released Contacts (Section 5.2 Verification) */}
      {viewContactsAwardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
                <Unlock className="w-5 h-5" />
                <span>Contacts Released (Escrow Verified)</span>
              </div>
              <button onClick={() => setViewContactsAwardId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const res = store.getAwardContacts(viewContactsAwardId);
              if (!res.success || !res.contacts) {
                return (
                  <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl">
                    {res.error || 'Contacts locked'}
                  </div>
                );
              }
              const { supervisor_name, supervisor_phone, crew } = res.contacts;

              return (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider">Supervisor Contact</div>
                    <div className="text-sm font-bold text-white mt-1">{supervisor_name}</div>
                    <div className="text-emerald-400 font-mono text-sm mt-0.5 flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{supervisor_phone}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">Confirmed Crew Members:</div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {crew.map((w, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-white">{w.name}</div>
                            <div className="text-[11px] text-slate-500">{w.skills.join(', ')}</div>
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
              onClick={() => setViewContactsAwardId(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Dual-Confirmation with PIN & Rating */}
      {selectedJobForCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <FileCheck className="w-5 h-5 text-yellow-400" />
                <span>{t.confirm_completion}</span>
              </div>
              <button 
                onClick={() => setSelectedJobForCompletion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="p-6 space-y-4 overflow-y-auto">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs">
                Signing with your security PIN releases the funds held in escrow to the supervisor and worker accounts.
              </div>

              {confirmError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                  {confirmError}
                </div>
              )}

              {/* Wage summary */}
              {(() => {
                const comp = state.completions.find(c => c.job_id === selectedJobForCompletion.id);
                if (!comp) return null;

                return (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-300">Wages Distribution Summary:</div>
                    {comp.wage_records.map(r => (
                      <div key={r.worker_id} className="flex justify-between text-slate-400">
                        <span>{r.worker_name} ({r.days_worked} days)</span>
                        <span className="font-mono text-white">LKR {r.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-slate-400">
                      <span>Supervisor Commission</span>
                      <span className="font-mono text-white">LKR {comp.supervisor_fee.toLocaleString()}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                      <span>Total Escrow Release</span>
                      <span>LKR {(comp.total_wages + comp.supervisor_fee).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Security PIN verification */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  {t.enter_pin}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-center tracking-widest text-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Default demo PIN: 1234</p>
              </div>

              {/* Rating System (Requirement 7) */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Performance Rating (1 - 5 Stars)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRatingScore(s)}
                      className={`p-2 rounded-xl transition ${
                        s <= ratingScore ? 'text-amber-400 bg-amber-950/60 border border-amber-800' : 'text-slate-600 bg-slate-800'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-amber-400 ml-2">{ratingScore} / 5 Stars</span>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] text-slate-400 mb-1">Review Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Punctual Crew', 'Zero Nut Damage', 'Safe Tree Climbing', 'Clean Estate', 'Fast Harvest'].map(tag => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => {
                            if (active) setSelectedTags(selectedTags.filter(t => t !== tag));
                            else setSelectedTags([...selectedTags, tag]);
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border ${
                            active ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-slate-850 text-slate-400 border-slate-800'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] text-slate-400 mb-1">Review Feedback</label>
                  <textarea
                    rows={2}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedJobForCompletion(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Release Escrow & Submit Rating</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
