import { getDb } from './db/database';
import { isExampleAdded, setExampleAdded } from './db/settings';
import { createThought, saveThought, type ThoughtWithDetails } from './db/thoughts';
import i18n from './i18n';
import type { PatternId } from './patterns';

const EXAMPLE_PATTERNS: PatternId[] = ['catastrophising', 'mind_reading'];

/**
 * A finished thought challenge, in the current language, shown during onboarding and added to the
 * thought list. Its text starts with "EXAMPLE" (translated) so it can't be mistaken for the user's own.
 */
export function buildExampleThought(t: (key: string) => string): ThoughtWithDetails {
  const now = new Date().toISOString();
  return {
    id: 0,
    createdAt: now,
    updatedAt: now,
    text: t('example.thought'),
    initialBelief: 80,
    status: 'challenged',
    alternativeThought: t('example.alternative'),
    finalBelief: 35,
    alternativeBelief: 70,
    currentStep: 8,
    effects: [
      { key: 'p1', side: 'positive', text: t('example.positive1') },
      { key: 'n1', side: 'negative', text: t('example.negative1') },
      { key: 'n2', side: 'negative', text: t('example.negative2') },
    ],
    evidence: [
      { key: 'f1', side: 'for', text: t('example.for1'), weight: 60 },
      { key: 'f2', side: 'for', text: t('example.for2'), weight: 30 },
      { key: 'a1', side: 'against', text: t('example.against1'), weight: 80 },
      { key: 'a2', side: 'against', text: t('example.against2'), weight: 70 },
      { key: 'a3', side: 'against', text: t('example.against3'), weight: 75 },
    ],
    patterns: EXAMPLE_PATTERNS,
  };
}

/**
 * Adds the example as the oldest thought, once. After "delete all data" it's added again; if the user
 * deletes only the example, it stays deleted.
 */
export function addExampleThoughtOnce() {
  if (isExampleAdded()) return;
  const oldest = getDb().getFirstSync<{ createdAt: string | null }>('SELECT MIN(createdAt) AS createdAt FROM thoughts');
  const createdAt = oldest?.createdAt
    ? new Date(new Date(oldest.createdAt).getTime() - 60_000).toISOString()
    : new Date().toISOString();
  const example = buildExampleThought((key) => i18n.t(key));
  const id = createThought(example.text, example.initialBelief, createdAt);
  saveThought({ ...example, id });
  setExampleAdded();
}
