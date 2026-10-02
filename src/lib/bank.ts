/**
 * Payout bank details. Stored in the existing `bank_ref` text field as "<bank code> <account number>"
 * (e.g. "BOC 77889922"), so no schema change is needed. Older demo data such as
 * "BOC Narammala 77889922" still reads correctly.
 */

export interface Bank {
  code: string;
  name: string;
}

export const SL_BANKS: Bank[] = [
  { code: 'BOC', name: 'Bank of Ceylon' },
  { code: 'PB', name: "People's Bank" },
  { code: 'COM', name: 'Commercial Bank' },
  { code: 'SAM', name: 'Sampath Bank' },
  { code: 'HNB', name: 'Hatton National Bank' },
  { code: 'NSB', name: 'National Savings Bank' },
  { code: 'SEY', name: 'Seylan Bank' },
  { code: 'NDB', name: 'NDB Bank' },
  { code: 'DFCC', name: 'DFCC Bank' },
  { code: 'PAN', name: 'Pan Asia Bank' },
];

export const bankName = (code: string): string => SL_BANKS.find(b => b.code === code)?.name ?? code;

/** Sri Lankan account numbers are 6 to 16 digits, depending on the bank. */
export const isValidAccountNumber = (account: string): boolean => /^\d{6,16}$/.test(account);

export const formatBankRef = (code: string, account: string): string => `${code} ${account.trim()}`;

export interface ParsedBankRef {
  code: string;
  account: string;
}

/** Reads a bank_ref back into its parts; null when it is empty or not in a recognised shape. */
export const parseBankRef = (ref: string | undefined | null): ParsedBankRef | null => {
  const match = ref?.trim().match(/^([A-Za-z]{2,5})\s+(?:.*\s)?(\d{6,16})$/);
  return match ? { code: match[1].toUpperCase(), account: match[2] } : null;
};

/** "••••5678": enough to recognise the account without showing the whole number. */
export const maskAccount = (account: string): string => `••••${account.slice(-4)}`;

/** A bank_ref as display text with the account masked, or null when there is none. */
export const describeBankRef = (ref: string | undefined | null): string | null => {
  const parsed = parseBankRef(ref);
  return parsed ? `${bankName(parsed.code)} ${maskAccount(parsed.account)}` : null;
};

export type BankFormError = 'bank-required' | 'account-invalid';

/** Both fields blank is fine (bank details are optional); one without the other, or a bad number, is not. */
export const validateBankForm = (code: string, account: string): BankFormError | null => {
  if (!code && !account.trim()) return null;
  if (!code) return 'bank-required';
  return isValidAccountNumber(account.trim()) ? null : 'account-invalid';
};
