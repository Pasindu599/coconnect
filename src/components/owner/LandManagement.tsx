import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { Estate } from '../../types';
import { Language, translations } from '../../lib/i18n';
import { 
  Trees, 
  Plus, 
  MapPin, 
  Layers, 
  CheckCircle, 
  Sprout,
  X,
  FileText
} from 'lucide-react';

interface LandManagementProps {
  state: AppState;
  currentLang: Language;
  onSelectEstateForJob?: (estateId: string) => void;
}

export const LandManagement: React.FC<LandManagementProps> = ({
  state,
  currentLang,
  onSelectEstateForJob,
}) => {
  const t = translations[currentLang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [areaAcres, setAreaAcres] = useState('10.0');
  const [location, setLocation] = useState('Kurunegala District');
  const [treeCount, setTreeCount] = useState('650');
  const [notes, setNotes] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const user = state.currentUser;
  const estates = state.estates.filter(e => e.owner_id === user?.id);

  const handleAddEstate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !areaAcres || !location || !treeCount) return;

    store.addEstate({
      name,
      area_acres: parseFloat(areaAcres),
      location,
      tree_count: parseInt(treeCount, 10),
      notes
    });

    setIsModalOpen(false);
    setName('');
    setNotes('');
    setSuccessBanner(`Coconut land "${name}" successfully registered into the estates registry.`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const totalAcres = estates.reduce((sum, e) => sum + e.area_acres, 0);
  const totalTrees = estates.reduce((sum, e) => sum + e.tree_count, 0);

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Trees className="w-5 h-5 text-emerald-400" />
            <span>{t.my_lands}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your coconut plantations, palms count, and geographical plot locations for hiring crews.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.add_land}</span>
        </button>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Aggregate Estate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Total Registered Lands</div>
          <div className="text-2xl font-bold text-white mt-1">{estates.length} Estates</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Total Area (Acres)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{totalAcres.toFixed(1)} Acres</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Total Coconut Palms (Trees)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{totalTrees.toLocaleString()} Trees</div>
        </div>
      </div>

      {/* Lands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {estates.map((estate) => {
          const density = (estate.tree_count / estate.area_acres).toFixed(0);
          const activeEstateJobs = state.jobs.filter(j => j.estate_id === estate.id && ['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(j.status));

          return (
            <div 
              key={estate.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                      <Sprout className="w-5 h-5" />
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
                    ID: {estate.id}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Area</div>
                    <div className="text-sm font-bold text-white mt-0.5">{estate.area_acres} ac</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Palms Count</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">{estate.tree_count}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Density</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">{density} / ac</div>
                  </div>
                </div>

                {estate.notes && (
                  <p className="mt-3 text-xs text-slate-400 bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                    {estate.notes}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Active jobs on land: <strong className="text-white">{activeEstateJobs.length}</strong>
                </span>
                {onSelectEstateForJob && (
                  <button
                    onClick={() => onSelectEstateForJob(estate.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-medium transition"
                  >
                    Post Job for this Land →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Register Land */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <Trees className="w-5 h-5 text-emerald-400" />
                <span>{t.add_land}</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEstate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Estate Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Golden Crown Coconut Plantation"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Area (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Tree Count (Palms)
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={treeCount}
                    onChange={(e) => setTreeCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Location (District / Town)
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kuliyapitiya, Kurunegala"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Estate Notes / Access Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Road conditions, soil type, irrigation, tractor accessibility..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  Save Land Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
