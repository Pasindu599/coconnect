// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { OpenDisputeModal } from '../common/OpenDisputeModal';
import { AddWorkerModal } from '../supervisor/AddWorkerModal';
import { EditWorkerBankModal } from '../supervisor/EditWorkerBankModal';
import { WorkerPayoutCard } from '../worker/WorkerPayoutCard';
import { PayoutAccountCard } from '../profile/PayoutAccountCard';
import { CategoryProvider } from '../../config/CategoryContext';
import { store } from '../../lib/store';
import { snapshotStore } from '../../test/storeSnapshot';
import type { CategoryId } from '../../types/category';

let restore: () => void;
beforeEach(() => {
  restore = snapshotStore();
});
afterEach(() => {
  cleanup();
  store.logout();
  restore();
});

const inCategory = (category: CategoryId, ui: React.ReactElement) => render(<CategoryProvider categoryId={category}>{ui}</CategoryProvider>);
const awardOf = (id: string) => store.getState().awards.find(a => a.id === id)!;
const HELD = 'award-302'; // owned by user-owner-1, supervisor user-sup-1

describe('OpenDisputeModal', () => {
  const open = (onClose = vi.fn(), onOpened = vi.fn(), category: CategoryId = 'coconut') => {
    inCategory(category, <OpenDisputeModal currentLang="en" award={awardOf(HELD)} onClose={onClose} onOpened={onOpened} />);
    return { onClose, onOpened };
  };
  const fill = (text: string) => fireEvent.change(screen.getByTestId('dispute-description'), { target: { value: text } });

  it('freezes the escrow and reports it', () => {
    store.verifyOtp('+94771234567', '123456', 'owner');
    const { onClose, onOpened } = open();
    fireEvent.change(screen.getByTestId('dispute-reason'), { target: { value: 'WAGE_DISPUTE' } });
    fill('The agreed daily rate was not honoured for two days.');
    fireEvent.click(screen.getByTestId('dispute-submit'));

    expect(awardOf(HELD).escrow_status).toBe('disputed');
    expect(store.getState().exceptions[0].reason_code).toBe('WAGE_DISPUTE');
    expect(onOpened).toHaveBeenCalledWith('Dispute opened. The escrow is frozen until an admin resolves it.');
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for a real description before freezing anything', () => {
    store.verifyOtp('+94771234567', '123456', 'owner');
    const { onClose } = open();
    fill('short');
    fireEvent.click(screen.getByTestId('dispute-submit'));
    expect(screen.getByRole('alert').textContent).toBe('Please describe the problem in at least 10 characters.');
    expect(awardOf(HELD).escrow_status).toBe('held');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('refuses someone who is not on the job', () => {
    store.verifyOtp('+94765551234', '123456', 'worker');
    open();
    fill('I was not paid what I was promised on site.');
    fireEvent.click(screen.getByTestId('dispute-submit'));
    expect(screen.getByRole('alert').textContent).toBe('Only the people on this job can open a dispute.');
    expect(awardOf(HELD).escrow_status).toBe('held');
  });

  it('calls the access reason "estate" for coconut and "site" for construction', () => {
    store.verifyOtp('+94771234567', '123456', 'owner');
    open();
    expect(within(screen.getByTestId('dispute-reason')).getByText('Estate access issue')).toBeTruthy();
    cleanup();
    open(vi.fn(), vi.fn(), 'construction');
    expect(within(screen.getByTestId('dispute-reason')).getByText('Site access issue')).toBeTruthy();
  });
});

describe('AddWorkerModal consent and bank details', () => {
  const setup = (category: CategoryId = 'construction') => {
    store.verifyOtp(category === 'construction' ? '+94772000002' : '+94719876543', '123456');
    const onClose = vi.fn();
    inCategory(category, <AddWorkerModal currentLang="en" onClose={onClose} />);
    const inputs = document.querySelectorAll<HTMLInputElement>('form input[type="text"]');
    fireEvent.change(inputs[0], { target: { value: 'Nuwan Perera' } }); // name
    return { onClose };
  };
  const submit = () => fireEvent.click(document.querySelector('form button[type="submit"]')!);
  const registered = (name: string) => store.getState().workers.find(w => w.name === name);

  it('will not register a worker until consent is confirmed', () => {
    const { onClose } = setup();
    submit();
    expect(screen.getByText('Confirm that the worker has agreed before registering them.')).toBeTruthy();
    expect(registered('Nuwan Perera')).toBeUndefined();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the consent statement and names the chosen method', () => {
    setup();
    expect(screen.getByTestId('consent-block').textContent).toContain('Read this to the worker');
    expect(screen.getByTestId('consent-block').textContent).toContain('SMS OTP Confirmation');
  });

  it('registers with consent and no bank details (they are optional)', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByTestId('consent-confirm'));
    submit();
    expect(registered('Nuwan Perera')).toMatchObject({ category: 'construction', consent_method: 'sms' });
    expect(registered('Nuwan Perera')!.bank_ref).toBeUndefined();
    expect(onClose).toHaveBeenCalled();
  });

  it('rejects an account number that is not 6 to 16 digits', () => {
    setup();
    fireEvent.click(screen.getByTestId('consent-confirm'));
    fireEvent.change(screen.getByTestId('bank-code'), { target: { value: 'BOC' } });
    fireEvent.change(screen.getByTestId('bank-account'), { target: { value: '12-34' } });
    submit();
    expect(screen.getByText('Enter a valid account number: 6 to 16 digits.')).toBeTruthy();
    expect(registered('Nuwan Perera')).toBeUndefined();
  });

  it('needs a bank when an account number is typed', () => {
    setup();
    fireEvent.click(screen.getByTestId('consent-confirm'));
    fireEvent.change(screen.getByTestId('bank-account'), { target: { value: '77889922' } });
    submit();
    expect(screen.getByText('Choose the bank.')).toBeTruthy();
  });

  it('stores valid bank details as "<bank> <account>"', () => {
    setup();
    fireEvent.click(screen.getByTestId('consent-confirm'));
    fireEvent.change(screen.getByTestId('bank-code'), { target: { value: 'COM' } });
    fireEvent.change(screen.getByTestId('bank-account'), { target: { value: ' 11223344 ' } });
    submit();
    expect(registered('Nuwan Perera')!.bank_ref).toBe('COM 11223344');
  });

  it('offers the category trades when picking skills', () => {
    setup('construction');
    const skills = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-pressed')).map(b => b.textContent);
    expect(skills.join(' ')).toContain('Electrician');
    expect(skills.join(' ')).not.toContain('Tree Climbing');
  });
});

describe('EditWorkerBankModal', () => {
  const worker = (id: string) => store.getState().workers.find(w => w.id === id)!;

  it('starts from the bank details the worker already has', () => {
    store.verifyOtp('+94719876543', '123456'); // user-sup-1
    inCategory('coconut', <EditWorkerBankModal currentLang="en" worker={worker('worker-1')} onClose={() => {}} onSaved={() => {}} />);
    expect((screen.getByTestId('bank-code') as HTMLSelectElement).value).toBe('BOC');
    expect((screen.getByTestId('bank-account') as HTMLInputElement).value).toBe('77889922');
  });

  it('saves a new account and says so', () => {
    store.verifyOtp('+94719876543', '123456');
    const onSaved = vi.fn();
    const onClose = vi.fn();
    inCategory('coconut', <EditWorkerBankModal currentLang="en" worker={worker('worker-1')} onClose={onClose} onSaved={onSaved} />);
    fireEvent.change(screen.getByTestId('bank-code'), { target: { value: 'SAM' } });
    fireEvent.change(screen.getByTestId('bank-account'), { target: { value: '5544332211' } });
    fireEvent.click(screen.getByTestId('bank-save'));
    expect(worker('worker-1').bank_ref).toBe('SAM 5544332211');
    expect(onSaved).toHaveBeenCalledWith('Bank details saved.');
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the old details when the new ones are invalid', () => {
    store.verifyOtp('+94719876543', '123456');
    const onClose = vi.fn();
    inCategory('coconut', <EditWorkerBankModal currentLang="en" worker={worker('worker-1')} onClose={onClose} onSaved={() => {}} />);
    fireEvent.change(screen.getByTestId('bank-account'), { target: { value: '12' } });
    fireEvent.click(screen.getByTestId('bank-save'));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(worker('worker-1').bank_ref).toBe('BOC Narammala 77889922');
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('WorkerPayoutCard', () => {
  const base = structuredClone(store.getState().workers.find(w => w.id === 'worker-1')!);

  it('masks the account and shows what the worker agreed to', () => {
    inCategory('coconut', <WorkerPayoutCard currentLang="en" worker={base} />);
    expect(screen.getByTestId('worker-payout-bank').textContent).toBe('Bank of Ceylon ••••9922');
    expect(screen.getByTestId('worker-payout-bank').textContent).not.toContain('77889922');
    expect(screen.getByTestId('worker-consent').textContent).toContain('SMS OTP Confirmation');
  });

  it('tells the worker when no bank details have been added', () => {
    inCategory('construction', <WorkerPayoutCard currentLang="en" worker={{ ...base, bank_ref: undefined }} />);
    expect(screen.getByTestId('worker-payout-none').textContent).toContain('Your contractor has not added your bank details yet');
  });
});

describe('PayoutAccountCard', () => {
  it('saves the person payout account and shows it masked', () => {
    store.verifyOtp('+94772000002', '123456');
    inCategory('construction', <PayoutAccountCard currentLang="en" user={store.getState().currentUser!} />);
    expect(screen.getByTestId('payout-current').textContent).toBe('No bank details yet');
    fireEvent.change(screen.getByTestId('bank-code'), { target: { value: 'HNB' } });
    fireEvent.change(screen.getByTestId('bank-account'), { target: { value: '9988776655' } });
    fireEvent.click(screen.getByTestId('payout-save'));
    expect(store.getState().currentUser!.payout_bank_ref).toBe('HNB 9988776655');
    expect(screen.getByRole('status').textContent).toBe('Bank details saved.');
  });

  it('does not save an invalid account number', () => {
    store.verifyOtp('+94772000002', '123456');
    inCategory('construction', <PayoutAccountCard currentLang="en" user={store.getState().currentUser!} />);
    fireEvent.change(screen.getByTestId('bank-code'), { target: { value: 'HNB' } });
    fireEvent.change(screen.getByTestId('bank-account'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByTestId('payout-save'));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(store.getState().currentUser!.payout_bank_ref).toBeUndefined();
  });
});
