import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const MFA_TOKEN_KEY = 'blogger_mfa_token';
const MFA_TOKEN_EXP_KEY = 'blogger_mfa_token_exp';
const DEVICE_TOKEN_KEY = 'blogger_device_token';

// Decode the exp (unix seconds) from our HS256-signed MFA token payload.
const decodeExp = (token: string): number => {
  try {
    const body = token.split('.')[0];
    const b64 = body.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : 0;
  } catch {
    return 0;
  }
};

export const getMfaToken = (): string | null => {
  try {
    const t = localStorage.getItem(MFA_TOKEN_KEY);
    if (!t) return null;
    const exp = Number(localStorage.getItem(MFA_TOKEN_EXP_KEY) || 0);
    // Absolute expiry: valid for the full 12h issued by the server, no idle timeout.
    if (!exp || Date.now() / 1000 >= exp) {
      localStorage.removeItem(MFA_TOKEN_KEY);
      localStorage.removeItem(MFA_TOKEN_EXP_KEY);
      return null;
    }
    return t;
  } catch { return null; }
};

export const setMfaToken = (t: string | null) => {
  try {
    if (!t) {
      localStorage.removeItem(MFA_TOKEN_KEY);
      localStorage.removeItem(MFA_TOKEN_EXP_KEY);
    } else {
      localStorage.setItem(MFA_TOKEN_KEY, t);
      localStorage.setItem(MFA_TOKEN_EXP_KEY, String(decodeExp(t)));
    }
  } catch { /* ignore */ }
};

// No-op kept for backwards compatibility — MFA session is absolute 12h, activity does not extend it.
export const touchMfaActivity = () => { /* intentionally no-op */ };

export const getDeviceToken = (): string | null => {
  try { return localStorage.getItem(DEVICE_TOKEN_KEY); } catch { return null; }
};
export const setDeviceToken = (t: string | null) => {
  try {
    if (!t) localStorage.removeItem(DEVICE_TOKEN_KEY);
    else localStorage.setItem(DEVICE_TOKEN_KEY, t);
  } catch { /* ignore */ }
};

export const mfaApi = async <T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sign in with Google first.');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
  const mfa = getMfaToken();
  if (mfa) headers['x-mfa-token'] = mfa;
  const device = getDeviceToken();
  if (device) headers['x-device-token'] = device;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/blogger-mfa`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body as T;
};

export type MfaStatus = {
  mfa_enabled: boolean;
  needs_setup: boolean;
  trusted_device: boolean;
  mfa_token: string | null;
};
