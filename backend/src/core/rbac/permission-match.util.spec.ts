import { describe, it, expect } from '@jest/globals';
import { permissionMatches, roleHasPermissions } from './permission-match.util';

describe('permissionMatches', () => {
  it('grants everything with manage/all', () => {
    expect(permissionMatches({ action: 'manage', subject: 'all' }, { action: 'delete', subject: 'Users' })).toBe(true);
  });

  it('treats manage on a subject as wildcard for that subject', () => {
    expect(permissionMatches({ action: 'manage', subject: 'Catalog' }, { action: 'read', subject: 'Catalog' })).toBe(true);
    expect(permissionMatches({ action: 'manage', subject: 'Labels' }, { action: 'print', subject: 'Labels' })).toBe(true);
  });

  it('does not treat manage on one subject as access to another', () => {
    expect(permissionMatches({ action: 'manage', subject: 'Catalog' }, { action: 'read', subject: 'Users' })).toBe(false);
  });

  it('maps manage/Settings to settings umbrella subjects', () => {
    expect(permissionMatches({ action: 'manage', subject: 'Settings' }, { action: 'read', subject: 'Branch' })).toBe(true);
    expect(permissionMatches({ action: 'manage', subject: 'Settings' }, { action: 'read', subject: 'System' })).toBe(true);
    expect(permissionMatches({ action: 'manage', subject: 'Settings' }, { action: 'manage', subject: 'Integrations' })).toBe(true);
    expect(permissionMatches({ action: 'manage', subject: 'Settings' }, { action: 'read', subject: 'Catalog' })).toBe(false);
  });

  it('requires exact match for non-manage permissions', () => {
    expect(permissionMatches({ action: 'read', subject: 'Sales' }, { action: 'create', subject: 'Sales' })).toBe(false);
    expect(permissionMatches({ action: 'print', subject: 'Labels' }, { action: 'print', subject: 'Labels' })).toBe(true);
  });
});

describe('roleHasPermissions', () => {
  const perms = [
    { action: 'manage', subject: 'Sales' },
    { action: 'read', subject: 'Catalog' },
  ];

  it('requires all listed permissions', () => {
    expect(roleHasPermissions(perms, [{ action: 'read', subject: 'Catalog' }])).toBe(true);
    expect(roleHasPermissions(perms, [
      { action: 'create', subject: 'Sales' },
      { action: 'read', subject: 'Catalog' },
    ])).toBe(true);
    expect(roleHasPermissions(perms, [
      { action: 'delete', subject: 'Sales' },
    ])).toBe(true);
    expect(roleHasPermissions(perms, [
      { action: 'read', subject: 'Users' },
    ])).toBe(false);
  });

  it('short-circuits for super admin', () => {
    expect(roleHasPermissions(
      [{ action: 'manage', subject: 'all' }],
      [{ action: 'manage', subject: 'Settings' }],
    )).toBe(true);
  });
});
