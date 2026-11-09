import { useCallback, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/Button';
import { spacing, useColors } from '../theme';
import { CompleteStep, EvidenceStep, InitialBeliefStep, PatternsStep, ReevaluationStep, ThoughtStep } from './steps';
import { useThoughtDraft } from './useThoughtDraft';

const TOTAL_STEPS = 5;
type Step = 1 | 2 | 3 | 4 | 5 | 'complete';

function clampStep(step: number | undefined): 1 | 2 | 3 | 4 | 5 {
  if (!step || step < 1) return 1;
  return Math.min(Math.round(step), TOTAL_STEPS) as 1 | 2 | 3 | 4 | 5;
}

interface Props {
  /** null for a brand-new thought */
  thoughtId: number | null;
  /** Step to open on; defaults to where the draft was left. */
  initialStep?: number;
}

export function ThoughtFlow({ thoughtId, initialStep }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { draft, update, flush } = useThoughtDraft(thoughtId);
  const [step, setStep] = useState<Step>(() => clampStep(initialStep ?? draft?.currentStep));

  const goTo = useCallback(
    (next: 1 | 2 | 3 | 4 | 5) => {
      setStep(next);
      update((d) => ({ currentStep: next, status: next >= 3 && d.status === 'saved' ? 'in_progress' : d.status }));
    },
    [update],
  );

  // Android back button moves to the previous step instead of leaving the flow.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (typeof step === 'number' && step > 1) {
          goTo((step - 1) as 1 | 2 | 3 | 4);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [step, goTo]),
  );

  if (!draft) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t('detail.notFound')}</Text>
      </View>
    );
  }

  const leave = () => {
    flush();
    router.back();
  };

  const saveOnly = () => {
    update((d) => ({ status: d.status === 'challenged' ? 'challenged' : 'saved', currentStep: 2 }));
    leave();
  };

  const saveAndChallenge = () => {
    update((d) => ({ status: d.status === 'challenged' ? 'challenged' : 'in_progress' }));
    goTo(3);
  };

  const finish = () => {
    update((d) => ({ status: 'challenged', finalBelief: d.finalBelief ?? d.initialBelief, currentStep: 5 }));
    flush();
    setStep('complete');
  };

  if (step === 'complete') {
    return (
      <CompleteStep
        before={draft.initialBelief}
        after={draft.finalBelief ?? draft.initialBelief}
        onDone={() => router.dismissTo('/')}
      />
    );
  }

  const hasText = draft.text.trim().length > 0;
  const stepContent = {
    1: <ThoughtStep draft={draft} update={update} />,
    2: <InitialBeliefStep draft={draft} update={update} />,
    3: <EvidenceStep draft={draft} update={update} />,
    4: <PatternsStep draft={draft} update={update} />,
    5: <ReevaluationStep draft={draft} update={update} />,
  }[step];

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.progressRow} accessible accessibilityRole="progressbar">
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          {t('flow.stepOf', { current: step, total: TOTAL_STEPS })}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / TOTAL_STEPS) * 100}%` }]}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {stepContent}
        {step === 2 && (
          // The step 2 decision lives in the content so both choices get full width.
          <View style={styles.choice}>
            <Button title={t('flow.step2.saveAndChallenge')} onPress={saveAndChallenge} />
            <Button title={t('flow.step2.save')} variant="secondary" onPress={saveOnly} />
          </View>
        )}
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.border }]}>
        {step > 1 && (
          <Button
            title={t('common.back')}
            variant="secondary"
            onPress={() => goTo((step - 1) as 1 | 2 | 3 | 4)}
            style={step === 2 ? styles.flex : styles.backButton}
          />
        )}
        {step === 5 ? (
          <Button title={t('flow.step5.finish')} onPress={finish} style={styles.flex} />
        ) : step !== 2 ? (
          <Button
            title={t('common.next')}
            onPress={() => goTo((step + 1) as 2 | 3 | 4 | 5)}
            disabled={step === 1 && !hasText}
            style={styles.flex}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  progressRow: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  progressText: { fontSize: 13 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  choice: { gap: spacing.sm, marginTop: spacing.md },
  backButton: { paddingHorizontal: spacing.md },
  flex: { flex: 1 },
});
