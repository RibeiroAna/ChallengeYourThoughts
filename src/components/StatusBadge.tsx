import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ThoughtStatus } from '../db/thoughts';
import { radius, spacing, useColors } from '../theme';

export function StatusBadge({ status }: { status: ThoughtStatus }) {
  const { t } = useTranslation();
  const colors = useColors();
  const challenged = status === 'challenged';
  return (
    <View
      style={[
        styles.badge,
        challenged ? { backgroundColor: colors.primary } : { borderColor: colors.border, borderWidth: 1 },
      ]}
    >
      <Text style={[styles.text, { color: challenged ? colors.primaryText : colors.textMuted }]}>
        {t(`status.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  text: { fontSize: 13, fontWeight: '600' },
});
