import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BeliefSlider, useScaleLabel } from '../components/BeliefSlider';
import { Button } from '../components/Button';
import { DictationInput } from '../components/DictationInput';
import { EvidenceBalance } from '../components/EvidenceBalance';
import { Mascot } from '../components/Mascot';
import { ThoughtSummary } from '../components/ThoughtSummary';
import {
  DEFAULT_WEIGHT,
  newEvidenceKey,
  type Effect,
  type EffectSide,
  type Evidence,
  type EvidenceSide,
  type ThoughtWithDetails,
} from '../db/thoughts';
import { PATTERN_IDS } from '../patterns';
import { radius, spacing, useColors } from '../theme';

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
        hideLabel
        scale="belief"
        value={draft.initialBelief}
        onChange={(initialBelief) => update({ initialBelief })}
      />
    </>
  );
}

// Steps 3 and 4 — editable lists

/** Which items of a list are open for writing. Existing items start closed. */
function useOpenKeys(items: { key: string; text: string }[]) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(
    () => new Set(items.filter((e) => !e.text.trim()).map((e) => e.key)),
  );
  const setOpen = (key: string, open: boolean) =>
    setOpenKeys((keys) => {
      const next = new Set(keys);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  return [openKeys, setOpen] as const;
}

function SectionTitle({ title, color }: { title: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text accessibilityRole="header" style={[styles.sectionLabel, { color: colors.text }]}>
        {title}
      </Text>
    </View>
  );
}

/** A list item written in place: open while writing, closed (tap to edit) once done. */
function ListItem({
  text,
  meta,
  open,
  onOpen,
  onDone,
  onChangeText,
  onRemove,
  labels,
  children,
}: {
  text: string;
  /** Shown under the text when closed. */
  meta?: string;
  open: boolean;
  onOpen: () => void;
  onDone: () => void;
  onChangeText: (text: string) => void;
  onRemove: () => void;
  labels: { placeholder: string; edit: string; remove: string; done: string };
  /** Extra controls shown under the text while open. */
  children?: ReactNode;
}) {
  const colors = useColors();

  if (!open) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint={labels.edit}
        onPress={onOpen}
        style={[styles.evidence, styles.evidenceClosed, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.flex}>
          <Text style={[styles.body, { color: colors.text }]}>{text}</Text>
          {meta && <Text style={[styles.evidenceMeta, { color: colors.textMuted }]}>{meta}</Text>}
        </View>
        <Ionicons name="create-outline" size={20} color={colors.textMuted} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.evidence, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
      <DictationInput
        label={labels.placeholder}
        value={text}
        onChangeText={onChangeText}
        placeholder={labels.placeholder}
        minHeight={48}
        autoFocus={!text}
      />
      {children}
      <View style={styles.evidenceActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.remove}
          onPress={onRemove}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.done}
          onPress={onDone}
          hitSlop={8}
          style={[styles.doneButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="checkmark" size={24} color={colors.primaryText} />
        </Pressable>
      </View>
    </View>
  );
}

// Step 3 — positive and negative sides

export function EffectsStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [openKeys, setOpen] = useOpenKeys(draft.effects);
  const labels = {
    placeholder: t('flow.step3.placeholder'),
    edit: t('flow.step3.edit'),
    remove: t('flow.step3.remove'),
    done: t('flow.step3.done'),
  };

  const add = (side: EffectSide) => {
    const key = newEvidenceKey();
    update((d) => ({ effects: [...d.effects, { key, side, text: '' }] }));
    setOpen(key, true);
  };
  const change = (key: string, text: string) =>
    update((d) => ({ effects: d.effects.map((e) => (e.key === key ? { ...e, text } : e)) }));
  const remove = (key: string) => {
    update((d) => ({ effects: d.effects.filter((e) => e.key !== key) }));
    setOpen(key, false);
  };
  const done = (item: Effect) => {
    // Closing an empty item discards it.
    if (!item.text.trim()) remove(item.key);
    else setOpen(item.key, false);
  };

  const section = (side: EffectSide) => (
    <View style={styles.section}>
      <SectionTitle
        title={t(side === 'positive' ? 'flow.step3.positive' : 'flow.step3.negative')}
        color={side === 'positive' ? colors.effectPositive : colors.effectNegative}
      />
      {draft.effects
        .filter((e) => e.side === side)
        .map((item) => (
          <ListItem
            key={item.key}
            text={item.text}
            open={openKeys.has(item.key)}
            labels={labels}
            onOpen={() => setOpen(item.key, true)}
            onDone={() => done(item)}
            onChangeText={(text) => change(item.key, text)}
            onRemove={() => remove(item.key)}
          />
        ))}
      <Button
        title={t(side === 'positive' ? 'flow.step3.addPositive' : 'flow.step3.addNegative')}
        variant="secondary"
        onPress={() => add(side)}
      />
    </View>
  );

  return (
    <>
      <ThoughtQuote text={draft.text} />
      <StepHeader title={t('flow.step3.title')} hint={t('flow.step3.hint')} />
      {section('positive')}
      {section('negative')}
    </>
  );
}

// Step 4 — evidence

export function EvidenceStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const scaleLabel = useScaleLabel();
  const [openKeys, setOpen] = useOpenKeys(draft.evidence);
  const labels = {
    placeholder: t('flow.step4.placeholder'),
    edit: t('flow.step4.edit'),
    remove: t('flow.step4.remove'),
    done: t('flow.step4.done'),
  };

  const add = (side: EvidenceSide) => {
    const key = newEvidenceKey();
    update((d) => ({ evidence: [...d.evidence, { key, side, text: '', weight: DEFAULT_WEIGHT }] }));
    setOpen(key, true);
  };
  const change = (key: string, changes: Partial<Evidence>) =>
    update((d) => ({ evidence: d.evidence.map((e) => (e.key === key ? { ...e, ...changes } : e)) }));
  const remove = (key: string) => {
    update((d) => ({ evidence: d.evidence.filter((e) => e.key !== key) }));
    setOpen(key, false);
  };
  const done = (item: Evidence) => {
    // Closing an empty item discards it.
    if (!item.text.trim()) remove(item.key);
    else setOpen(item.key, false);
  };

  const section = (side: EvidenceSide) => (
    <View style={styles.section}>
      <SectionTitle
        title={t(side === 'for' ? 'flow.step4.for' : 'flow.step4.against')}
        color={side === 'for' ? colors.evidenceFor : colors.evidenceAgainst}
      />
      {draft.evidence
        .filter((e) => e.side === side)
        .map((item) => (
          <ListItem
            key={item.key}
            text={item.text}
            meta={`${scaleLabel('convincing', item.weight, 1)} · ${item.weight}%`}
            open={openKeys.has(item.key)}
            labels={labels}
            onOpen={() => setOpen(item.key, true)}
            onDone={() => done(item)}
            onChangeText={(text) => change(item.key, { text })}
            onRemove={() => remove(item.key)}
          >
            <BeliefSlider
              label={t('flow.step4.weight')}
              scale="convincing"
              min={1}
              max={100}
              value={item.weight}
              onChange={(weight) => change(item.key, { weight })}
            />
          </ListItem>
        ))}
      <Button
        title={t(side === 'for' ? 'flow.step4.addFor' : 'flow.step4.addAgainst')}
        variant="secondary"
        onPress={() => add(side)}
      />
    </View>
  );

  return (
    <>
      <ThoughtQuote text={draft.text} />
      <StepHeader title={t('flow.step4.title')} hint={t('flow.step4.hint')} />
      {section('for')}
      {section('against')}
    </>
  );
}

// Step 5 — thinking patterns

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
      <StepHeader title={t('flow.step5.title')} hint={t('flow.step5.hint')} />
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
                    <Text style={{ fontWeight: '600' }}>{t('flow.step5.example')}: </Text>
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

// Step 6 — summary

export function SummaryStep({ draft }: { draft: ThoughtWithDetails }) {
  const { t } = useTranslation();
  const colors = useColors();
  const scaleLabel = useScaleLabel();
  return (
    <>
      <StepHeader title={t('flow.step6.title')} hint={t('flow.step6.hint')} />
      <ThoughtQuote text={draft.text} />
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('detail.initialBelief')}</Text>
        <Text style={[styles.body, { color: colors.text }]}>
          {draft.initialBelief}% · {scaleLabel('belief', draft.initialBelief)}
        </Text>
      </View>
      <ThoughtSummary thought={draft} />
    </>
  );
}

// Step 7 — alternative thought

export function AlternativeStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  return (
    <>
      <ThoughtQuote text={draft.text} />
      <StepHeader title={t('flow.step7.title')} />
      <DictationInput
        label={t('flow.step7.alternativeLabel')}
        value={draft.alternativeThought ?? ''}
        onChangeText={(alternativeThought) => update({ alternativeThought })}
        placeholder={t('flow.step7.alternativePlaceholder')}
        minHeight={140}
      />
    </>
  );
}

// Step 8 — re-rating

export function RerateStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const finalBelief = draft.finalBelief ?? draft.initialBelief;

  return (
    <>
      <ThoughtQuote text={draft.text} />
      <StepHeader title={t('flow.step8.title')} />
      <BeliefSlider
        label={t('flow.step8.rerate')}
        scale="belief"
        value={finalBelief}
        onChange={(value) => update({ finalBelief: value })}
      />
      <Text style={[styles.change, { color: colors.primary }]}>
        {t('flow.step8.change', { before: draft.initialBelief, after: finalBelief })}
      </Text>
      {draft.alternativeThought?.trim() ? (
        <View style={styles.alternativeBlock}>
          <ThoughtQuote text={draft.alternativeThought} />
          {draft.alternativeBelief == null ? (
            <View style={styles.optionalRow}>
              <Text style={[styles.body, styles.flex, { color: colors.text }]}>
                {t('flow.step8.alternativeBelief')}
              </Text>
              <Button
                title={t('flow.step8.rateAlternative')}
                variant="secondary"
                onPress={() => update({ alternativeBelief: 50 })}
              />
            </View>
          ) : (
            <View style={styles.optional}>
              <BeliefSlider
                label={t('flow.step8.alternativeBelief')}
                scale="belief"
                value={draft.alternativeBelief}
                onChange={(alternativeBelief) => update({ alternativeBelief })}
              />
              <Button
                title={t('flow.step8.skipAlternative')}
                variant="ghost"
                onPress={() => update({ alternativeBelief: null })}
                style={styles.alignEnd}
              />
            </View>
          )}
        </View>
      ) : null}
    </>
  );
}

// Completion

export function CompleteStep({ draft, onDone }: { draft: ThoughtWithDetails; onDone: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const after = draft.finalBelief ?? draft.initialBelief;
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.complete}>
        <Mascot variant="wave" size={260} />
        <Text accessibilityRole="header" style={[styles.title, styles.centerText, { color: colors.text }]}>
          {t('flow.complete.title')}
        </Text>
        <Text style={[styles.body, styles.centerText, { color: colors.text }]}>{t('flow.complete.body')}</Text>
        <Text style={[styles.change, styles.centerText, { color: colors.primary }]}>
          {t('flow.step8.change', { before: draft.initialBelief, after })}
        </Text>
        <EvidenceBalance evidence={draft.evidence} />
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
  evidence: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm },
  evidenceClosed: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  evidenceMeta: { fontSize: 14, marginTop: 2 },
  evidenceActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { padding: spacing.sm },
  doneButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
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
  summaryRow: { gap: 2 },
  summaryLabel: { fontSize: 14 },
  change: { fontSize: 17, fontWeight: '600' },
  alternativeBlock: { gap: spacing.sm, marginTop: spacing.md },
  optionalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optional: { gap: spacing.xs },
  alignEnd: { alignSelf: 'flex-end' },
  complete: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
});
