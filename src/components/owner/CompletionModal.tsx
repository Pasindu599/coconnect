import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { LabourJob } from '../../types';
import { Language, tReviewTag } from '../../lib/i18n';
import { useCategory, useT } from '../../config/CategoryContext';
import { ShieldCheck, Star, Key, X, FileCheck } from 'lucide-react';

interface CompletionModalProps {
  state: AppState;
  currentLang: Language;
  job: LabourJob;
  onClose: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({ state, currentLang, job, onClose }) => {
  const t = useT(currentLang);
  const { category } = useCategory();
  const [pinInput, setPinInput] = useState('1234');
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState(t.rating_comment_default);
  const [selectedTags, setSelectedTags] = useState<string[]>(category.defaults.ratingTags);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(null);

    const res = store.confirmCompletion(
      job.id,
      pinInput,
      {
        score: ratingScore,
        review_tags: selectedTags,
        comment: ratingComment
      }
    );

    if (res.success) {
      onClose();
    } else {
      setConfirmError(res.error || t.err_confirm_failed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <FileCheck className="w-5 h-5 text-yellow-400" />
            <span>{t.confirm_completion}</span>
          </div>
          <button 
            onClick={() => onClose()}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmCompletion} className="p-6 space-y-4 overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs">
            {t.completion_pin_note}
          </div>

          {confirmError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
              {confirmError}
            </div>
          )}

          {/* Wage summary */}
          {(() => {
            const comp = state.completions.find(c => c.job_id === job.id);
            if (!comp) return null;

            return (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-300">{t.wages_distribution}</div>
                {comp.wage_records.map(r => (
                  <div key={r.worker_id} className="flex justify-between text-slate-400">
                    <span>{r.worker_name} ({r.days_worked} {t.common_days})</span>
                    <span className="font-mono text-white">LKR {r.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-slate-400">
                  <span>{t.supervisor_commission}</span>
                  <span className="font-mono text-white">LKR {comp.supervisor_fee.toLocaleString()}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                  <span>{t.total_escrow_release}</span>
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
            <p className="text-[11px] text-slate-500 mt-1">{t.demo_pin_note}</p>
          </div>

          {/* Rating System (Requirement 7) */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t.performance_rating_label}
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
              <span className="text-sm font-bold text-amber-400 ml-2">{ratingScore} / 5 {t.common_stars}</span>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] text-slate-400 mb-1">{t.review_tags_label}</label>
              <div className="flex flex-wrap gap-1.5">
                {category.ratingTags.map(tag => {
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
                      {tReviewTag(tag, currentLang)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] text-slate-400 mb-1">{t.review_feedback_label}</label>
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
              onClick={() => onClose()}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.release_submit_rating}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
