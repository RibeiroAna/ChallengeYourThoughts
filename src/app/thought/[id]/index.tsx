import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useScaleLabel } from '../../../components/BeliefSlider';
import { Button } from '../../../components/Button';
import { StatusBadge } from '../../../components/StatusBadge';
import { ThoughtSummary } from '../../../components/ThoughtSummary';
import { useHeaderInset } from '../../../components/useHeaderInset';
import {
  deleteThought,
  getThought,
  saveThought,
  type ThoughtWithDetails,
} from '../../../db/thoughts';
import { shareThoughtAsMarkdown } from '../../../export/markdown';
import { radius, spacing, useColors } from '../../../theme';

export default function ThoughtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const inset = useHeaderInset();
  const scaleLabel = useScaleLabel();
  const [thought, setThought] = useState<ThoughtWithDetails | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      setThought(getThought(Number(id)));
    }, [id]),
  );

  if (thought === undefined) return null;
  if (thought === null) {
    return (
      <View
        onLayout={inset.onLayout}
        style={[styles.screen, styles.center, { backgroundColor: colors.background, paddingTop: inset.paddingTop }]}
      >
        <Text style={{ color: colors.text }}>{t('detail.notFound')}</Text>
      </View>
    );
  }

  const openFlow = (step: number) =>
    router.push({ pathname: '/thought/[id]/challenge', params: { id: String(thought.id), step: String(step) } });

  const startChallenge = () => {
    saveThought({ ...thought, status: 'in_progress', currentStep: 3 });
    openFlow(3);
  };

  const confirmDelete = () =>
    Alert.alert(t('detail.deleteTitle'), t('detail.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteThought(thought.id);
          router.back();
        },
      },
    ]);

  const download = () =>
    shareThoughtAsMarkdown(thought, t, i18n.language).catch(() => Alert.alert(t('detail.exportError')));

  const beliefText = (value: number) => `${value}% · ${scaleLabel('belief', value)}`;

  const row = (label: string, value: string) => (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );

  const reachedChallenge = thought.status !== 'saved' && thought.currentStep >= 3;
  const date = new Date(thought.createdAt).toLocaleString(i18n.language, { dateStyle: 'long', timeStyle: 'short' });

  return (
    <View
      onLayout={inset.onLayout}
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: inset.paddingTop }]}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('detail.download')}
              onPress={download}
              hitSlop={12}
            >
              <Ionicons name="download-outline" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metaRow}>
          <StatusBadge status={thought.status} />
          <Text style={[styles.label, { color: colors.textMuted }]}>{t('detail.createdAt', { date })}</Text>
        </View>
        <View style={[styles.quote, { borderLeftColor: colors.primary, backgroundColor: colors.surface }]}>
          <Text style={[styles.quoteText, { color: colors.text }]}>{thought.text}</Text>
        </View>
        {row(t('detail.initialBelief'), beliefText(thought.initialBelief))}
        {reachedChallenge && (
          <>
            <ThoughtSummary thought={thought} showBalance={thought.status === 'challenged'} />
            {thought.alternativeThought ? row(t('detail.alternative'), thought.alternativeThought) : null}
            {thought.finalBelief != null && row(t('detail.finalBelief'), beliefText(thought.finalBelief))}
            {thought.alternativeBelief != null &&
              row(t('detail.alternativeBelief'), beliefText(thought.alternativeBelief))}
          </>
        )}
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
        {thought.status === 'saved' && <Button title={t('detail.startChallenge')} onPress={startChallenge} />}
        {thought.status === 'in_progress' && (
          <Button title={t('detail.continueChallenge')} onPress={() => openFlow(thought.currentStep)} />
        )}
        <View style={styles.actionRow}>
          <Button
            title={t('detail.editChallenge')}
            variant="secondary"
            onPress={() => openFlow(1)}
            style={styles.flex}
          />
          <Button title={t('common.delete')} variant="danger" onPress={confirmDelete} style={styles.flex} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  quote: { borderLeftWidth: 4, borderRadius: radius.sm, padding: spacing.md },
  quoteText: { fontSize: 18, lineHeight: 26 },
  row: { gap: 2 },
  label: { fontSize: 14 },
  value: { fontSize: 16, lineHeight: 22 },
  actions: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
});
