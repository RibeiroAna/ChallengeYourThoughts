import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useHeaderInset } from '../components/useHeaderInset';
import { radius, spacing, useColors } from '../theme';

/** Question ids, in display order. Text lives in the translation files under `faq.<id>`. */
const QUESTIONS = ['what', 'noAi', 'example', 'belief', 'patterns', 'privacy', 'dictation', 'share', 'therapy'] as const;
type QuestionId = (typeof QUESTIONS)[number];

export default function FaqScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const inset = useHeaderInset();
  const [open, setOpen] = useState<ReadonlySet<QuestionId>>(new Set());

  const toggle = (id: QuestionId) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <View onLayout={inset.onLayout} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: inset.paddingTop + spacing.md }]}>
        {QUESTIONS.map((id) => {
          const expanded = open.has(id);
          return (
            <View key={id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => toggle(id)}
                style={styles.questionRow}
              >
                <Text style={[styles.question, { color: colors.text }]}>{t(`faq.${id}.question`)}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
              </Pressable>
              {expanded && <Text style={[styles.answer, { color: colors.text }]}>{t(`faq.${id}.answer`)}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  question: { flex: 1, fontSize: 17, fontWeight: '600', lineHeight: 23 },
  answer: { fontSize: 16, lineHeight: 23, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
