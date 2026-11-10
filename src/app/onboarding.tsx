import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/Button';
import { useScaleLabel } from '../components/BeliefSlider';
import { Mascot, type MascotVariant } from '../components/Mascot';
import { ThoughtSummary } from '../components/ThoughtSummary';
import { setOnboardingDone } from '../db/settings';
import { addExampleThoughtOnce, buildExampleThought } from '../example';
import { radius, spacing, useColors } from '../theme';

const PAGES: { key: 'page1' | 'page2' | 'example' | 'page3'; mascot?: MascotVariant }[] = [
  { key: 'page1', mascot: 'stretch' },
  { key: 'page2', mascot: 'laptop' },
  // No mascot: the example is long and is the point of the page.
  { key: 'example' },
  { key: 'page3', mascot: 'idle' },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const scaleLabel = useScaleLabel();
  const [index, setIndex] = useState(0);
  const page = PAGES[index];
  const last = index === PAGES.length - 1;
  const example = useMemo(() => buildExampleThought(t), [t]);

  const finish = () => {
    // Added again here after "delete all data", which clears the flag without restarting the app.
    addExampleThoughtOnce();
    setOnboardingDone(true);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.top}>
        <Text style={[styles.progress, { color: colors.textMuted }]}>
          {t('flow.stepOf', { current: index + 1, total: PAGES.length })}
        </Text>
        {!last && <Button title={t('onboarding.skip')} variant="ghost" onPress={finish} />}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {page.mascot && <Mascot key={page.mascot} variant={page.mascot} size={200} />}
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          {t(`onboarding.${page.key}.title`)}
        </Text>
        <Text style={[styles.body, { color: colors.text }]}>{t(`onboarding.${page.key}.body`)}</Text>
        {page.key === 'example' && (
          <View style={[styles.example, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.quote, { borderLeftColor: colors.primary }]}>
              <Text style={[styles.quoteText, { color: colors.text }]}>{example.text}</Text>
            </View>
            <ThoughtSummary thought={example} showBalance />
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('detail.alternative')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{example.alternativeThought}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.value, { color: colors.text, fontWeight: '600' }]}>
                {t('flow.step8.change', { before: example.initialBelief, after: example.finalBelief })}
              </Text>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {scaleLabel('belief', example.initialBelief)} → {scaleLabel('belief', example.finalBelief ?? 0)}
              </Text>
            </View>
          </View>
        )}
        {page.key === 'page3' && (
          <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.noticeText, { color: colors.text }]}>{t('onboarding.page3.disclaimer')}</Text>
            <Text style={[styles.noticeText, { color: colors.text, fontWeight: '600' }]}>
              {t('onboarding.page3.crisis')}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.actions}>
        {index > 0 && (
          <Button title={t('common.back')} variant="secondary" onPress={() => setIndex(index - 1)} style={styles.flex} />
        )}
        <Button
          title={last ? t('onboarding.start') : t('common.next')}
          onPress={last ? finish : () => setIndex(index + 1)}
          style={styles.flex}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  progress: { fontSize: 14 },
  content: { padding: spacing.lg, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 17, lineHeight: 25, textAlign: 'center' },
  notice: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  noticeText: { fontSize: 15, lineHeight: 21 },
  example: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  quote: { borderLeftWidth: 4, paddingLeft: spacing.md },
  quoteText: { fontSize: 18, lineHeight: 26 },
  row: { gap: 2 },
  label: { fontSize: 14 },
  value: { fontSize: 16, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  flex: { flex: 1 },
});
