import React, { useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  MapMouseEvent 
} from '@vis.gl/react-google-maps';
import { AppState, store } from '../../lib/store';
import { Estate, LabourJob } from '../../types';
import { Language, getT, tJobStatus, tTaskType } from '../../lib/i18n';
import { 
  Trees, 
  MapPin, 
  Layers, 
  Navigation, 
  Plus, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  Maximize2 
} from 'lucide-react';

interface EstateMapViewProps {
  state: AppState;
  currentLang: Language;
  onSelectEstate?: (estate: Estate) => void;
  onSelectJob?: (job: LabourJob) => void;
  allowPickLocation?: boolean;
  onLocationPicked?: (lat: number, lng: number) => void;
}

export const EstateMapView: React.FC<EstateMapViewProps> = ({
  state,
  currentLang,
  onSelectEstate,
  onSelectJob,
  allowPickLocation = true,
  onLocationPicked,
}) => {
  const t = getT(currentLang);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBv9If5RVuxomzcSFyz5Z9KBVTC5-WTRVc';
  
  const [filter, setFilter] = useState<'all' | 'estates' | 'jobs'>('all');
  const [selectedEstate, setSelectedEstate] = useState<Estate | null>(null);
  const [selectedJob, setSelectedJob] = useState<LabourJob | null>(null);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isPickingMode, setIsPickingMode] = useState<boolean>(false);
  const [mapType, setMapType] = useState<string>('roadmap');

  // Sri Lanka Coconut Triangle default center
  const defaultCenter = { lat: 7.45, lng: 80.05 };

  const handleMapClick = (e: MapMouseEvent) => {
    if (isPickingMode && e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setPickedCoords({ lat, lng });
      if (onLocationPicked) {
        onLocationPicked(lat, lng);
      }
    }
  };

  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[680px]">
      {/* Top Map Toolbar */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{t.map_title}</h2>
            <p className="text-xs text-slate-400">{t.map_sub}</p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.map_all_pins} ({state.estates.length + state.jobs.length})
            </button>
            <button
              onClick={() => setFilter('estates')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === 'estates' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.map_estates} ({state.estates.length})
            </button>
            <button
              onClick={() => setFilter('jobs')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === 'jobs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.map_active_jobs} ({state.jobs.length})
            </button>
          </div>

          {allowPickLocation && (
            <button
              onClick={() => setIsPickingMode(!isPickingMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border ${
                isPickingMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isPickingMode ? t.map_click_to_place : t.map_drop_pin}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative flex-1 w-full h-full bg-slate-950">
        <APIProvider apiKey={apiKey}>
          <Map
            mapId="COCONNECT_ESTATE_MAP"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            defaultCenter={defaultCenter}
            defaultZoom={10}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
            className="w-full h-full"
          >
            {/* Estate Markers */}
            {(filter === 'all' || filter === 'estates') &&
              state.estates.map((estate) => {
                const lat = estate.lat || 7.4344;
                const lng = estate.lng || 80.2181;
                return (
                  <AdvancedMarker
                    key={estate.id}
                    position={{ lat, lng }}
                    onClick={() => {
                      setSelectedJob(null);
                      setSelectedEstate(estate);
                      if (onSelectEstate) onSelectEstate(estate);
                    }}
                  >
                    <div className="group cursor-pointer transform hover:scale-110 transition flex flex-col items-center">
                      <div className="px-2 py-0.5 rounded-md bg-emerald-900/90 text-emerald-200 text-[10px] font-bold border border-emerald-500/50 shadow-md whitespace-nowrap mb-1">
                        {estate.name}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center border-2 border-emerald-400 shadow-lg shadow-emerald-500/30">
                        <Trees className="w-5 h-5 text-emerald-100" />
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

            {/* Active Job Markers */}
            {(filter === 'all' || filter === 'jobs') &&
              state.jobs.map((job) => {
                const lat = job.lat || 7.4988;
                const lng = job.lng || 79.8458;
                return (
                  <AdvancedMarker
                    key={job.id}
                    position={{ lat, lng }}
                    onClick={() => {
                      setSelectedEstate(null);
                      setSelectedJob(job);
                      if (onSelectJob) onSelectJob(job);
                    }}
                  >
                    <div className="group cursor-pointer transform hover:scale-110 transition flex flex-col items-center">
                      <div className="px-2 py-0.5 rounded-md bg-amber-900/90 text-amber-200 text-[10px] font-bold border border-amber-500/50 shadow-md whitespace-nowrap mb-1">
                        LKR {job.wage_budget.toLocaleString()} • {job.worker_count} {t.map_climbers_short}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-slate-950 flex items-center justify-center border-2 border-amber-300 shadow-lg shadow-amber-500/30">
                        <Briefcase className="w-5 h-5 text-slate-900 font-bold" />
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

            {/* Picked Location Marker */}
            {pickedCoords && (
              <AdvancedMarker position={pickedCoords}>
                <div className="flex flex-col items-center animate-bounce">
                  <div className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded shadow mb-1">
                    {t.map_new_land} ({pickedCoords.lat.toFixed(4)}, {pickedCoords.lng.toFixed(4)})
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Estate InfoWindow */}
            {selectedEstate && (
              <InfoWindow
                position={{
                  lat: selectedEstate.lat || 7.4344,
                  lng: selectedEstate.lng || 80.2181,
                }}
                onCloseClick={() => setSelectedEstate(null)}
              >
                <div className="p-2 text-slate-900 max-w-xs">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-sm">
                    <Trees className="w-4 h-4" />
                    <span>{selectedEstate.name}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{selectedEstate.location}</p>
                  <div className="grid grid-cols-2 gap-2 my-2 py-1.5 border-y border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">{t.map_area}</span>
                      <span className="font-semibold text-slate-800">{selectedEstate.area_acres} {t.map_acres_unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">{t.map_mature_palms}</span>
                      <span className="font-semibold text-slate-800">{selectedEstate.tree_count} {t.map_palms_unit}</span>
                    </div>
                  </div>
                  {selectedEstate.notes && (
                    <p className="text-[11px] text-slate-600 italic mb-2 line-clamp-2">{selectedEstate.notes}</p>
                  )}
                  <div className="text-[11px] text-emerald-700 font-medium">
                    {t.map_gps}: {selectedEstate.lat || 7.4344}, {selectedEstate.lng || 80.2181}
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* Job InfoWindow */}
            {selectedJob && (
              <InfoWindow
                position={{
                  lat: selectedJob.lat || 7.4988,
                  lng: selectedJob.lng || 79.8458,
                }}
                onCloseClick={() => setSelectedJob(null)}
              >
                <div className="p-2 text-slate-900 max-w-xs">
                  <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-sm">
                    <Briefcase className="w-4 h-4" />
                    <span>{tTaskType(selectedJob.task_type, currentLang)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">{selectedJob.estate_name}</p>
                  <p className="text-[11px] text-slate-500">{selectedJob.estate_location}</p>
                  <div className="grid grid-cols-2 gap-2 my-2 py-1.5 border-y border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">{t.map_wage_escrow}</span>
                      <span className="font-bold text-emerald-700">LKR {selectedJob.wage_budget.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">{t.map_crew_required}</span>
                      <span className="font-semibold text-slate-800">{selectedJob.worker_count} {t.common_workers}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                    <span>{t.map_duration}: {selectedJob.duration_days} {t.common_days}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {tJobStatus(selectedJob.status, currentLang)}
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Floating Quick Region Jump Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-1.5 bg-slate-900/90 backdrop-blur p-2 rounded-xl border border-slate-800 shadow-lg text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">{t.map_quick_regions}</span>
          <button
            onClick={() => {
              setSelectedEstate(state.estates[0] || null);
            }}
            className="px-2.5 py-1 text-left rounded-md hover:bg-slate-800 text-slate-200 font-medium transition flex items-center justify-between space-x-3"
          >
            <span>{t.map_region_1}</span>
            <span className="text-[10px] text-emerald-400">{state.estates[0]?.tree_count ?? 0} {t.map_palms_unit}</span>
          </button>
          <button
            onClick={() => {
              setSelectedEstate(state.estates[1] || null);
            }}
            className="px-2.5 py-1 text-left rounded-md hover:bg-slate-800 text-slate-200 font-medium transition flex items-center justify-between space-x-3"
          >
            <span>{t.map_region_2}</span>
            <span className="text-[10px] text-emerald-400">{state.estates[1]?.tree_count ?? 0} {t.map_palms_unit}</span>
          </button>
          {state.estates[2] && (
            <button
              onClick={() => {
                setSelectedEstate(state.estates[2] || null);
              }}
              className="px-2.5 py-1 text-left rounded-md hover:bg-slate-800 text-slate-200 font-medium transition flex items-center justify-between space-x-3"
            >
              <span>{t.map_region_3}</span>
              <span className="text-[10px] text-emerald-400">{state.estates[2]?.tree_count ?? 0} {t.map_palms_unit}</span>
            </button>
          )}
        </div>

        {/* Selected Pin Bottom Sheet / Card */}
        {selectedEstate && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900/95 backdrop-blur border border-emerald-500/40 rounded-xl p-4 shadow-2xl z-10 text-white animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {t.map_estate_details}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedEstate.name}</h3>
                <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedEstate.location}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedEstate(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-slate-950/60 rounded-lg text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">{t.map_acreage}</span>
                <span className="font-bold text-white">{selectedEstate.area_acres} {t.ac_short}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">{t.map_palms_unit}</span>
                <span className="font-bold text-white">{selectedEstate.tree_count}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">{t.map_distance}</span>
                <span className="font-bold text-emerald-400">
                  {calculateDistanceKm(7.45, 80.05, selectedEstate.lat || 7.4344, selectedEstate.lng || 80.2181)} km
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic mb-3">{selectedEstate.notes}</p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                {t.map_gps}: {selectedEstate.lat || 7.4344}, {selectedEstate.lng || 80.2181}
              </span>
              {state.currentUser?.roles.includes('owner') && (
                <button
                  onClick={() => {
                    store.switchRole('owner');
                    if (onSelectEstate) onSelectEstate(selectedEstate);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  {t.map_manage_land}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
