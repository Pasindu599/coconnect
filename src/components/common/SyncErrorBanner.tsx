import React, { useState } from 'react';
import { CloudOff, X } from 'lucide-react';
import { Language, fmt } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import type { AppState } from '../../lib/store';

interface SyncErrorBannerProps {
  syncError: AppState['syncError'];
  currentLang: Language;
}

/** Shows the last Firestore sync failure until the person dismisses it (a newer failure shows again). */
export const SyncErrorBanner: React.FC<SyncErrorBannerProps> = ({ syncError, currentLang }) => {
  const t = useT(currentLang);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);

  if (!syncError || syncError.at === dismissedAt) return null;

  return (
    <div role="alert" data-testid="sync-error" className="bg-rose-950/80 border-b border-rose-800 text-rose-100 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
        <span className="flex items-center space-x-2">
          <CloudOff className="w-4 h-4 flex-shrink-0 text-rose-300" />
          <span>{fmt(t.sync_error, { action: syncError.action })}</span>
        </span>
        <button
          type="button"
          aria-label={t.sync_error_dismiss}
          onClick={() => setDismissedAt(syncError.at)}
          className="p-1 rounded hover:bg-rose-900"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
