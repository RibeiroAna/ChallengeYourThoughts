import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { EffectSide, EvidenceSide, ThoughtWithDetails } from '../db/thoughts';
import { radius, spacing, useColors } from '../theme';
import { useScaleLabel } from './BeliefSlider';
import { EvidenceBalance } from './EvidenceBalance';

interface Props {
  thought: ThoughtWithDetails;
  /** Show the for/against balance bar; only once the challenge is finished. */
  showBalance?: boolean;
  /** Show the challenge sections (sides, evidence, patterns). Off for a thought that was only saved. */
  showChallenge?: boolean;
}

/** A section card; `accent` adds a tinted left edge. */
function Card({ children, accent }: { children: ReactNode; accent?: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        accent && { borderLeftWidth: 4, borderLeftColor: accent, gap: spacing.sm },
      ]}
    >
      {children}
    </View>
  );
}

/** A section heading; `color` adds a coloured dot before it. */
function SectionTitle({ title, color }: { title: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={styles.titleRow}>
      {color && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
    </View>
  );
}

function Belief({ label, value }: { label: string; value: number }) {
  const colors = useColors();
  const scaleLabel = useScaleLabel();
  return (
    <View style={styles.belief}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.beliefValue, { color: colors.text }]}>{value}%</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{scaleLabel('belief', value)}</Text>
    </View>
  );
}

/**
 * Read-only view of a thought: the thought and belief, positive and negative sides, evidence, thinking
 * patterns, and — once written — the alternative thought and the change in belief.
 */
export function ThoughtSummary({ thought, showBalance, showChallenge = true }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const scaleLabel = useScaleLabel();

  const none = <Text style={[styles.value, styles.none, { color: colors.textMuted }]}>{t('detail.none')}</Text>;

  const effectList = (side: EffectSide) => {
    const items = thought.effects.filter((e) => e.side === side && e.text.trim());
    const color = side === 'positive' ? colors.effectPositive : colors.effectNegative;
    return (
      <Card accent={color}>
        <SectionTitle title={t(side === 'positive' ? 'detail.positive' : 'detail.negative')} />
        {items.length === 0
          ? none
          : items.map((e) => (
              <View key={e.key} style={styles.item}>
                <View style={[styles.bullet, { backgroundColor: color }]} />
                <Text style={[styles.value, styles.flex, { color: colors.text }]}>{e.text}</Text>
              </View>
            ))}
      </Card>
    );
  };

  const evidenceList = (side: EvidenceSide) => {
    const items = thought.evidence.filter((e) => e.side === side && e.text.trim());
    const color = side === 'for' ? colors.evidenceFor : colors.evidenceAgainst;
    return (
      <View style={styles.section}>
        <SectionTitle title={t(side === 'for' ? 'detail.evidenceFor' : 'detail.evidenceAgainst')} color={color} />
        {items.length === 0
          ? none
          : items.map((e) => (
              <View key={e.key} style={styles.item}>
                <View style={styles.flex}>
                  <Text style={[styles.value, { color: colors.text }]}>{e.text}</Text>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{scaleLabel('convincing', e.weight, 1)}</Text>
                </View>
                <View style={[styles.weight, { borderColor: color }]}>
                  <Text style={[styles.weightText, { color }]}>{e.weight}%</Text>
                </View>
              </View>
            ))}
      </View>
    );
  };

  const finalBelief = thought.finalBelief;

  return (
    <>
      <Card>
        <View style={[styles.quote, { borderLeftColor: colors.primary }]}>
          <Text style={[styles.quoteText, { color: colors.text }]}>{thought.text}</Text>
        </View>
        {finalBelief == null && <Belief label={t('detail.initialBelief')} value={thought.initialBelief} />}
      </Card>

      {showChallenge && (
        <>
          {effectList('positive')}
          {effectList('negative')}

          <Card>
            {evidenceList('for')}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {evidenceList('against')}
            {showBalance && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <EvidenceBalance evidence={thought.evidence} />
              </>
            )}
          </Card>

          <Card>
            <SectionTitle title={t('detail.patterns')} color={colors.primary} />
            {thought.patterns.length === 0 ? (
              none
            ) : (
              <View style={styles.chips}>
                {thought.patterns.map((p) => (
                  <View key={p} style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.chipText, { color: colors.text }]}>{t(`patterns.${p}.name`)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </>
      )}

      {thought.alternativeThought ? (
        <Card>
          <SectionTitle title={t('detail.alternative')} color={colors.primary} />
          <View style={[styles.quote, { borderLeftColor: colors.primary }]}>
            <Text style={[styles.quoteText, { color: colors.text }]}>{thought.alternativeThought}</Text>
          </View>
        </Card>
      ) : null}

      {finalBelief != null && (
        <Card>
          <SectionTitle title={t('detail.beliefChange')} color={colors.primary} />
          <View
            style={styles.change}
            accessible
            accessibilityLabel={t('flow.step8.change', { before: thought.initialBelief, after: finalBelief })}
          >
            <Belief label={t('detail.initialBelief')} value={thought.initialBelief} />
            <Ionicons name="arrow-forward" size={24} color={colors.textMuted} />
            <Belief label={t('detail.finalBelief')} value={finalBelief} />
          </View>
          {thought.alternativeBelief != null && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Belief label={t('detail.alternativeBelief')} value={thought.alternativeBelief} />
            </>
          )}
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  section: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 17, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth },
  quote: { borderLeftWidth: 4, paddingLeft: spacing.md },
  quoteText: { fontSize: 17, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 19 },
  value: { fontSize: 16, lineHeight: 22 },
  none: { fontStyle: 'italic' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  weight: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  weightText: { fontSize: 14, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipText: { fontSize: 15 },
  belief: { flex: 1, gap: 2 },
  beliefValue: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  change: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
