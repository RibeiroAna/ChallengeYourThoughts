import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/Button';
import { deleteAllData } from '../db/database';
import { getLanguageSetting, setLanguageSetting } from '../db/settings';
import i18n, { resolveLanguage, SUPPORTED_LANGUAGES, type LanguageSetting } from '../i18n';
import { cancelAllReminders, rescheduleAll } from '../notifications/reminders';
import { radius, spacing, useColors } from '../theme';

const LANGUAGE_OPTIONS: LanguageSetting[] = ['system', ...SUPPORTED_LANGUAGES];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const headerHeight = useHeaderHeight();
  const [language, setLanguage] = useState<LanguageSetting>(getLanguageSetting);

  const chooseLanguage = async (setting: LanguageSetting) => {
    setLanguage(setting);
    setLanguageSetting(setting);
    await i18n.changeLanguage(resolveLanguage(setting));
    // Scheduled notifications keep the text they were created with.
    await rescheduleAll();
  };

  const confirmDeleteAll = () =>
    Alert.alert(t('settings.deleteAllTitle'), t('settings.deleteAllBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAllConfirm'),
        style: 'destructive',
        onPress: async () => {
          await cancelAllReminders();
          deleteAllData();
          await i18n.changeLanguage(resolveLanguage('system'));
          router.dismissAll();
          router.replace('/onboarding');
        },
      },
    ]);

  const sectionTitle = (title: string) => (
    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.textMuted }]}>
      {title}
    </Text>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.md }]}
    >
      {sectionTitle(t('settings.language'))}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {LANGUAGE_OPTIONS.map((option, index) => {
          const selected = option === language;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => chooseLanguage(option)}
              style={[styles.row, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
            >
              <Text style={[styles.rowText, { color: colors.text }]}>
                {option === 'system' ? t('settings.languageSystem') : t(`languages.${option}`)}
              </Text>
              {selected && <Ionicons name="checkmark" size={22} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>

      {sectionTitle(t('settings.reminders'))}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/reminders')}
        style={[styles.group, styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.rowText, { color: colors.text }]}>{t('reminders.title')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      {sectionTitle(t('settings.about'))}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/onboarding')}
        style={[styles.group, styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.rowText, { color: colors.text }]}>{t('settings.disclaimer')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      {sectionTitle(t('settings.data'))}
      <Text style={[styles.note, { color: colors.textMuted }]}>{t('settings.privacyNote')}</Text>
      <Button title={t('settings.deleteAll')} variant="danger" onPress={confirmDeleteAll} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginTop: spacing.md },
  group: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  rowText: { fontSize: 16 },
  note: { fontSize: 15, lineHeight: 21 },
});
