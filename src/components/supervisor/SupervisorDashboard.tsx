import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { Worker, LabourJob, WageRecord } from '../../types';
import {
  Language,
  getT,
  fmt,
  tJobStatus,
  tReviewStatus,
  tConsent,
  tSkill,
  tTaskType,
  SKILL_KEYS,
} from '../../lib/i18n';
import { 
  HardHat, 
  Users, 
  PlusCircle, 
  Briefcase, 
  CheckCircle, 
  Check, 
  Clock, 
  Phone, 
  Send, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  WifiOff, 
  FileText, 
  Camera, 
  Star,
  X,
  UserCheck
} from 'lucide-react';

interface SupervisorDashboardProps {
  state: AppState;
  currentLang: Language;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  state,
  currentLang,
}) => {
  const t = getT(currentLang);
  const user = state.currentUser;
  const [activeTab, setActiveTab] = useState<'roster' | 'marketplace' | 'attendance' | 'completions'>('roster');
  
  // Modals
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [selectedJobForBid, setSelectedJobForBid] = useState<LabourJob | null>(null);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<LabourJob | null>(null);
  
  // New Worker Form
  const [wName, setWName] = useState('');
  const [wPhone, setWPhone] = useState('+94 7');
  const [wNic, setWNic] = useState('199');
  const [wBank, setWBank] = useState('BOC 889922');
  const [wConsent, setWConsent] = useState<'sms' | 'written' | 'verbal_recorded'>('sms');
  const [wSkills, setWSkills] = useState<string[]>(['Tree Climbing', 'Coconut Plucking']);

  // Bid Submission Form
  const [bidPrice, setBidPrice] = useState('45000');
  const [supervisorFee, setSupervisorFee] = useState('4500');
  const [paymentSchedule, setPaymentSchedule] = useState<'daily' | 'lump_sum'>('daily');
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);

  // Attendance Form
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [attendanceWorkerId, setAttendanceWorkerId] = useState<string>('');
  const [attendancePresent, setAttendancePresent] = useState<boolean>(true);
  const [attendanceNotes, setAttendanceNotes] = useState<string>(t.attendance_notes_default);

  // Completion Form
  const [wageInputs, setWageInputs] = useState<{ [workerId: string]: { days: number; rate: number } }>({});
  const [completionNotes, setCompletionNotes] = useState(t.completion_notes_default);

  const supervisorWorkers = state.workers.filter(w => w.supervisor_id === user?.id);
  const openJobs = state.jobs.filter(j => j.status === 'OPEN');
  const supervisorAwards = state.awards.filter(a => a.supervisor_id === user?.id);
  const activeJobs = state.jobs.filter(j => 
    supervisorAwards.some(a => a.job_id === j.id) && ['ACTIVE', 'IN_PROGRESS', 'PENDING_COMPLETION'].includes(j.status)
  );

  const availableSkillsList = SKILL_KEYS;

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wName || !wPhone || !wNic) return;

    store.addWorker({
      name: wName,
      phone: wPhone,
      skills: wSkills,
      nic_ref: wNic,
      bank_ref: wBank,
      consent_method: wConsent
    });

    setIsAddWorkerOpen(false);
    setWName('');
    setWPhone('+94 7');
  };

  const handleOpenBidModal = (job: LabourJob) => {
    setSelectedJobForBid(job);
    setBidPrice(job.wage_budget.toString());
    setSupervisorFee(Math.round(job.wage_budget * 0.10).toString());
    // Auto-select available workers matching skills
    const matching = supervisorWorkers.slice(0, job.worker_count).map(w => w.id);
    setSelectedCrewIds(matching);
    setBidError(null);
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    if (!selectedJobForBid) return;

    if (selectedCrewIds.length < selectedJobForBid.worker_count) {
      setBidError(fmt(t.err_min_crew, { n: selectedJobForBid.worker_count }));
      return;
    }

    const res = store.submitBid({
      job_id: selectedJobForBid.id,
      price: parseFloat(bidPrice),
      supervisor_fee: parseFloat(supervisorFee),
      payment_schedule: paymentSchedule,
      crew_member_ids: selectedCrewIds
    });

    if (res.success) {
      setBidSuccess(fmt(t.bid_success, {
        price: parseFloat(bidPrice).toLocaleString(),
        task: tTaskType(selectedJobForBid.task_type, currentLang),
      }));
      setSelectedJobForBid(null);
      setTimeout(() => setBidSuccess(null), 5000);
    } else {
      setBidError(res.error || t.err_bid_failed);
    }
  };

  const handleRecordAttendance = (dayId: string, workerId: string, present: boolean) => {
    store.recordAttendanceEntry({
      attendance_day_id: dayId,
      worker_id: workerId,
      party: 'supervisor',
      present,
      evidence_blob_ref: 'blob://photos/field_checkin_' + Date.now() + '.jpg',
      notes: attendanceNotes
    });
  };

  const handleOpenCompletionModal = (job: LabourJob) => {
    setSelectedJobForCompletion(job);
    const award = supervisorAwards.find(a => a.job_id === job.id);
    const bid = state.bids.find(b => b.id === award?.bid_id);
    const crew = supervisorWorkers.filter(w => bid?.crew_member_ids.includes(w.id));

    const initialWages: { [id: string]: { days: number; rate: number } } = {};
    const defaultDailyRate = Math.round((job.wage_budget * 0.85) / (job.worker_count * job.duration_days));
    crew.forEach(w => {
      initialWages[w.id] = { days: job.duration_days, rate: defaultDailyRate };
    });
    setWageInputs(initialWages);
  };

  const handleSubmitCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForCompletion) return;

    const award = supervisorAwards.find(a => a.job_id === selectedJobForCompletion.id);
    const bid = state.bids.find(b => b.id === award?.bid_id);
    const crew = supervisorWorkers.filter(w => bid?.crew_member_ids.includes(w.id));

    const wageRecords: WageRecord[] = crew.map(w => {
      const entry = wageInputs[w.id] || { days: 2, rate: 4500 };
      return {
        worker_id: w.id,
        worker_name: w.name,
        days_worked: entry.days,
        daily_rate: entry.rate,
        amount: entry.days * entry.rate,
        currency: 'LKR'
      };
    });

    const fee = bid ? bid.supervisor_fee : 4000;
    store.submitCompletion(selectedJobForCompletion.id, wageRecords, fee, completionNotes);
    setSelectedJobForCompletion(null);
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
      <div className="border-b border-slate-800 flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'roster' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.tab_crew_roster} ({supervisorWorkers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'marketplace' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t.tab_open_jobs} ({openJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'attendance' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-teal-400" />
          <span>{t.tab_daily_checkin}</span>
        </button>

        <button
          onClick={() => setActiveTab('completions')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'completions' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>{t.tab_active_contracts} ({activeJobs.length})</span>
        </button>
      </div>

      {/* Tab 1: Crew Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisorWorkers.map((w) => {
              return (
                <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 font-bold flex items-center justify-center">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{w.name}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">{w.phone}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        ⭐ {w.rating.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-400 space-y-1">
                      <div>{t.roster_nic}: <span className="text-slate-200 font-mono">{w.nic_ref}</span></div>
                      <div>{t.roster_bank}: <span className="text-slate-200">{w.bank_ref || t.roster_cash_on_site}</span></div>
                      <div className="flex items-center space-x-1.5 pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-medium">
                          {t.roster_consent}: {tConsent(w.consent_method, currentLang)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {t.common_jobs}: {w.jobs_completed}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {w.skills.map((sk, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {tSkill(sk, currentLang)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.roster_confirmed}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Marketplace & Bidding */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {openJobs.map((job) => {
              const myBid = state.bids.find(b => b.job_id === job.id && b.supervisor_id === user?.id);

              return (
                <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                          {t.open_for_bids}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">{tTaskType(job.task_type, currentLang)}</h3>
                        <p className="text-xs text-slate-400">{job.estate_name} • {job.estate_location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">{t.owner_budget}</div>
                        <div className="text-sm font-bold text-emerald-400">LKR {job.wage_budget.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs grid grid-cols-2 gap-2 text-slate-400">
                      <div>{t.start_date}: <strong className="text-white">{job.starts_at}</strong></div>
                      <div>{t.end_date}: <strong className="text-white">{job.ends_at}</strong></div>
                      <div>{t.required_crew}: <strong className="text-white">{job.worker_count} {t.common_workers}</strong></div>
                      <div>{t.duration_label}: <strong className="text-white">{job.duration_days} {t.common_days}</strong></div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.required_skills.map((sk, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {tSkill(sk, currentLang)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    {myBid ? (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-amber-300 font-medium">
                          {t.your_bid}: LKR {myBid.price.toLocaleString()} ({tReviewStatus(myBid.status, currentLang)})
                        </span>
                        <span className="text-[11px] text-slate-400">{myBid.crew_member_ids.length} {t.crew_selected}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenBidModal(job)}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition flex items-center justify-center space-x-1.5"
                      >
                        <Send className="w-4 h-4" />
                        <span>{t.submit_crew_bid_arrow}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Daily Attendance & Offline Outbox */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <span>{t.attendance_checkin_title}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t.attendance_checkin_desc}
              </p>
            </div>

            {state.isOfflineSimulated && (
              <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
                <WifiOff className="w-4 h-4" />
                <span>{fmt(t.offline_outbox_active, { n: state.offlineQueue.length })}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {state.attendanceDays.map((day) => {
              const job = state.jobs.find(j => j.id === day.job_id);
              const entries = state.attendanceEntries.filter(e => e.attendance_day_id === day.id);

              return (
                <div key={day.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-mono text-amber-400">{t.work_date}: {day.work_date}</div>
                      <h4 className="text-sm font-bold text-white mt-0.5">{tTaskType(job?.task_type, currentLang)}</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      {t.day_label} #{day.id}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-400">{t.crew_attendance_records}</div>
                    {supervisorWorkers.map((worker) => {
                      const supEntry = entries.find(e => e.worker_id === worker.id && e.party === 'supervisor');

                      return (
                        <div key={worker.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                          <div>
                            <div className="font-semibold text-white">{worker.name}</div>
                            <div className="text-[11px] text-slate-400">{worker.skills.slice(0, 2).map((sk) => tSkill(sk, currentLang)).join(', ')}</div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {supEntry ? (
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-[11px] font-medium ${
                                  supEntry.present ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}>
                                  {supEntry.present ? t.marked_present : t.marked_absent}
                                </span>
                                {supEntry.sync_status === 'pending_offline' && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-800">
                                    {t.queued_outbox}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => handleRecordAttendance(day.id, worker.id, true)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center space-x-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{t.common_present}</span>
                                </button>
                                <button
                                  onClick={() => handleRecordAttendance(day.id, worker.id, false)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
                                >
                                  {t.common_absent}
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

      {/* Tab 4: Active Contracts & Completion */}
      {activeTab === 'completions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeJobs.map((job) => {
              const award = supervisorAwards.find(a => a.job_id === job.id);
              const comp = state.completions.find(c => c.job_id === job.id);

              return (
                <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                          {tJobStatus(job.status, currentLang)}
                        </span>
                        <h3 className="text-base font-bold text-white mt-2">{tTaskType(job.task_type, currentLang)}</h3>
                        <p className="text-xs text-slate-400">{job.estate_name} • {job.estate_location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">{t.escrow_held_label}</div>
                        <div className="text-sm font-bold text-amber-400 font-mono">
                          LKR {award?.escrow_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>{t.landowner_label}:</span>
                        <strong className="text-white">{job.owner_name}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>{t.work_dates}:</span>
                        <span className="text-slate-200">{job.starts_at} to {job.ends_at}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800">
                    {comp ? (
                      <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-800 text-yellow-300 text-xs">
                        {fmt(t.wages_submitted_await, { amount: (comp.total_wages + comp.supervisor_fee).toLocaleString() })}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenCompletionModal(job)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center space-x-1.5"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>{t.submit_wages_completion}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Submit Bid with Overlap Prevention */}
      {selectedJobForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{t.submit_bid}</h3>
                <p className="text-xs text-slate-400">{tTaskType(selectedJobForBid.task_type, currentLang)} • {t.job_budget}: LKR {selectedJobForBid.wage_budget.toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedJobForBid(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="p-6 space-y-4 overflow-y-auto">
              {bidError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{bidError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t.total_bid_price}
                  </label>
                  <input
                    type="number"
                    required
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t.supervisor_commission_lkr}
                  </label>
                  <input
                    type="number"
                    required
                    value={supervisorFee}
                    onChange={(e) => setSupervisorFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  {t.payment_schedule_label}
                </label>
                <select
                  value={paymentSchedule}
                  onChange={(e) => setPaymentSchedule(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                >
                  <option value="daily">{t.sched_daily}</option>
                  <option value="lump_sum">{t.sched_lump}</option>
                </select>
              </div>

              {/* Crew Plan Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {t.select_crew_plan} ({selectedCrewIds.length} / {selectedJobForBid.worker_count} {t.common_required})
                  </label>
                  <span className="text-[11px] text-slate-500">{t.overlap_guarded}</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {supervisorWorkers.map((w) => {
                    const isSelected = selectedCrewIds.includes(w.id);

                    return (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCrewIds(selectedCrewIds.filter(id => id !== w.id));
                          } else {
                            setSelectedCrewIds([...selectedCrewIds, w.id]);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                          isSelected 
                            ? 'bg-amber-950/60 border-amber-600 text-amber-200 font-semibold' 
                            : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div>{w.name}</div>
                          <div className="text-[10px] text-slate-400">{w.skills.slice(0, 2).map((sk) => tSkill(sk, currentLang)).join(', ')}</div>
                        </div>
                        <span className="text-amber-400">
                          {isSelected ? t.selected_check : t.add_to_crew}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedJobForBid(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 bg-slate-800"
                >
                  {t.common_cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md"
                >
                  {t.submit_official_bid}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Worker to Roster with Consent */}
      {isAddWorkerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span>{t.add_worker}</span>
              </div>
              <button onClick={() => setIsAddWorkerOpen(false)} className="text-slate-400 hover:text-white">
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
                  onClick={() => setIsAddWorkerOpen(false)}
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
      )}

      {/* Modal: Submit Completion & Wages */}
      {selectedJobForCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>{t.completion_modal_title}</span>
              </div>
              <button onClick={() => setSelectedJobForCompletion(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion} className="space-y-3">
              <div className="text-xs text-slate-400">
                {t.completion_desc}
              </div>

              <div className="space-y-2">
                {Object.keys(wageInputs).map((wid) => {
                  const worker = state.workers.find(w => w.id === wid);
                  const current = wageInputs[wid];

                  return (
                    <div key={wid} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 items-center text-xs">
                      <div className="font-semibold text-white">{worker?.name}</div>
                      <div>
                        <span className="text-[10px] text-slate-400">{t.days_label}</span>
                        <input
                          type="number"
                          min="1"
                          value={current.days}
                          onChange={(e) => {
                            setWageInputs({
                              ...wageInputs,
                              [wid]: { ...current, days: parseInt(e.target.value, 10) || 1 }
                            });
                          }}
                          className="w-full px-2 py-1 bg-slate-800 rounded border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">{t.rate_label}</span>
                        <input
                          type="number"
                          step="100"
                          value={current.rate}
                          onChange={(e) => {
                            setWageInputs({
                              ...wageInputs,
                              [wid]: { ...current, rate: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="w-full px-2 py-1 bg-slate-800 rounded border border-slate-700 text-white font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.completion_notes}</label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedJobForCompletion(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 bg-slate-800"
                >
                  {t.common_cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  {t.send_to_owner}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
