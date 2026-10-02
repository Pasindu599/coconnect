import React, { useState } from 'react';
import { useCategory, useT } from '../../config/CategoryContext';
import { CategoryIcon } from '../../config/CategoryIcon';
import { categoryOf } from '../../config/categories';
import { WorkerPayoutCard } from './WorkerPayoutCard';
import { Worker } from '../../types';
import { store, AppState } from '../../lib/store';
import { Language, tJobStatus, tEscrowStatus, tSkill, tTaskType, tParty } from '../../lib/i18n';
import { 
  UserCheck, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Trees, 
  HardHat, 
  ShieldCheck, 
  Star, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface WorkerDashboardProps {
  state: AppState;
  currentLang: Language;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  state,
  currentLang,
}) => {
  const t = useT(currentLang);
  const { category } = useCategory();
  const user = state.currentUser;
  const [activeTab, setActiveTab] = useState<'assignments' | 'attendance' | 'wages'>('assignments');

  // The worker record a contractor/broker registered for this user in the active category.
  // A worker nobody has registered yet sees an empty dashboard, never someone else's data.
  const noWorkerRecord: Worker = {
    id: 'no-worker-record',
    supervisor_id: '',
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    skills: [],
    nic_ref: '',
    consent_captured_at: '',
    consent_method: 'sms',
    rating: 0,
    jobs_completed: 0,
    active: true,
  };
  const workerRecord = state.workers.find(w =>
    categoryOf(w) === category.id && (
      w.phone.replace(/\s+/g, '') === user?.phone.replace(/\s+/g, '') ||
      w.name.toLowerCase() === user?.name.toLowerCase()
    )
  ) ?? noWorkerRecord;

  // Find assignments across bids & awards
  const assignedJobs = state.jobs.filter(job => {
    if (categoryOf(job) !== category.id) return false;
    const award = state.awards.find(a => a.job_id === job.id);
    if (!award) return false;
    const bid = state.bids.find(b => b.id === award.bid_id);
    return bid?.crew_member_ids.includes(workerRecord.id);
  });

  // Attendance entries for this worker
  const myAttendanceEntries = state.attendanceEntries.filter(e => e.worker_id === workerRecord.id);

  // Wage earnings from completions
  const myWageRecords = state.completions.flatMap(comp => {
    const job = state.jobs.find(j => j.id === comp.job_id);
    const award = state.awards.find(a => a.job_id === comp.job_id);
    const records = comp.wage_records.filter(r => r.worker_id === workerRecord.id);
    return records.map(r => ({
      ...r,
      job_id: comp.job_id,
      job_task: job?.task_type || t.default_task,
      estate_name: job?.estate_name || t.default_estate,
      submitted_at: comp.submitted_at,
      status: comp.status,
      escrow_status: award?.escrow_status || 'held'
    }));
  });

  const totalEarnedReleased = myWageRecords
    .filter(r => r.escrow_status === 'released')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalInEscrow = myWageRecords
    .filter(r => r.escrow_status === 'held' || r.escrow_status === 'release_requested')
    .reduce((sum, r) => sum + r.amount, 0);

  const supervisorName =
    state.users.find(u => u.id === workerRecord.supervisor_id)?.name || '—';

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-950 border border-teal-800 text-teal-300 flex items-center justify-center font-bold text-2xl">
            {user?.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{user?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 text-xs font-semibold border border-teal-800">
                {t.worker_badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.worker_phone_label}: <strong className="text-slate-200 font-mono">{user?.phone}</strong> • {t.roster_nic}: <span className="font-mono text-slate-300">{workerRecord.nic_ref}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">{t.worker_rating}</div>
            <div className="text-lg font-bold text-amber-400 font-mono flex items-center justify-end space-x-1">
              <Star className="w-4 h-4 fill-current text-amber-400" />
              <span>{workerRecord.rating.toFixed(2)}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">{t.jobs_completed}</div>
            <div className="text-lg font-bold text-teal-400 font-mono">{workerRecord.jobs_completed}</div>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">{t.total_wages_paid}</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            LKR {totalEarnedReleased.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{t.disbursed_note}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">{t.secured_in_escrow}</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            LKR {totalInEscrow.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{t.release_on_signoff}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">{t.assigned_harvest_jobs}</div>
          <div className="text-2xl font-bold text-teal-400 mt-1">
            {assignedJobs.length} {t.jobs_suffix}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {t.under_supervisor}: {supervisorName}
          </div>
        </div>
      </div>

      {workerRecord.id !== 'no-worker-record' && <WorkerPayoutCard currentLang={currentLang} worker={workerRecord} />}

      {/* Tabs */}
      <div className="border-b border-slate-800 flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'assignments' 
              ? 'border-teal-500 text-teal-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t.tab_assigned_jobs} ({assignedJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'attendance' 
              ? 'border-teal-500 text-teal-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.tab_attendance_records} ({myAttendanceEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wages')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'wages' 
              ? 'border-teal-500 text-teal-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{t.tab_wage_receipts}</span>
        </button>
      </div>

      {/* Tab 1: Assigned Jobs */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assignedJobs.map((job) => {
              const award = state.awards.find(a => a.job_id === job.id);

              return (
                <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          job.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          job.status === 'IN_PROGRESS' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {tJobStatus(job.status, currentLang)}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">{tTaskType(job.task_type, currentLang)}</h3>
                        <p className="text-xs text-slate-400 flex items-center mt-0.5">
                          <CategoryIcon icon={category.icon} className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                          <span>{job.estate_name} • {job.estate_location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>{t.work_dates}:</span>
                        <strong className="text-white">{job.starts_at} → {job.ends_at}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>{t.supervisor_label}:</span>
                        <span className="text-amber-400">{award?.supervisor_name}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>{t.escrow_state}:</span>
                        <span className="text-emerald-400 font-semibold">{tEscrowStatus(award?.escrow_status, currentLang)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.required_skills.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tSkill(s, currentLang)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>{t.crew_member_confirmed}</span>
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t.funds_protected}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">{t.checkin_history}</h3>
            <div className="space-y-2">
              {myAttendanceEntries.map((entry) => {
                const day = state.attendanceDays.find(d => d.id === entry.attendance_day_id);
                const job = state.jobs.find(j => j.id === day?.job_id);

                return (
                  <div key={entry.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{tTaskType(job?.task_type, currentLang)}</div>
                      <div className="text-[11px] text-slate-400">
                        {t.work_date}: <span className="font-mono text-slate-300">{day?.work_date}</span> • {t.recorded_by} {tParty(entry.party, currentLang)}
                      </div>
                      {entry.notes && (
                        <p className="text-[11px] text-slate-500 mt-1">{entry.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        entry.present ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {entry.present ? t.common_present : t.common_absent}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Wages & Escrow Receipts */}
      {activeTab === 'wages' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">{t.wage_distribution_records}</h3>
            
            <div className="space-y-3">
              {myWageRecords.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="text-sm font-bold text-white">{tTaskType(r.job_task, currentLang)}</h4>
                    <p className="text-slate-400">{r.estate_name}</p>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {t.calculation_label}: {r.days_worked} {t.common_days} @ LKR {r.daily_rate.toLocaleString()} {t.per_day}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">{t.net_wage}</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        LKR {r.amount.toLocaleString()}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      r.escrow_status === 'released' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {r.escrow_status === 'released' ? t.disbursed : t.in_escrow}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
