import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

import i18n from '../i18n';
import {
  deleteReminderRow,
  getReminder,
  insertReminder,
  listReminders,
  updateReminder,
  type Reminder,
} from '../db/reminders';

const CHANNEL_ID = 'reminders';
/** Route opened when a reminder notification is tapped. */
export const NEW_THOUGHT_URL = '/thought/new';

/** Local notifications only: nothing here talks to a push server. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t('reminders.channelName'),
    importance: AndroidImportance.DEFAULT,
  });
}

/** Asks for permission only when needed, i.e. the first time the user sets a reminder. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function cancel(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

async function schedule(reminder: Pick<Reminder, 'time' | 'weekdays' | 'enabled'>): Promise<string[]> {
  if (!reminder.enabled || reminder.weekdays.length === 0) return [];
  await ensureChannel();
  const [hour, minute] = reminder.time.split(':').map(Number);
  const ids: string[] = [];
  for (const weekday of reminder.weekdays) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('reminders.notificationTitle'),
        body: i18n.t('reminders.notificationBody'),
        data: { url: NEW_THOUGHT_URL },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
    ids.push(id);
  }
  return ids;
}

// Changes run one at a time so quick edits (e.g. scrolling a time picker) can't leave stray notifications.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

export function addReminder(time: string, weekdays: number[]): Promise<Reminder> {
  return serial(async () => {
    const draft = { time, weekdays, enabled: true };
    const notificationIds = await schedule(draft);
    const id = insertReminder({ ...draft, notificationIds });
    return { id, ...draft, notificationIds };
  });
}

export function saveReminder(reminder: Reminder): Promise<Reminder> {
  return serial(async () => {
    // The stored ids are the ones actually scheduled; the caller's copy may be stale.
    await cancel(getReminder(reminder.id)?.notificationIds ?? reminder.notificationIds);
    const notificationIds = await schedule(reminder);
    const updated = { ...reminder, notificationIds };
    updateReminder(updated);
    return updated;
  });
}

export function removeReminder(reminder: Reminder): Promise<void> {
  return serial(async () => {
    await cancel(getReminder(reminder.id)?.notificationIds ?? reminder.notificationIds);
    deleteReminderRow(reminder.id);
  });
}

/** Re-creates all notifications, e.g. after a language change so their text is in the new language. */
export async function rescheduleAll() {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  for (const reminder of listReminders()) {
    await saveReminder(reminder);
  }
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
