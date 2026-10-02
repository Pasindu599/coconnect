import type { Language } from './i18n';

/** The currency prefix in each language, matching the wording in the dictionaries. */
const PREFIX: Record<Language, string> = { en: 'LKR', si: 'රු.', ta: 'ரூ.' };

/** "LKR 145,000" in English, "රු. 145,000" in Sinhala, "ரூ. 145,000" in Tamil. Grouping is fixed so it never varies by browser. */
export const formatMoney = (amount: number, lang: Language): string =>
  `${PREFIX[lang] ?? PREFIX.en} ${Math.round(amount).toLocaleString('en-US')}`;
