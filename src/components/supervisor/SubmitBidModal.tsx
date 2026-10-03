import React, { useState } from 'react';
import { formatMoney } from '../../lib/money';
import { store } from '../../lib/store';
import { LabourJob, Worker } from '../../types';
import { Language, fmt, tSkill, tTaskType } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { AlertCircle, X } from 'lucide-react';

interface SubmitBidModalProps {
  currentLang: Language;
  job: LabourJob;
  /** The supervisor's roster in the active category. */
  workers: Worker[];
  onClose: () => void;
  /** Called with the success message after the bid is stored. */
  onSubmitted: (message: string) => void;
}

export const SubmitBidModal: React.FC<SubmitBidModalProps> = ({ currentLang, job, workers, onClose, onSubmitted }) => {
  const t = useT(currentLang);
  const [bidPrice, setBidPrice] = useState(job.wage_budget.toString());
  const [supervisorFee, setSupervisorFee] = useState(Math.round(job.wage_budget * 0.10).toString());
  const [paymentSchedule, setPaymentSchedule] = useState<'daily' | 'lump_sum'>('daily');
  // Pre-select the first workers on the roster to fill the crew
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>(
    workers.slice(0, job.worker_count).map(w => w.id)
  );
  const [bidError, setBidError] = useState<string | null>(null);

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);

    if (selectedCrewIds.length < job.worker_count) {
      setBidError(fmt(t.err_min_crew, { n: job.worker_count }));
      return;
    }

    const res = store.submitBid({
      job_id: job.id,
      price: parseFloat(bidPrice),
      supervisor_fee: parseFloat(supervisorFee),
      payment_schedule: paymentSchedule,
      crew_member_ids: selectedCrewIds
    });

    if (res.success) {
      onSubmitted(fmt(t.bid_success, {
        price: parseFloat(bidPrice).toLocaleString(),
        task: tTaskType(job.task_type, currentLang),
      }));
      onClose();
    } else {
      setBidError(res.error || t.err_bid_failed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">{t.submit_bid}</h3>
            <p className="text-xs text-slate-400">{tTaskType(job.task_type, currentLang)} • {t.job_budget}: {formatMoney(job.wage_budget, currentLang)}</p>
          </div>
          <button onClick={() => onClose()} className="text-slate-400 hover:text-white">
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
                {t.select_crew_plan} ({selectedCrewIds.length} / {job.worker_count} {t.common_required})
              </label>
              <span className="text-[11px] text-slate-500">{t.overlap_guarded}</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {workers.map((w) => {
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
              onClick={() => onClose()}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 bg-slate-800"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              data-testid="submit-bid"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md"
            >
              {t.submit_official_bid}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
