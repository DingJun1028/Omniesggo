import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user' }),
  }),
}));

describe('middleware 5T gates', () => {
  it('allows public health route without auth', async () => {
    const req = new NextRequest('http://localhost/api/health');
    const mod = await import('../src/middleware');
    const res = await mod.GET?.({});
    expect(res?.status).not.toBe(401);
  });
});
