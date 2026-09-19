import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { Language, translations } from '../../lib/i18n';
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
  const t = translations[currentLang];
  const user = state.currentUser;
  const [activeTab, setActiveTab] = useState<'assignments' | 'attendance' | 'wages'>('assignments');

  // Find worker record matching current user's phone or name
  const workerRecord = state.workers.find(w => 
    w.phone.replace(/\s+/g, '') === user?.phone.replace(/\s+/g, '') ||
    w.name.toLowerCase() === user?.name.toLowerCase()
  ) || state.workers[0];

  // Find assignments across bids & awards
  const assignedJobs = state.jobs.filter(job => {
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
      job_task: job?.task_type || 'Agricultural Task',
      estate_name: job?.estate_name || 'Estate',
      submitted_at: comp.submitted_at,
      status: comp.status,
      escrow_status: award?.escrow_status || 'held'
    }));
  });

  const totalEarnedReleased = myWageRecords
    .filter(r => r.escrow_status === 'released')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalInEscrow = myWageRecords
    .filter(r => r.escrow_status === 'held')
    .reduce((sum, r) => sum + r.amount, 0);

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
                Dedicated Worker Account
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Phone: <strong className="text-slate-200 font-mono">{user?.phone}</strong> • NIC: <span className="font-mono text-slate-300">{workerRecord.nic_ref}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Worker Rating</div>
            <div className="text-lg font-bold text-amber-400 font-mono flex items-center justify-end space-x-1">
              <Star className="w-4 h-4 fill-current text-amber-400" />
              <span>{workerRecord.rating.toFixed(2)}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Jobs Completed</div>
            <div className="text-lg font-bold text-teal-400 font-mono">{workerRecord.jobs_completed}</div>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Total Wages Paid Out</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            LKR {totalEarnedReleased.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Disbursed to bank account</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Secured in Escrow</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            LKR {totalInEscrow.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Release on owner completion sign-off</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Assigned Harvest Jobs</div>
          <div className="text-2xl font-bold text-teal-400 mt-1">
            {assignedJobs.length} Jobs
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Under supervisor Kusal Mendis</div>
        </div>
      </div>

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
          <span>Assigned Jobs ({assignedJobs.length})</span>
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
          <span>Attendance Records ({myAttendanceEntries.length})</span>
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
          <span>Wage Receipts & Escrow</span>
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
                          {job.status.replace(/_/g, ' ')}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">{job.task_type}</h3>
                        <p className="text-xs text-slate-400 flex items-center mt-0.5">
                          <Trees className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                          <span>{job.estate_name} • {job.estate_location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Work Dates:</span>
                        <strong className="text-white">{job.starts_at} → {job.ends_at}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Supervisor:</span>
                        <span className="text-amber-400">{award?.supervisor_name}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Escrow State:</span>
                        <span className="text-emerald-400 font-semibold uppercase">{award?.escrow_status}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.required_skills.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Crew Member Confirmed</span>
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Funds Protected in Escrow</span>
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
            <h3 className="text-sm font-bold text-white mb-3">Field Check-In History</h3>
            <div className="space-y-2">
              {myAttendanceEntries.map((entry) => {
                const day = state.attendanceDays.find(d => d.id === entry.attendance_day_id);
                const job = state.jobs.find(j => j.id === day?.job_id);

                return (
                  <div key={entry.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{job?.task_type}</div>
                      <div className="text-[11px] text-slate-400">
                        Date: <span className="font-mono text-slate-300">{day?.work_date}</span> • Recorded by {entry.party}
                      </div>
                      {entry.notes && (
                        <p className="text-[11px] text-slate-500 mt-1">{entry.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        entry.present ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {entry.present ? 'Present' : 'Absent'}
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
            <h3 className="text-sm font-bold text-white mb-3">Completed Job Wage Distribution Records</h3>
            
            <div className="space-y-3">
              {myWageRecords.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="text-sm font-bold text-white">{r.job_task}</h4>
                    <p className="text-slate-400">{r.estate_name}</p>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Calculation: {r.days_worked} days @ LKR {r.daily_rate.toLocaleString()} / day
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Net Wage</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        LKR {r.amount.toLocaleString()}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase ${
                      r.escrow_status === 'released' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {r.escrow_status === 'released' ? 'Disbursed' : 'In Escrow'}
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
