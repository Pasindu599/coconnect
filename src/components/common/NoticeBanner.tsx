import React from 'react';
import { CheckCircle } from 'lucide-react';

/** A short success message at the top of a dashboard. */
export const NoticeBanner: React.FC<{ message: string }> = ({ message }) => (
  <div role="status" className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
    <span>{message}</span>
  </div>
);
