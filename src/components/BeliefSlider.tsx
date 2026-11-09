import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

import { spacing, useColors } from '../theme';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Text shown next to the label, e.g. "80%". Defaults to the value with a percent sign. */
  valueLabel?: string;
}

export function BeliefSlider({ label, value, onChange, min = 0, max = 100, valueLabel }: Props) {
  const colors = useColors();
  const display = valueLabel ?? `${value}%`;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.primary }]}>{display}</Text>
      </View>
      <Slider
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: display }}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
        style={styles.slider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.md },
  label: { flex: 1, fontSize: 16 },
  value: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  slider: { width: '100%', height: 40 },
});
