// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SyncErrorBanner } from '../common/SyncErrorBanner';
import { usesBackend } from '../../lib/authApi';

afterEach(cleanup);

const error = (action: string, at: string) => ({ action, message: 'permission-denied', at });

describe('SyncErrorBanner', () => {
  it('shows nothing when there is no error', () => {
    render(<SyncErrorBanner syncError={null} currentLang="en" />);
    expect(screen.queryByTestId('sync-error')).toBeNull();
  });

  it('names what failed to sync', () => {
    render(<SyncErrorBanner syncError={error('jobs.sync', '2026-10-03T10:00:00Z')} currentLang="en" />);
    expect(screen.getByRole('alert').textContent).toContain('Could not sync with the server (jobs.sync)');
  });

  it('can be dismissed', () => {
    render(<SyncErrorBanner syncError={error('jobs.sync', '2026-10-03T10:00:00Z')} currentLang="en" />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByTestId('sync-error')).toBeNull();
  });

  it('comes back for a newer failure after being dismissed', () => {
    const { rerender } = render(<SyncErrorBanner syncError={error('jobs.sync', '2026-10-03T10:00:00Z')} currentLang="en" />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    rerender(<SyncErrorBanner syncError={error('bid.submitted', '2026-10-03T10:05:00Z')} currentLang="en" />);
    expect(screen.getByRole('alert').textContent).toContain('bid.submitted');
  });

  it('is translated', () => {
    render(<SyncErrorBanner syncError={error('jobs.sync', '2026-10-03T10:00:00Z')} currentLang="si" />);
    expect(screen.getByRole('alert').textContent).toContain('සේවාදායකය සමඟ');
  });
});

describe('usesBackend', () => {
  it('is off by default, so the demo never tries to sync with the backend', () => {
    expect(usesBackend).toBe(false);
  });
});
