import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  createThought,
  DEFAULT_BELIEF,
  getThought,
  saveThought,
  type ThoughtWithDetails,
} from '../db/thoughts';

const SAVE_DELAY_MS = 400;

function emptyDraft(): ThoughtWithDetails {
  const now = new Date().toISOString();
  return {
    id: 0,
    createdAt: now,
    updatedAt: now,
    text: '',
    initialBelief: DEFAULT_BELIEF,
    status: 'in_progress',
    alternativeThought: null,
    finalBelief: null,
    alternativeBelief: null,
    currentStep: 1,
    evidence: [],
    effects: [],
    patterns: [],
  };
}

/**
 * Holds a thought being written or challenged and saves it automatically, so leaving the app
 * mid-flow loses nothing. A new thought gets its database row once it has some text.
 */
export function useThoughtDraft(id: number | null) {
  const [draft, setDraft] = useState<ThoughtWithDetails | null>(() => (id == null ? emptyDraft() : getThought(id)));
  const latest = useRef(draft);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const current = latest.current;
    if (!dirty.current || !current) return current;
    dirty.current = false;
    if (current.id === 0) {
      if (!current.text.trim()) return current;
      const created = { ...current, id: createThought(current.text, current.initialBelief) };
      latest.current = created;
      setDraft(created);
      saveThought(created);
      return created;
    }
    saveThought(current);
    return current;
  }, []);

  const update = useCallback(
    (changes: Partial<ThoughtWithDetails> | ((d: ThoughtWithDetails) => Partial<ThoughtWithDetails>)) => {
      const current = latest.current;
      if (!current) return;
      const next = { ...current, ...(typeof changes === 'function' ? changes(current) : changes) };
      latest.current = next;
      dirty.current = true;
      setDraft(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => {
      sub.remove();
      flush();
    };
  }, [flush]);

  return { draft, update, flush };
}
