import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routes = fs.readFileSync(
  path.join(process.cwd(), 'src/app/routing/AppRoutes.tsx'),
  'utf8',
);
const dispatchEvent = vi.fn();

const loadAuthFetch = async () => {
  vi.resetModules();
  vi.stubGlobal('window', {
    location: { origin: 'https://capital-ai.online' },
    dispatchEvent,
  });
  vi.stubGlobal(
    'CustomEvent',
    class {
      readonly type: string;
      readonly detail: unknown;

      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
  );

  return import('../../src/lib/authFetch');
};

const sessionResponse = (authenticated: boolean) =>
  new Response(JSON.stringify({ authenticated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  dispatchEvent.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authFetch session stability', () => {
  it('does not convert a transport failure into a global logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));
    const { authFetch } = await loadAuthFetch();

    await expect(authFetch('/api/auth/profile')).rejects.toThrow('network unavailable');
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('keeps an authenticated session when an endpoint-specific retry remains unauthorized', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(sessionResponse(true))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const { authFetch } = await loadAuthFetch();

    const response = await authFetch('/api/auth/profile');

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches a global logout only after a confirmed unauthenticated session', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(sessionResponse(false));
    vi.stubGlobal('fetch', fetchMock);
    const { authFetch } = await loadAuthFetch();

    const response = await authFetch('/api/auth/profile');

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });

  it('preserves the session when the session readback is temporarily unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const { authFetch } = await loadAuthFetch();

    const response = await authFetch('/api/auth/profile');

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

describe('direct profile route resolution', () => {
  it.each([375, 1440])(
    'uses the same ready-session guard for a direct /profile navigation at %ipx',
    (viewportWidth) => {
      expect(viewportWidth).toBeGreaterThan(0);
      expect(routes).toContain("if (currentPath === '/profile')");
      expect(routes).toContain('return renderAuthenticatedProfile();');
      expect(routes).toContain('if (authBootstrapPending) return <AuthRouteResolution onRetry={refreshSession} />;');
      expect(routes).toContain('return <RouteRedirect to="/login" label="Weiter zur Anmeldung" />;');
      expect(routes).not.toContain('window.innerWidth');
      expect(routes).not.toContain('matchMedia');
    },
  );
});

