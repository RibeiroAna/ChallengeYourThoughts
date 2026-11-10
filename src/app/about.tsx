import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useHeaderInset } from '../components/useHeaderInset';
import { radius, spacing, useColors } from '../theme';

const CONTACT_EMAIL = 'ChallengeYourThoughts@proton.me';

export default function AboutScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const inset = useHeaderInset();

  return (
    <View onLayout={inset.onLayout} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: inset.paddingTop + spacing.md }]}>
        <Text style={[styles.body, { color: colors.text }]}>{t('about.author')}</Text>
        <Text style={[styles.note, { color: colors.textMuted }]}>{t('about.contact')}</Text>
        <Pressable
          accessibilityRole="link"
          // Opens the user's own mail app; nothing is sent unless they send it there.
          onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`).catch(() => {})}
          style={[styles.emailRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text selectable style={[styles.email, { color: colors.primary }]}>
            {CONTACT_EMAIL}
          </Text>
          <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.note, { color: colors.textMuted }]}>{t('about.license')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  body: { fontSize: 17, lineHeight: 25 },
  note: { fontSize: 15, lineHeight: 21 },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  email: { fontSize: 16, flexShrink: 1 },
});
