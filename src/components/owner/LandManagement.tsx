import React, { useState } from 'react';
import { useCategory, useT } from '../../config/CategoryContext';
import { CategoryIcon } from '../../config/CategoryIcon';
import { AppState } from '../../lib/store';
import { Language } from '../../lib/i18n';
import { categoryOf, formatSiteFieldValue, l10n, siteTotals } from '../../config/categories';
import { RegisterSiteModal } from './RegisterSiteModal';
import { Plus, MapPin, CheckCircle } from 'lucide-react';

interface LandManagementProps {
  state: AppState;
  currentLang: Language;
  onSelectEstateForJob?: (estateId: string) => void;
  onViewMap?: () => void;
}

/** The owner's estates (coconut) or sites (construction), with totals and a registration form. */
export const LandManagement: React.FC<LandManagementProps> = ({
  state,
  currentLang,
  onSelectEstateForJob,
  onViewMap,
}) => {
  const t = useT(currentLang);
  const { category } = useCategory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const user = state.currentUser;
  const estates = state.estates.filter(e => e.owner_id === user?.id && categoryOf(e) === category.id);
  const totals = siteTotals(estates, category);

  const handleRegistered = (message: string) => {
    setSuccessBanner(message);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CategoryIcon icon={category.icon} className="w-5 h-5 text-emerald-400" />
            <span>{t.my_lands}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.lands_desc}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {onViewMap && (
            <button
              onClick={onViewMap}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold shadow-md transition"
            >
              <MapPin className="w-4 h-4" />
              <span>{t.view_lands_on_map}</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            data-testid="add-site"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.add_land}</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Aggregate stats: how many sites, plus a total for each field the category sums */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">{t.total_registered_lands}</div>
          <div className="text-2xl font-bold text-white mt-1" data-testid="site-count">{estates.length} {t.estates_suffix}</div>
        </div>
        {totals.map(({ field, total }, index) => (
          <div key={field.key} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs font-medium text-slate-400">{l10n(field.totalLabel, currentLang)}</div>
            <div className={`text-2xl font-bold mt-1 ${index === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {total.toLocaleString(undefined, { maximumFractionDigits: 1 })} {l10n(field.unit, currentLang)}
            </div>
          </div>
        ))}
      </div>

      {/* Sites grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {estates.map((estate) => {
          const activeEstateJobs = state.jobs.filter(j => j.estate_id === estate.id && ['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(j.status));
          const metrics = (category.siteMetrics ?? [])
            .map(metric => ({ label: metric.label, value: metric.value(estate, currentLang) }))
            .filter((m): m is { label: typeof m.label; value: string } => !!m.value);

          return (
            <div 
              key={estate.id}
              data-testid="site-card"
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                      <CategoryIcon icon={category.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{estate.name}</h3>
                      <div className="flex items-center text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 mr-1" />
                        <span>{estate.location}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {t.land_id}: {estate.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                  {category.siteFields.map(field => {
                    const shown = formatSiteFieldValue(estate, field, currentLang);
                    return shown ? (
                      <div key={field.key}>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{l10n(field.label, currentLang)}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{shown}</div>
                      </div>
                    ) : null;
                  })}
                  {metrics.map(metric => (
                    <div key={metric.value}>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{l10n(metric.label, currentLang)}</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">{metric.value}</div>
                    </div>
                  ))}
                </div>

                {estate.notes && (
                  <p className="mt-3 text-xs text-slate-400 bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                    {estate.notes}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{t.map_gps}: {estate.lat ?? category.map.center.lat}, {estate.lng ?? category.map.center.lng}</span>
                  </span>
                  {onViewMap && (
                    <button
                      onClick={onViewMap}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      {t.locate_on_map}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {t.active_jobs_on_land}: <strong className="text-white">{activeEstateJobs.length}</strong>
                </span>
                {onSelectEstateForJob && (
                  <button
                    onClick={() => onSelectEstateForJob(estate.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-medium transition"
                  >
                    {t.post_job_for_land}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <RegisterSiteModal
          currentLang={currentLang}
          onClose={() => setIsModalOpen(false)}
          onRegistered={handleRegistered}
        />
      )}
    </div>
  );
};
