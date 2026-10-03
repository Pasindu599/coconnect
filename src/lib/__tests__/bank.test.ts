import { describe, expect, it } from 'vitest';
import {
  SL_BANKS,
  bankName,
  describeBankRef,
  formatBankRef,
  isValidAccountNumber,
  maskAccount,
  parseBankRef,
  validateBankForm,
} from '../bank';

describe('account numbers', () => {
  it.each(['123456', '77889922', '1234567890123456'])('accepts %s', n => expect(isValidAccountNumber(n)).toBe(true));
  it.each(['12345', '12345678901234567', '12 345 678', 'abcdef12', '', '12-345-678'])('rejects "%s"', n =>
    expect(isValidAccountNumber(n)).toBe(false)
  );
});

describe('bank_ref round trip', () => {
  it('formats and parses', () => {
    expect(formatBankRef('BOC', ' 77889922 ')).toBe('BOC 77889922');
    expect(parseBankRef('BOC 77889922')).toEqual({ code: 'BOC', account: '77889922' });
  });

  it('still reads the older demo data with a branch name in the middle', () => {
    expect(parseBankRef('BOC Narammala 77889922')).toEqual({ code: 'BOC', account: '77889922' });
    expect(parseBankRef('COM 11223344')).toEqual({ code: 'COM', account: '11223344' });
  });

  it.each([undefined, null, '', '   ', 'no account here', 'BOC 123'])('returns null for %j', ref => {
    expect(parseBankRef(ref)).toBeNull();
  });

  it('upper-cases the bank code', () => {
    expect(parseBankRef('boc 77889922')?.code).toBe('BOC');
  });
});

describe('display', () => {
  it('names the bank and masks the account', () => {
    expect(describeBankRef('BOC 77889922')).toBe('Bank of Ceylon ••••9922');
    expect(describeBankRef('')).toBeNull();
    expect(maskAccount('1234567')).toBe('••••4567');
  });

  it('falls back to the code for a bank that is not listed', () => {
    expect(bankName('XYZ')).toBe('XYZ');
    expect(bankName('SAM')).toBe('Sampath Bank');
  });

  it('lists each bank code once', () => {
    const codes = SL_BANKS.map(b => b.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('validateBankForm', () => {
  it('lets both fields stay blank', () => expect(validateBankForm('', '  ')).toBeNull());
  it('needs a bank when an account is given', () => expect(validateBankForm('', '77889922')).toBe('bank-required'));
  it('needs a valid account when a bank is chosen', () => {
    expect(validateBankForm('BOC', '')).toBe('account-invalid');
    expect(validateBankForm('BOC', '123')).toBe('account-invalid');
    expect(validateBankForm('BOC', '77889922')).toBeNull();
  });
});
