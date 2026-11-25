import { useCallback, useEffect, useRef, useState } from "react";
import type { AutosaveStatus, EditorSnapshot } from "./types";
import { countProseWords } from "./markdown";
import { createPost, updatePost } from "./api";

const MIN_REMOTE_WORDS = 1200;
const DRAFT_PREFIX = "blogger-draft-";
const LOCAL_DEBOUNCE = 700;
const REMOTE_DEBOUNCE = 4000;

export interface StoredDraft {
  snapshot: EditorSnapshot;
  savedAt: number;
}

export const draftKey = (id: string | undefined) => `${DRAFT_PREFIX}${id ?? "new"}`;

/** Backwards-compatible read: supports both the old (bare snapshot) and new (wrapped) formats. */
export const readDraft = (id: string | undefined): StoredDraft | null => {
  try {
    const raw = localStorage.getItem(draftKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "snapshot" in parsed && "savedAt" in parsed) {
      return parsed as StoredDraft;
    }
    // Legacy bare snapshot
    return { snapshot: parsed as EditorSnapshot, savedAt: 0 };
  } catch {
    return null;
  }
};

export const writeDraft = (id: string | undefined, snapshot: EditorSnapshot) => {
  try {
    const payload: StoredDraft = { snapshot, savedAt: Date.now() };
    localStorage.setItem(draftKey(id), JSON.stringify(payload));
  } catch { /* ignore */ }
};

export const clearDraft = (id: string | undefined) => {
  try { localStorage.removeItem(draftKey(id)); } catch { /* ignore */ }
};

interface UseAutosaveOpts {
  id: string | undefined;
  snapshot: EditorSnapshot;
  enabled: boolean;
  onRemoteCreated?: (newId: string) => void;
  onRemoteError?: (msg: string) => void;
}

export const useAutosave = ({
  id,
  snapshot,
  enabled,
  onRemoteCreated,
  onRemoteError,
}: UseAutosaveOpts) => {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const localTimer = useRef<number | null>(null);
  const remoteTimer = useRef<number | null>(null);
  const inflight = useRef(false);
  const currentId = useRef<string | undefined>(id);
  const lastSnapshot = useRef<EditorSnapshot>(snapshot);

  useEffect(() => { currentId.current = id; }, [id]);
  useEffect(() => { lastSnapshot.current = snapshot; }, [snapshot]);

  // Watch online/offline transitions so the status pill reflects reality.
  useEffect(() => {
    const goOffline = () => setStatus((s) => (s === "saved" ? s : "offline"));
    const goOnline = () => setStatus((s) => (s === "offline" ? "local" : s));
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const runRemoteSave = useCallback(async (snap: EditorSnapshot): Promise<boolean> => {
    if (inflight.current) return false;
    inflight.current = true;
    setStatus("saving");
    try {
      if (currentId.current) {
        await updatePost(currentId.current, snap);
      } else {
        const created = await createPost(snap);
        currentId.current = created.id;
        onRemoteCreated?.(created.id);
      }
      setStatus("saved");
      setLastSavedAt(new Date());
      setLastError(null);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setLastError(msg);
      setStatus(navigator.onLine ? "error" : "offline");
      onRemoteError?.(msg);
      return false;
    } finally {
      inflight.current = false;
    }
  }, [onRemoteCreated, onRemoteError]);

  /** Manual "Save now" — bypasses debounce. Callers can await this from an inline retry button. */
  const saveNow = useCallback(async () => runRemoteSave(lastSnapshot.current), [runRemoteSave]);

  useEffect(() => {
    if (!enabled) return;
    if (localTimer.current) window.clearTimeout(localTimer.current);
    if (remoteTimer.current) window.clearTimeout(remoteTimer.current);

    if (!snapshot.title && !snapshot.content) {
      setStatus("idle");
      return;
    }

    setStatus("saving");

    localTimer.current = window.setTimeout(() => {
      writeDraft(currentId.current, snapshot);
      setStatus((s) => (s === "saving" ? "local" : s));
    }, LOCAL_DEBOUNCE);

    const words = countProseWords(snapshot.content);
    const canRemote = words >= MIN_REMOTE_WORDS && !!snapshot.title.trim() && navigator.onLine;
    if (!canRemote) {
      remoteTimer.current = window.setTimeout(() => {
        setStatus(navigator.onLine ? "local" : "offline");
      }, LOCAL_DEBOUNCE + 50);
      return;
    }

    remoteTimer.current = window.setTimeout(() => {
      void runRemoteSave(snapshot);
    }, REMOTE_DEBOUNCE);

    return () => {
      if (localTimer.current) window.clearTimeout(localTimer.current);
      if (remoteTimer.current) window.clearTimeout(remoteTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, enabled]);

  return { status, lastSavedAt, lastError, setStatus, saveNow };
};
