import React from 'react';
import { store, AppState } from '../../lib/store';
import { Worker, LabourJob } from '../../types';
import { Language, fmt, tSkill, tTaskType } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { Check, Clock, WifiOff } from 'lucide-react';

interface FieldAttendanceTabProps {
  state: AppState;
  currentLang: Language;
  workers: Worker[];
  /** Jobs awarded to this supervisor in the active category; only their days are listed. */
  jobs: LabourJob[];
}

export const FieldAttendanceTab: React.FC<FieldAttendanceTabProps> = ({ state, currentLang, workers, jobs }) => {
  const t = useT(currentLang);
  const handleRecordAttendance = (dayId: string, workerId: string, present: boolean) => {
    store.recordAttendanceEntry({
      attendance_day_id: dayId,
      worker_id: workerId,
      party: 'supervisor',
      present,
      evidence_blob_ref: 'blob://photos/field_checkin_' + Date.now() + '.jpg',
      notes: t.attendance_notes_default
    });
  };

  return (
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
        {state.attendanceDays.filter(day => jobs.some(j => j.id === day.job_id)).map((day) => {
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
                {workers.map((worker) => {
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
  );
};
