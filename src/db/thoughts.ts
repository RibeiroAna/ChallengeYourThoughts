import { getDb } from './database';

export type ThoughtStatus = 'saved' | 'in_progress' | 'challenged';
export type EvidenceSide = 'for' | 'against';

export interface Evidence {
  /** Local key for list rendering; database ids are reassigned on every save. */
  key: string;
  side: EvidenceSide;
  text: string;
  weight: number;
}

export interface Thought {
  id: number;
  createdAt: string;
  updatedAt: string;
  text: string;
  initialBelief: number;
  status: ThoughtStatus;
  alternativeThought: string | null;
  finalBelief: number | null;
  alternativeBelief: number | null;
  currentStep: number;
}

export interface ThoughtWithDetails extends Thought {
  evidence: Evidence[];
  patterns: string[];
}

export const DEFAULT_BELIEF = 50;
export const DEFAULT_WEIGHT = 50;

let keyCounter = 0;
export function newEvidenceKey() {
  keyCounter += 1;
  return `e${Date.now()}-${keyCounter}`;
}

export function listThoughts(): Thought[] {
  return getDb().getAllSync<Thought>('SELECT * FROM thoughts ORDER BY createdAt DESC, id DESC');
}

export function getThought(id: number): ThoughtWithDetails | null {
  const db = getDb();
  const thought = db.getFirstSync<Thought>('SELECT * FROM thoughts WHERE id = ?', id);
  if (!thought) return null;
  const evidence = db
    .getAllSync<{ id: number; side: EvidenceSide; text: string; weight: number }>(
      'SELECT id, side, text, weight FROM evidence WHERE thoughtId = ? ORDER BY "order", id',
      id,
    )
    .map((e) => ({ key: `db${e.id}`, side: e.side, text: e.text, weight: e.weight }));
  const patterns = db
    .getAllSync<{ patternId: string }>('SELECT patternId FROM thought_patterns WHERE thoughtId = ?', id)
    .map((p) => p.patternId);
  return { ...thought, evidence, patterns };
}

export function createThought(text: string, initialBelief = DEFAULT_BELIEF): number {
  const now = new Date().toISOString();
  const result = getDb().runSync(
    'INSERT INTO thoughts (createdAt, updatedAt, text, initialBelief, status, currentStep) VALUES (?, ?, ?, ?, ?, ?)',
    now,
    now,
    text,
    initialBelief,
    'in_progress',
    1,
  );
  return result.lastInsertRowId;
}

/** Writes the whole thought, replacing its evidence and patterns. */
export function saveThought(thought: ThoughtWithDetails) {
  const db = getDb();
  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE thoughts SET updatedAt = ?, text = ?, initialBelief = ?, status = ?, alternativeThought = ?,
         finalBelief = ?, alternativeBelief = ?, currentStep = ? WHERE id = ?`,
      now,
      thought.text,
      thought.initialBelief,
      thought.status,
      thought.alternativeThought,
      thought.finalBelief,
      thought.alternativeBelief,
      thought.currentStep,
      thought.id,
    );
    db.runSync('DELETE FROM evidence WHERE thoughtId = ?', thought.id);
    thought.evidence.forEach((e, index) => {
      db.runSync(
        'INSERT INTO evidence (thoughtId, side, text, weight, "order") VALUES (?, ?, ?, ?, ?)',
        thought.id,
        e.side,
        e.text,
        e.weight,
        index,
      );
    });
    db.runSync('DELETE FROM thought_patterns WHERE thoughtId = ?', thought.id);
    for (const patternId of thought.patterns) {
      db.runSync('INSERT INTO thought_patterns (thoughtId, patternId) VALUES (?, ?)', thought.id, patternId);
    }
  });
}

export function deleteThought(id: number) {
  getDb().runSync('DELETE FROM thoughts WHERE id = ?', id);
}
