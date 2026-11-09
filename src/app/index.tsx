import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { StatusBadge } from '../components/StatusBadge';
import { useHeaderInset } from '../components/useHeaderInset';
import { isOnboardingDone } from '../db/settings';
import { listThoughts, type Thought } from '../db/thoughts';
import { radius, spacing, useColors } from '../theme';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const inset = useHeaderInset();
  const [thoughts, setThoughts] = useState<Thought[]>([]);

  useFocusEffect(
    useCallback(() => {
      setThoughts(listThoughts());
    }, []),
  );

  if (!isOnboardingDone()) return <Redirect href="/onboarding" />;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });

  const belief = (thought: Thought) =>
    thought.finalBelief != null
      ? t('home.beliefChange', { before: thought.initialBelief, after: thought.finalBelief })
      : t('home.belief', { value: thought.initialBelief });

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
              accessibilityLabel={t('home.settings')}
              onPress={() => router.push('/settings')}
              hitSlop={12}
            >
              <Ionicons name="settings-outline" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={thoughts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, thoughts.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Mascot variant="idle" size={200} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('home.emptyTitle')}</Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted }]}>{t('home.emptyBody')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/thought/[id]', params: { id: String(item.id) } })}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={3}>
              {item.text.trim() || t('home.untitled')}
            </Text>
            <View style={styles.cardMeta}>
              <StatusBadge status={item.status} />
              <Text style={[styles.meta, { color: colors.textMuted }]}>{belief(item)}</Text>
              <Text style={[styles.meta, styles.date, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button title={t('home.newThought')} onPress={() => router.push('/thought/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.sm },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  emptyBody: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  cardText: { fontSize: 16, lineHeight: 22 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  meta: { fontSize: 14, fontVariant: ['tabular-nums'] },
  date: { marginLeft: 'auto' },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
