import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { getCalendars } from 'expo-localization';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/Button';
import { useHeaderInset } from '../components/useHeaderInset';
import { listReminders, type Reminder } from '../db/reminders';
import { addReminder, ensurePermission, removeReminder, saveReminder } from '../notifications/reminders';
import { radius, spacing, useColors } from '../theme';

const DEFAULT_TIME = '20:00';
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** Weekdays (1 = Sunday) in the order the device calendar starts the week. */
function orderedWeekdays(): number[] {
  const first = getCalendars()[0]?.firstWeekday ?? 2;
  return ALL_DAYS.map((_, i) => ((first - 1 + i) % 7) + 1);
}

function toDate(time: string) {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

function toTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function ReminderCard({
  reminder,
  onChange,
  onDelete,
}: {
  reminder: Reminder;
  onChange: (r: Reminder) => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const formatted = toDate(reminder.time).toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' });

  const toggleDay = (day: number) => {
    const weekdays = reminder.weekdays.includes(day)
      ? reminder.weekdays.filter((d) => d !== day)
      : [...reminder.weekdays, day].sort();
    onChange({ ...reminder, weekdays });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            mode="time"
            display="compact"
            locale={i18n.language}
            value={toDate(reminder.time)}
            onValueChange={(_, date) => onChange({ ...reminder, time: toTime(date) })}
            accessibilityLabel={t('reminders.time')}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('reminders.time')}: ${formatted}`}
            onPress={() => setShowAndroidPicker(true)}
          >
            <Text style={[styles.time, { color: colors.text }]}>{formatted}</Text>
          </Pressable>
        )}
        <View style={styles.enabled}>
          <Text style={{ color: colors.textMuted }}>{t('reminders.enabled')}</Text>
          <Switch
            accessibilityLabel={t('reminders.enabled')}
            value={reminder.enabled}
            onValueChange={(enabled) => onChange({ ...reminder, enabled })}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </View>
      {showAndroidPicker && (
        <DateTimePicker
          mode="time"
          value={toDate(reminder.time)}
          onValueChange={(_, date) => {
            setShowAndroidPicker(false);
            onChange({ ...reminder, time: toTime(date) });
          }}
          onDismiss={() => setShowAndroidPicker(false)}
        />
      )}
      <Text style={[styles.label, { color: colors.textMuted }]}>{t('reminders.weekdays')}</Text>
      <View style={styles.days}>
        {orderedWeekdays().map((day) => {
          const on = reminder.weekdays.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggleDay(day)}
              style={[
                styles.day,
                on ? { backgroundColor: colors.primary } : { borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Text style={{ color: on ? colors.primaryText : colors.text, fontWeight: '600', fontSize: 13 }}>
                {t(`weekdays.${day}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {reminder.weekdays.length === 0 && (
        <Text style={[styles.label, { color: colors.danger }]}>{t('reminders.noDays')}</Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('reminders.delete')}
        onPress={onDelete}
        style={styles.delete}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={{ color: colors.danger }}>{t('reminders.delete')}</Text>
      </Pressable>
    </View>
  );
}

export default function RemindersScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const inset = useHeaderInset();
  const [reminders, setReminders] = useState<Reminder[]>(() => listReminders());
  const [denied, setDenied] = useState(false);

  const add = async () => {
    const granted = await ensurePermission();
    setDenied(!granted);
    if (!granted) return;
    const reminder = await addReminder(DEFAULT_TIME, ALL_DAYS);
    setReminders((list) => [...list, reminder]);
  };

  const change = async (reminder: Reminder) => {
    setReminders((list) => list.map((r) => (r.id === reminder.id ? reminder : r)));
    await saveReminder(reminder);
  };

  const remove = async (reminder: Reminder) => {
    await removeReminder(reminder);
    setReminders((list) => list.filter((r) => r.id !== reminder.id));
  };

  return (
    <View onLayout={inset.onLayout} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: inset.paddingTop + spacing.md }]}
      >
        {reminders.length === 0 && (
          <Text style={[styles.empty, { color: colors.textMuted }]}>{t('reminders.empty')}</Text>
        )}
        {reminders.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} onChange={change} onDelete={() => remove(reminder)} />
        ))}
        {denied && <Text style={[styles.empty, { color: colors.danger }]}>{t('reminders.permissionDenied')}</Text>}
        <Button title={t('reminders.add')} variant="secondary" onPress={add} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  empty: { fontSize: 16, lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontSize: 28, fontWeight: '600', fontVariant: ['tabular-nums'] },
  enabled: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 14 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  day: {
    minWidth: 42,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
