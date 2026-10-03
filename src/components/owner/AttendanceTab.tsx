import React from 'react';
import { store, AppState } from '../../lib/store';
import { LabourJob } from '../../types';
import { Language, tReviewStatus, tTaskType } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { CheckCircle2 } from 'lucide-react';

interface AttendanceTabProps {
  state: AppState;
  currentLang: Language;
  /** The signed-in owner's jobs in the active category. */
  jobs: LabourJob[];
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ state, currentLang, jobs }) => {
  const t = useT(currentLang);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          <span>{t.attendance_dual_title}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t.attendance_dual_desc}
        </p>
      </div>

      <div className="space-y-4">
        {state.attendanceDays.filter(day => jobs.some(j => j.id === day.job_id)).map((day) => {
          const job = state.jobs.find(j => j.id === day.job_id);
          const entries = state.attendanceEntries.filter(e => e.attendance_day_id === day.id);
          const workers = state.workers;

          return (
            <div key={day.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-emerald-400">{t.work_date}: {day.work_date}</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{tTaskType(job?.task_type, currentLang)}</h4>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  day.status === 'reconciled' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  day.status === 'disputed' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {tReviewStatus(day.status, currentLang)}
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
                          {t.supervisor_logged}: <strong className="text-emerald-400">{supEntry.present ? t.common_present : t.common_absent}</strong>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {ownerEntry ? (
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {t.owner_verified_label}: {ownerEntry.present ? `✅ ${t.common_present}` : `❌ ${t.common_absent}`}
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
                              {t.confirm_present}
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
                              {t.mark_absent}
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
  );
};
