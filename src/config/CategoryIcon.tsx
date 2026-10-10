import React from 'react';
import { Building2, Trees } from 'lucide-react';
import type { CategoryConfig } from './categories';

/** Icon for a category, from the registry's `icon` key. */
export const CategoryIcon: React.FC<{ icon: CategoryConfig['icon']; className?: string }> = ({ icon, className }) =>
  icon === 'building' ? <Building2 className={className} /> : <Trees className={className} />;

/**
 * Tailwind needs full class names to exist in the source, so accent colours are listed
 * here rather than built from the accent name.
 */
export const ACCENT: Record<
  CategoryConfig['accent'],
  {
    text: string;
    border: string;
    hoverBorder: string;
    chip: string;
    button: string;
    glow: string;
    /** CSS colour for the pointer-following spotlight on the home page cards. */
    spotlight: string;
  }
> = {
  emerald: {
    text: 'text-emerald-400',
    border: 'border-emerald-800',
    hoverBorder: 'hover:border-emerald-500/70',
    chip: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    glow: 'bg-emerald-900/20',
    spotlight: 'rgba(16, 185, 129, 0.16)',
  },
  sky: {
    text: 'text-sky-400',
    border: 'border-sky-800',
    hoverBorder: 'hover:border-sky-500/70',
    chip: 'bg-sky-950 text-sky-300 border-sky-800',
    button: 'bg-sky-600 hover:bg-sky-500',
    glow: 'bg-sky-900/20',
    spotlight: 'rgba(14, 165, 233, 0.16)',
  },
};
