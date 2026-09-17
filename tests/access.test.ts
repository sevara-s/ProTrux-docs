import { describe, it, expect } from 'vitest';
import {
  canOpenDocument,
  canEditDocument,
  resolveWsAccess,
  readShareToken,
  readOwnerKeyFromUrl,
} from '../apps/server/src/access';

describe('Document ACL', () => {
  const owned = {
    accessMode: 'edit',
    ownerKey: 'owner-a',
    shareToken: 'tok-abc',
  };

  it('lets the owner open private docs', () => {
    const doc = { ...owned, accessMode: 'private' };
    expect(canOpenDocument(doc, 'owner-a')).toBe(true);
    expect(canOpenDocument(doc, 'other')).toBe(false);
    expect(canOpenDocument(doc, undefined, 'tok-abc')).toBe(false);
  });

  it('lets guests open edit/view docs by link (doc id), without requiring k', () => {
    expect(canOpenDocument(owned)).toBe(true);
    expect(canOpenDocument(owned, undefined, 'tok-abc')).toBe(true);
    expect(canOpenDocument({ ...owned, accessMode: 'view' })).toBe(true);
  });

  it('rejects an explicitly wrong share token', () => {
    expect(canOpenDocument(owned, undefined, 'wrong')).toBe(false);
  });

  it('allows unowned legacy rooms without a token', () => {
    const legacy = { accessMode: 'edit', ownerKey: null, shareToken: 'seed' };
    expect(canOpenDocument(legacy)).toBe(true);
  });

  it('marks view-mode guests as read-only', () => {
    const viewDoc = { ...owned, accessMode: 'view' };
    expect(canEditDocument(viewDoc, undefined)).toBe(false);
    expect(canEditDocument(viewDoc, 'owner-a')).toBe(true);
    expect(canEditDocument({ ...owned, accessMode: 'edit' }, undefined)).toBe(true);
  });

  it('resolveWsAccess returns reason codes', () => {
    expect(resolveWsAccess(null).canOpen).toBe(false);
    expect(resolveWsAccess({ ...owned, accessMode: 'private' }).reason).toMatch(/private/i);
    expect(resolveWsAccess(owned, undefined, 'wrong').reason).toMatch(/share/i);
    expect(resolveWsAccess(owned, 'owner-a')).toEqual({ canOpen: true, canEdit: true });
    expect(resolveWsAccess(owned)).toEqual({ canOpen: true, canEdit: true });
  });

  it('parses owner + share credentials from WS URLs', () => {
    const url = '/ws/doc-1?ownerKey=own-1&k=tok-9';
    expect(readOwnerKeyFromUrl(url)).toBe('own-1');
    expect(readShareToken({ url })).toBe('tok-9');
  });
});
