import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BeliefSlider } from '../components/BeliefSlider';
import { Button } from '../components/Button';
import { DictationInput } from '../components/DictationInput';
import { Mascot } from '../components/Mascot';
import {
  DEFAULT_WEIGHT,
  newEvidenceKey,
  type Evidence,
  type EvidenceSide,
  type ThoughtWithDetails,
} from '../db/thoughts';
import { PATTERN_IDS } from '../patterns';
import { radius, spacing, useColors, type Colors } from '../theme';

interface StepProps {
  draft: ThoughtWithDetails;
  update: (changes: Partial<ThoughtWithDetails> | ((d: ThoughtWithDetails) => Partial<ThoughtWithDetails>)) => void;
}

function StepHeader({ title, hint }: { title: string; hint?: string }) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {hint && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
    </View>
  );
}

function ThoughtQuote({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View style={[styles.quote, { borderLeftColor: colors.primary, backgroundColor: colors.surface }]}>
      <Text style={[styles.quoteText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

// Step 1 — capture the thought

export function ThoughtStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  return (
    <>
      <Mascot variant="laptop" size={140} />
      <StepHeader title={t('flow.step1.title')} hint={t('flow.step1.hint')} />
      <DictationInput
        label={t('flow.step1.title')}
        value={draft.text}
        onChangeText={(text) => update({ text })}
        placeholder={t('flow.step1.placeholder')}
        minHeight={140}
        autoFocus={!draft.text}
      />
    </>
  );
}

// Step 2 — initial belief

export function InitialBeliefStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  return (
    <>
      <ThoughtQuote text={draft.text} />
      <StepHeader title={t('flow.step2.title')} />
      <BeliefSlider
        label={t('detail.initialBelief')}
        value={draft.initialBelief}
        onChange={(initialBelief) => update({ initialBelief })}
      />
    </>
  );
}

// Step 3 — evidence

function EvidenceItem({
  item,
  onChange,
  onRemove,
  colors,
}: {
  item: Evidence;
  onChange: (changes: Partial<Evidence>) => void;
  onRemove: () => void;
  colors: Colors;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.evidence, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.evidenceTop}>
        <View style={styles.flex}>
          <DictationInput
            label={t('flow.step3.placeholder')}
            value={item.text}
            onChangeText={(text) => onChange({ text })}
            placeholder={t('flow.step3.placeholder')}
            minHeight={48}
            autoFocus={!item.text}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('flow.step3.remove')}
          onPress={onRemove}
          hitSlop={8}
          style={styles.remove}
        >
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      <BeliefSlider
        label={t('flow.step3.weight', { value: item.weight })}
        valueLabel=""
        min={1}
        max={100}
        value={item.weight}
        onChange={(weight) => onChange({ weight })}
      />
    </View>
  );
}

function EvidenceBalance({ evidence }: { evidence: Evidence[] }) {
  const { t } = useTranslation();
  const colors = useColors();
  const total = (side: EvidenceSide) =>
    evidence.filter((e) => e.side === side && e.text.trim()).reduce((sum, e) => sum + e.weight, 0);
  const forTotal = total('for');
  const againstTotal = total('against');
  if (forTotal + againstTotal === 0) return null;
  const forShare = forTotal / (forTotal + againstTotal);
  return (
    <View
      style={styles.balance}
      accessible
      accessibilityLabel={`${t('flow.step3.balanceLabel')}: ${t('flow.step3.balanceFor', { value: forTotal })}, ${t('flow.step3.balanceAgainst', { value: againstTotal })}`}
    >
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('flow.step3.balanceLabel')}</Text>
      <View style={styles.balanceBar}>
        <View style={{ flex: forShare, backgroundColor: colors.evidenceFor }} />
        <View style={{ flex: 1 - forShare, backgroundColor: colors.evidenceAgainst }} />
      </View>
      <View style={styles.balanceLegend}>
        <Text style={{ color: colors.evidenceFor }}>{t('flow.step3.balanceFor', { value: forTotal })}</Text>
        <Text style={{ color: colors.evidenceAgainst }}>{t('flow.step3.balanceAgainst', { value: againstTotal })}</Text>
      </View>
    </View>
  );
}

export function EvidenceStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const add = (side: EvidenceSide) =>
    update((d) => ({ evidence: [...d.evidence, { key: newEvidenceKey(), side, text: '', weight: DEFAULT_WEIGHT }] }));
  const change = (key: string, changes: Partial<Evidence>) =>
    update((d) => ({ evidence: d.evidence.map((e) => (e.key === key ? { ...e, ...changes } : e)) }));
  const remove = (key: string) => update((d) => ({ evidence: d.evidence.filter((e) => e.key !== key) }));

  const section = (side: EvidenceSide) => (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View
          style={[styles.dot, { backgroundColor: side === 'for' ? colors.evidenceFor : colors.evidenceAgainst }]}
        />
        <Text accessibilityRole="header" style={[styles.sectionLabel, { color: colors.text }]}>
          {t(side === 'for' ? 'flow.step3.for' : 'flow.step3.against')}
        </Text>
      </View>
      {draft.evidence
        .filter((e) => e.side === side)
        .map((item) => (
          <EvidenceItem
            key={item.key}
            item={item}
            colors={colors}
            onChange={(changes) => change(item.key, changes)}
            onRemove={() => remove(item.key)}
          />
        ))}
      <Button
        title={t(side === 'for' ? 'flow.step3.addFor' : 'flow.step3.addAgainst')}
        variant="secondary"
        onPress={() => add(side)}
      />
    </View>
  );

  return (
    <>
      <ThoughtQuote text={draft.text} />
      <StepHeader title={t('flow.step3.title')} hint={t('flow.step3.hint')} />
      {section('for')}
      {section('against')}
      <EvidenceBalance evidence={draft.evidence} />
    </>
  );
}

// Step 4 — thinking patterns

export function PatternsStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) =>
    update((d) => ({
      patterns: d.patterns.includes(id) ? d.patterns.filter((p) => p !== id) : [...d.patterns, id],
    }));

  return (
    <>
      <ThoughtQuote text={draft.text} />
      <StepHeader title={t('flow.step4.title')} hint={t('flow.step4.hint')} />
      <View style={styles.patterns}>
        {PATTERN_IDS.map((id) => {
          const selected = draft.patterns.includes(id);
          const open = expanded === id;
          return (
            <View
              key={id}
              style={[
                styles.pattern,
                {
                  backgroundColor: selected ? colors.primarySoft : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.patternRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={t(`patterns.${id}.name`)}
                  onPress={() => toggle(id)}
                  hitSlop={8}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={26}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => setExpanded(open ? null : id)}
                  style={styles.patternName}
                >
                  <Text style={[styles.patternTitle, { color: colors.text }]}>{t(`patterns.${id}.name`)}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
                </Pressable>
              </View>
              {open && (
                <View style={styles.patternDetails}>
                  <Text style={[styles.body, { color: colors.text }]}>{t(`patterns.${id}.description`)}</Text>
                  <Text style={[styles.body, { color: colors.textMuted }]}>
                    <Text style={{ fontWeight: '600' }}>{t('flow.step4.example')}: </Text>
                    {t(`patterns.${id}.example`)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </>
  );
}

// Step 5 — re-evaluation

export function ReevaluationStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const finalBelief = draft.finalBelief ?? draft.initialBelief;

  return (
    <>
      <ThoughtQuote text={draft.text} />
      <StepHeader title={t('flow.step5.title')} />
      <DictationInput
        label={t('flow.step5.alternativeLabel')}
        value={draft.alternativeThought ?? ''}
        onChangeText={(alternativeThought) => update({ alternativeThought })}
        placeholder={t('flow.step5.alternativePlaceholder')}
        minHeight={120}
      />
      <BeliefSlider
        label={t('flow.step5.rerate')}
        value={finalBelief}
        onChange={(value) => update({ finalBelief: value })}
      />
      <Text style={[styles.change, { color: colors.primary }]}>
        {t('flow.step5.change', { before: draft.initialBelief, after: finalBelief })}
      </Text>
      {draft.alternativeBelief == null ? (
        <View style={styles.optionalRow}>
          <Text style={[styles.body, styles.flex, { color: colors.text }]}>{t('flow.step5.alternativeBelief')}</Text>
          <Button
            title={t('flow.step5.rateAlternative')}
            variant="secondary"
            onPress={() => update({ alternativeBelief: 50 })}
          />
        </View>
      ) : (
        <View style={styles.optional}>
          <BeliefSlider
            label={t('flow.step5.alternativeBelief')}
            value={draft.alternativeBelief}
            onChange={(alternativeBelief) => update({ alternativeBelief })}
          />
          <Button
            title={t('flow.step5.skipAlternative')}
            variant="ghost"
            onPress={() => update({ alternativeBelief: null })}
            style={styles.alignEnd}
          />
        </View>
      )}
    </>
  );
}

// Completion

export function CompleteStep({ before, after, onDone }: { before: number; after: number; onDone: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.complete}>
        <Mascot variant="stretch" size={220} />
        <Text accessibilityRole="header" style={[styles.title, styles.centerText, { color: colors.text }]}>
          {t('flow.complete.title')}
        </Text>
        <Text style={[styles.body, styles.centerText, { color: colors.text }]}>{t('flow.complete.body')}</Text>
        <Text style={[styles.change, styles.centerText, { color: colors.primary }]}>
          {t('flow.step5.change', { before, after })}
        </Text>
      </ScrollView>
      <View style={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.md }}>
        <Button title={t('flow.complete.backHome')} onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.xs },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  hint: { fontSize: 15, lineHeight: 21 },
  body: { fontSize: 16, lineHeight: 22 },
  centerText: { textAlign: 'center' },
  quote: { borderLeftWidth: 4, borderRadius: radius.sm, padding: spacing.md },
  quoteText: { fontSize: 16, lineHeight: 22, fontStyle: 'italic' },
  section: { gap: spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionLabel: { fontSize: 17, fontWeight: '600' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  evidence: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  evidenceTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  remove: { padding: spacing.xs, marginTop: spacing.sm },
  balance: { gap: spacing.sm, marginTop: spacing.sm },
  balanceBar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  balanceLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  patterns: { gap: spacing.sm },
  pattern: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  patternRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  checkbox: { padding: spacing.xs },
  patternName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xs,
    gap: spacing.sm,
  },
  patternTitle: { flex: 1, fontSize: 16, fontWeight: '500' },
  patternDetails: { gap: spacing.sm, paddingBottom: spacing.md, paddingLeft: 42, paddingRight: spacing.sm },
  change: { fontSize: 17, fontWeight: '600' },
  optionalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optional: { gap: spacing.xs },
  alignEnd: { alignSelf: 'flex-end' },
  complete: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
});
