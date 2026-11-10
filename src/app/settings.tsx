import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/Button';
import { useHeaderInset } from '../components/useHeaderInset';
import { deleteAllData } from '../db/database';
import { getLanguageSetting, setLanguageSetting } from '../db/settings';
import i18n, { resolveLanguage, SUPPORTED_LANGUAGES, type LanguageSetting } from '../i18n';
import { cancelAllReminders, rescheduleAll } from '../notifications/reminders';
import { radius, spacing, useColors } from '../theme';

const LANGUAGE_OPTIONS: LanguageSetting[] = ['system', ...SUPPORTED_LANGUAGES];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const inset = useHeaderInset();
  const [language, setLanguage] = useState<LanguageSetting>(getLanguageSetting);
  const [languageOpen, setLanguageOpen] = useState(false);

  const languageName = (setting: LanguageSetting) =>
    setting === 'system' ? t('settings.languageSystem') : t(`languages.${setting}`);

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
    <View onLayout={inset.onLayout} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: inset.paddingTop + spacing.md }]}
      >
        {sectionTitle(t('settings.general'))}
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: languageOpen }}
            onPress={() => setLanguageOpen(!languageOpen)}
            style={styles.row}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>{t('settings.language')}</Text>
            <View style={styles.rowEnd}>
              <Text style={[styles.rowValue, { color: colors.textMuted }]}>{languageName(language)}</Text>
              <Ionicons name={languageOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </View>
          </Pressable>
          {languageOpen &&
            LANGUAGE_OPTIONS.map((option) => {
              const selected = option === language;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => chooseLanguage(option)}
                  style={[
                    styles.row,
                    styles.option,
                    { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={[styles.rowText, { color: colors.text }]}>{languageName(option)}</Text>
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
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/about')} style={styles.row}>
            <Text style={[styles.rowText, { color: colors.text }]}>{t('about.title')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/faq')}
            style={[styles.row, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>{t('faq.title')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/onboarding')}
            style={[styles.row, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>{t('settings.disclaimer')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {sectionTitle(t('settings.data'))}
        <Text style={[styles.note, { color: colors.textMuted }]}>{t('settings.privacyNote')}</Text>
        <Button title={t('settings.deleteAll')} variant="danger" onPress={confirmDeleteAll} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  rowValue: { fontSize: 16, flexShrink: 1 },
  option: { paddingLeft: spacing.lg },
  note: { fontSize: 15, lineHeight: 21 },
});
