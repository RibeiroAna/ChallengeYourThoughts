import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

const MIGRATIONS: string[] = [
  // v1
  `
  CREATE TABLE thoughts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    initialBelief INTEGER NOT NULL DEFAULT 50,
    status TEXT NOT NULL CHECK (status IN ('saved', 'in_progress', 'challenged')),
    alternativeThought TEXT,
    finalBelief INTEGER,
    alternativeBelief INTEGER,
    currentStep INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thoughtId INTEGER NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('for', 'against')),
    text TEXT NOT NULL DEFAULT '',
    weight INTEGER NOT NULL DEFAULT 50,
    "order" INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX evidence_thought ON evidence(thoughtId);
  CREATE TABLE thought_patterns (
    thoughtId INTEGER NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    patternId TEXT NOT NULL,
    PRIMARY KEY (thoughtId, patternId)
  );
  CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT NOT NULL,
    weekdays TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    notificationIds TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  // v2: positive and negative sides of a thought, as step 3; steps 3–6 became 4, 5, 7 and 8.
  `
  CREATE TABLE effects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thoughtId INTEGER NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('positive', 'negative')),
    text TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX effects_thought ON effects(thoughtId);
  UPDATE thoughts SET currentStep = CASE currentStep WHEN 3 THEN 4 WHEN 4 THEN 5 WHEN 5 THEN 7 WHEN 6 THEN 8 ELSE currentStep END;
  `,
];

/** Opens the local database and applies pending migrations. Synchronous so settings are ready before first render. */
export function getDb(): SQLite.SQLiteDatabase {
  if (db) return db;
  db = SQLite.openDatabaseSync('thoughts.db');
  db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA secure_delete = ON;');
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  for (let v = version; v < MIGRATIONS.length; v++) {
    const migration = MIGRATIONS[v];
    const database = db;
    database.withTransactionSync(() => {
      database.execSync(migration);
      database.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
  return db;
}

/** Removes every thought, reminder and setting, without leaving old content in free pages or the WAL file. */
export function deleteAllData() {
  const database = getDb();
  database.withTransactionSync(() => {
    database.execSync(
      'DELETE FROM thought_patterns; DELETE FROM effects; DELETE FROM evidence; DELETE FROM thoughts; DELETE FROM reminders; DELETE FROM settings;',
    );
  });
  database.execSync('VACUUM; PRAGMA wal_checkpoint(TRUNCATE);');
}
