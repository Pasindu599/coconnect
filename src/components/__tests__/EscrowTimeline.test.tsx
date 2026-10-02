// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EscrowTimeline } from '../common/EscrowTimeline';
import type { EscrowStatus } from '../../types';

afterEach(cleanup);

const states = () =>
  ['awarded', 'in_escrow', 'completion', 'paid_out'].map(step => screen.getByTestId(`escrow-step-${step}`).dataset.state);

describe('EscrowTimeline', () => {
  it.each<[EscrowStatus, string[]]>([
    ['pending', ['done', 'current', 'todo', 'todo']],
    ['held', ['done', 'done', 'current', 'todo']],
    ['release_requested', ['done', 'done', 'done', 'current']],
    ['released', ['done', 'done', 'done', 'done']],
  ])('%s -> %j', (status, expected) => {
    render(<EscrowTimeline status={status} currentLang="en" />);
    expect(states()).toEqual(expected);
  });

  it('says it is waiting for payment while pending', () => {
    render(<EscrowTimeline status="pending" currentLang="en" />);
    expect(screen.getByText('Waiting for payment')).toBeTruthy();
    expect(screen.queryByText('In escrow')).toBeNull();
  });

  it('says "In escrow" once the money is held', () => {
    render(<EscrowTimeline status="held" currentLang="en" />);
    expect(screen.getByText('In escrow')).toBeTruthy();
  });

  it('freezes the timeline and explains a dispute', () => {
    render(<EscrowTimeline status="disputed" currentLang="en" />);
    expect(states()).toEqual(['done', 'done', 'todo', 'todo']); // nothing is "current": the money is frozen
    expect(screen.getByRole('status').textContent).toContain('frozen');
  });

  it('explains a refund', () => {
    render(<EscrowTimeline status="refunded" currentLang="en" />);
    expect(screen.getByRole('status').textContent).toContain('refunded');
  });

  it('exposes the status for tests and tooling', () => {
    render(<EscrowTimeline status="held" currentLang="en" />);
    expect(screen.getByTestId('escrow-timeline').dataset.status).toBe('held');
  });

  it('is translated', () => {
    render(<EscrowTimeline status="held" currentLang="si" />);
    expect(screen.getByText('එස්ක්‍රෝ ගිණුමේ')).toBeTruthy();
  });
});
