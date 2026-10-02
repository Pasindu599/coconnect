import React, { useState } from 'react';
import { store } from '../../lib/store';
import { Estate } from '../../types';
import { Language, tSkill, tTaskType } from '../../lib/i18n';
import { useCategory, useT } from '../../config/CategoryContext';
import { formatSiteSummary } from '../../config/categories';
import { Briefcase, X } from 'lucide-react';

interface PostJobModalProps {
  currentLang: Language;
  /** The owner's sites in the active category. */
  estates: Estate[];
  /** Site to preselect, e.g. when opened from the sites tab. */
  initialEstateId?: string;
  onClose: () => void;
}

/** A date `offset` days from today, as yyyy-mm-dd, for the form defaults. */
const isoDay = (offset: number): string => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

export const PostJobModal: React.FC<PostJobModalProps> = ({ currentLang, estates, initialEstateId, onClose }) => {
  const t = useT(currentLang);
  const { category } = useCategory();
  const [estateId, setEstateId] = useState(initialEstateId || estates[0]?.id || '');
  const [taskType, setTaskType] = useState(category.defaults.taskType);
  const [startsAt, setStartsAt] = useState(isoDay(7));
  const [endsAt, setEndsAt] = useState(isoDay(8));
  const [workerCount, setWorkerCount] = useState('3');
  const [durationDays, setDurationDays] = useState('2');
  const [wageBudget, setWageBudget] = useState(category.defaults.wageBudget);
  const [skillsSelected, setSkillsSelected] = useState<string[]>(category.defaults.skills);
  const [description, setDescription] = useState('');
  const availableSkills = category.skills;

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

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <span>{t.post_job}</span>
          </div>
          <button 
            onClick={() => onClose()}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateJob} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.select_estate}
            </label>
            <select
              required
              value={estateId}
              onChange={(e) => setEstateId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>{t.choose_land}</option>
              {estates.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({formatSiteSummary(e, currentLang)}) - {e.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.task_type_label}
            </label>
            <select
              data-testid="job-task-type"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
            >
              {category.taskTypes.map((key) => (
                <option key={key} value={key}>{tTaskType(key, currentLang)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t.start_date}
              </label>
              <input
                type="date"
                required
                data-testid="job-start"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t.end_date}
              </label>
              <input
                type="date"
                required
                data-testid="job-end"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {t.job_crew_size}
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
                {t.duration_days_label}
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
                {t.budget_lkr}
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
              {t.required_skills_label}
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
                    {tSkill(sk, currentLang)} {selected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.estate_instructions}
            </label>
            <textarea
              data-testid="job-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.estate_instructions_ph}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
            />
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
              data-testid="publish-job"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
            >
              {t.publish_job}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
