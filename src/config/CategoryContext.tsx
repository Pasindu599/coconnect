import React, { createContext, useContext } from 'react';
import type { CategoryId } from '../types/category';
import { CategoryConfig, getCategory } from './categories';
import { Language, TranslationDict, getCategoryT } from '../lib/i18n';

interface CategoryContextValue {
  /** Null on the home page, before a category has been chosen. */
  categoryId: CategoryId | null;
  category: CategoryConfig;
}

const CategoryContext = createContext<CategoryContextValue>({
  categoryId: null,
  category: getCategory(null),
});

export const CategoryProvider: React.FC<{ categoryId: CategoryId | null; children: React.ReactNode }> = ({
  categoryId,
  children,
}) => {
  const value = React.useMemo(() => ({ categoryId, category: getCategory(categoryId) }), [categoryId]);
  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};

/** The active category. Outside a category route this is the default (coconut) config. */
export const useCategory = (): CategoryContextValue => useContext(CategoryContext);

/** Translations with the active category's wording applied. Use instead of getT in components. */
export const useT = (lang: Language): TranslationDict => getCategoryT(lang, useContext(CategoryContext).categoryId);
