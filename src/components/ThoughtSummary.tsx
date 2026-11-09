import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EffectSide, EvidenceSide, ThoughtWithDetails } from '../db/thoughts';
import { spacing, useColors } from '../theme';
import { useScaleLabel } from './BeliefSlider';
import { EvidenceBalance } from './EvidenceBalance';

interface Props {
  thought: ThoughtWithDetails;
  /** Show the for/against balance bar; only once the challenge is finished. */
  showBalance?: boolean;
}

/** Read-only view of a thought's positive and negative sides, evidence, and thinking patterns. */
export function ThoughtSummary({ thought, showBalance }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const scaleLabel = useScaleLabel();

  const none = <Text style={[styles.value, { color: colors.text }]}>{t('detail.none')}</Text>;

  const evidenceList = (side: EvidenceSide) => {
    const items = thought.evidence.filter((e) => e.side === side && e.text.trim());
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {t(side === 'for' ? 'detail.evidenceFor' : 'detail.evidenceAgainst')}
        </Text>
        {items.length === 0
          ? none
          : items.map((e) => (
              <View key={e.key} style={styles.evidenceRow}>
                <Text style={[styles.value, styles.flex, { color: colors.text }]}>• {e.text}</Text>
                <Text style={[styles.value, { color: side === 'for' ? colors.evidenceFor : colors.evidenceAgainst }]}>
                  {e.weight}%
                </Text>
                <Text style={[styles.label, styles.weightLabel, { color: colors.textMuted }]}>
                  {scaleLabel('convincing', e.weight, 1)}
                </Text>
              </View>
            ))}
      </View>
    );
  };

  const effectList = (side: EffectSide) => {
    const items = thought.effects.filter((e) => e.side === side && e.text.trim());
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {t(side === 'positive' ? 'detail.positive' : 'detail.negative')}
        </Text>
        {items.length === 0
          ? none
          : items.map((e) => (
              <Text key={e.key} style={[styles.value, { color: colors.text }]}>
                • {e.text}
              </Text>
            ))}
      </View>
    );
  };

  return (
    <>
      {effectList('positive')}
      {effectList('negative')}
      {evidenceList('for')}
      {evidenceList('against')}
      {showBalance && <EvidenceBalance evidence={thought.evidence} />}
      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{t('detail.patterns')}</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {thought.patterns.length ? thought.patterns.map((p) => t(`patterns.${p}.name`)).join(', ') : t('detail.none')}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { gap: spacing.xs },
  label: { fontSize: 14 },
  value: { fontSize: 16, lineHeight: 22 },
  evidenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  weightLabel: { width: '100%', paddingLeft: spacing.md, marginTop: -spacing.xs },
});
