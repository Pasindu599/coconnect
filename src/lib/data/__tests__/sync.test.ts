import { describe, expect, it } from 'vitest';
import { reconcile } from '../sync';

interface Item {
  id: string;
  name: string;
}

describe('reconcile', () => {
  it('adds new items', () => {
    const current: Item[] = [{ id: '1', name: 'a' }];
    const result = reconcile(current, { added: [{ id: '2', name: 'b' }], modified: [], removed: [] });
    expect(result.map((i) => i.id).sort()).toEqual(['1', '2']);
  });

  it('applies modifications by id, not just adds (closes KNOWN_ISSUES #10)', () => {
    const current: Item[] = [{ id: '1', name: 'old' }];
    const result = reconcile(current, { added: [], modified: [{ id: '1', name: 'new' }], removed: [] });
    expect(result).toEqual([{ id: '1', name: 'new' }]);
  });

  it('drops removed items', () => {
    const current: Item[] = [{ id: '1', name: 'a' }, { id: '2', name: 'b' }];
    const result = reconcile(current, { added: [], modified: [], removed: ['1'] });
    expect(result).toEqual([{ id: '2', name: 'b' }]);
  });

  it('handles add, modify and remove together in one batch', () => {
    const current: Item[] = [{ id: '1', name: 'a' }, { id: '2', name: 'b' }];
    const result = reconcile(current, {
      added: [{ id: '3', name: 'c' }],
      modified: [{ id: '1', name: 'a-updated' }],
      removed: ['2'],
    });
    expect(result.sort((a, b) => a.id.localeCompare(b.id))).toEqual([
      { id: '1', name: 'a-updated' },
      { id: '3', name: 'c' },
    ]);
  });

  it('is idempotent: applying the same add twice does not duplicate', () => {
    const current: Item[] = [];
    const once = reconcile(current, { added: [{ id: '1', name: 'a' }], modified: [], removed: [] });
    const twice = reconcile(once, { added: [{ id: '1', name: 'a' }], modified: [], removed: [] });
    expect(twice).toEqual([{ id: '1', name: 'a' }]);
  });
});
