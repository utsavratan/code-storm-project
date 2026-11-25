import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getBloggerAccess } from "@/lib/bloggerAuth";
import { getMfaToken, mfaApi, setMfaToken, setDeviceToken, getDeviceToken, type MfaStatus } from "./mfaClient";

export type BloggerStage = 'loading' | 'signed_out' | 'not_approved' | 'setup_required' | 'verify_required' | 'ready';

export interface BloggerAuthState {
  ready: boolean;
  stage: BloggerStage;
  email: string | null;
  error?: string;
  refresh: () => Promise<void>;
}

export const useBloggerAuth = (): BloggerAuthState => {
  const [state, setState] = useState<Omit<BloggerAuthState, 'refresh'>>({
    ready: false,
    stage: 'loading',
    email: null,
  });

  const evaluate = useCallback(async () => {
    const access = await getBloggerAccess();
    if (!access.signedIn) {
      setState({ ready: true, stage: 'signed_out', email: null });
      return;
    }
    if (!access.allowed) {
      setState({ ready: true, stage: 'not_approved', email: access.user?.email ?? null, error: (access as { error?: string }).error });
      return;
    }
    const email = access.user?.email ?? null;
    if (!access.mfaEnabled) {
      setState({ ready: true, stage: 'setup_required', email });
      return;
    }
    // MFA enabled — do we have a valid session token? Or a trusted device?
    if (getMfaToken()) {
      setState({ ready: true, stage: 'ready', email });
      return;
    }
    try {
      const status = await mfaApi<MfaStatus>('status');
      if (status.trusted_device && status.mfa_token) {
        setMfaToken(status.mfa_token);
        setState({ ready: true, stage: 'ready', email });
      } else {
        setState({ ready: true, stage: 'verify_required', email });
      }
    } catch {
      setState({ ready: true, stage: 'verify_required', email });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void evaluate().then(() => { if (!alive) setState((s) => s); });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
      if (event === 'SIGNED_OUT') {
        setMfaToken(null);
        setDeviceToken(null);
      }
      void evaluate();
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [evaluate]);

  return { ...state, refresh: evaluate };
};

export const bloggerSignOut = async () => {
  setMfaToken(null);
  // Keep device token so re-login can skip TOTP if within 30 days
  await supabase.auth.signOut();
};

export const bloggerFullSignOut = async () => {
  setMfaToken(null);
  setDeviceToken(null);
  await supabase.auth.signOut();
};

export { getDeviceToken };
