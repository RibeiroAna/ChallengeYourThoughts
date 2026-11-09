import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Evidence, EvidenceSide } from '../db/thoughts';
import { spacing, useColors } from '../theme';

export function evidenceTotal(evidence: Evidence[], side: EvidenceSide) {
  return evidence.filter((e) => e.side === side && e.text.trim()).reduce((sum, e) => sum + e.weight, 0);
}

/** Bar comparing the total weight of evidence for and against a thought. Renders nothing without evidence. */
export function EvidenceBalance({ evidence }: { evidence: Evidence[] }) {
  const { t } = useTranslation();
  const colors = useColors();
  const forTotal = evidenceTotal(evidence, 'for');
  const againstTotal = evidenceTotal(evidence, 'against');
  if (forTotal + againstTotal === 0) return null;
  const forShare = forTotal / (forTotal + againstTotal);
  return (
    <View
      style={styles.balance}
      accessible
      accessibilityLabel={`${t('balance.label')}: ${t('balance.for', { value: forTotal })}, ${t('balance.against', { value: againstTotal })}`}
    >
      <Text style={[styles.label, { color: colors.text }]}>{t('balance.label')}</Text>
      <View style={styles.bar}>
        <View style={{ flex: forShare, backgroundColor: colors.evidenceFor }} />
        <View style={{ flex: 1 - forShare, backgroundColor: colors.evidenceAgainst }} />
      </View>
      <View style={styles.legend}>
        <Text style={{ color: colors.evidenceFor }}>{t('balance.for', { value: forTotal })}</Text>
        <Text style={{ color: colors.evidenceAgainst }}>{t('balance.against', { value: againstTotal })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  balance: { gap: spacing.sm, alignSelf: 'stretch' },
  label: { fontSize: 17, fontWeight: '600' },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
});
