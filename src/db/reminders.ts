import { getDb } from './database';

export interface Reminder {
  id: number;
  /** HH:mm, 24-hour */
  time: string;
  /** 1 = Sunday … 7 = Saturday (same convention as expo-notifications weekly triggers) */
  weekdays: number[];
  enabled: boolean;
  notificationIds: string[];
}

interface ReminderRow {
  id: number;
  time: string;
  weekdays: string;
  enabled: number;
  notificationIds: string;
}

function fromRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    time: row.time,
    weekdays: JSON.parse(row.weekdays),
    enabled: row.enabled === 1,
    notificationIds: JSON.parse(row.notificationIds),
  };
}

export function listReminders(): Reminder[] {
  return getDb().getAllSync<ReminderRow>('SELECT * FROM reminders ORDER BY time, id').map(fromRow);
}

export function getReminder(id: number): Reminder | null {
  const row = getDb().getFirstSync<ReminderRow>('SELECT * FROM reminders WHERE id = ?', id);
  return row ? fromRow(row) : null;
}

export function insertReminder(reminder: Omit<Reminder, 'id'>): number {
  const result = getDb().runSync(
    'INSERT INTO reminders (time, weekdays, enabled, notificationIds) VALUES (?, ?, ?, ?)',
    reminder.time,
    JSON.stringify(reminder.weekdays),
    reminder.enabled ? 1 : 0,
    JSON.stringify(reminder.notificationIds),
  );
  return result.lastInsertRowId;
}

export function updateReminder(reminder: Reminder) {
  getDb().runSync(
    'UPDATE reminders SET time = ?, weekdays = ?, enabled = ?, notificationIds = ? WHERE id = ?',
    reminder.time,
    JSON.stringify(reminder.weekdays),
    reminder.enabled ? 1 : 0,
    JSON.stringify(reminder.notificationIds),
    reminder.id,
  );
}

export function deleteReminderRow(id: number) {
  getDb().runSync('DELETE FROM reminders WHERE id = ?', id);
}
