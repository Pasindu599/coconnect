import React, { useState } from 'react';
import { store } from '../../lib/store';
import { Language, fmt } from '../../lib/i18n';
import { useCategory, useT } from '../../config/CategoryContext';
import { CategoryIcon } from '../../config/CategoryIcon';
import { buildSitePayload, l10n, siteFormDefaults } from '../../config/categories';
import { MapPin, X } from 'lucide-react';

interface RegisterSiteModalProps {
  currentLang: Language;
  onClose: () => void;
  /** Called with the confirmation message once the site is stored. */
  onRegistered: (message: string) => void;
}

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none';

/** Registers an estate (coconut) or a site (construction): the fields come from the category registry. */
export const RegisterSiteModal: React.FC<RegisterSiteModalProps> = ({ currentLang, onClose, onRegistered }) => {
  const t = useT(currentLang);
  const { category } = useCategory();
  const firstPreset = category.locationPresets[0];

  const [name, setName] = useState('');
  const [values, setValues] = useState<Record<string, string>>(() => siteFormDefaults(category));
  const [location, setLocation] = useState(firstPreset.location);
  const [lat, setLat] = useState(String(firstPreset.lat));
  const [lng, setLng] = useState(String(firstPreset.lng));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildSitePayload(category, values);
    if (!name || !location || !payload.ok) return;

    store.addEstate({
      name,
      area_acres: payload.area_acres,
      tree_count: payload.tree_count,
      attributes: payload.attributes,
      category: category.id,
      location,
      notes,
      lat: parseFloat(lat) || firstPreset.lat,
      lng: parseFloat(lng) || firstPreset.lng,
    });

    onRegistered(fmt(t.land_registered_success, { name }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <CategoryIcon icon={category.icon} className="w-5 h-5 text-emerald-400" />
            <span>{t.add_land}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto" data-testid="register-site-form">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.estate_name}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.estate_name_ph}
              className={INPUT}
            />
          </div>

          {/* Fields that differ per category */}
          <div className="grid grid-cols-2 gap-3">
            {category.siteFields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  {l10n(field.label, currentLang)}
                </label>
                {field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    className={INPUT}
                  >
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {l10n(option.label, currentLang)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min={field.min}
                    step={field.step ?? 'any'}
                    required={field.required}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    className={INPUT}
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.location_label}
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.location_ph}
              className={INPUT}
            />
          </div>

          {/* GPS Coordinates & Presets */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.gps_coords}</span>
              </span>
              <span className="text-[10px] text-slate-400">{t.coconut_triangle}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{t.latitude}</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">{t.longitude}</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 self-center">{t.presets}</span>
              {category.locationPresets.map(preset => (
                <button
                  key={preset.location}
                  type="button"
                  onClick={() => {
                    setLat(String(preset.lat));
                    setLng(String(preset.lng));
                    setLocation(preset.location);
                  }}
                  className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  {l10n(preset.label, currentLang)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {t.estate_notes_label}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.estate_notes_ph}
              className={INPUT}
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
            >
              {t.save_land}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
