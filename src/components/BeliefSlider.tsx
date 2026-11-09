import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';

import { spacing, useColors } from '../theme';

/** Which verbal scale to show next to the percentage. */
export type SliderScale = 'belief' | 'convincing';

/** Maps a percentage to one of seven bands: the minimum, five steps of 20%, and 100%. */
export function scaleBand(value: number, min = 0): number {
  if (value <= min) return 0;
  if (value >= 100) return 6;
  return Math.min(5, Math.max(1, Math.ceil(value / 20)));
}

export function useScaleLabel() {
  const { t } = useTranslation();
  return (scale: SliderScale, value: number, min = 0) => t(`scale.${scale}.${scaleBand(value, min)}`);
}

interface Props {
  label: string;
  /** Hide the label visually when the screen already asks the question; screen readers still announce it. */
  hideLabel?: boolean;
  value: number;
  onChange: (value: number) => void;
  scale: SliderScale;
  min?: number;
  max?: number;
}

export function BeliefSlider({ label, hideLabel, value, onChange, scale, min = 0, max = 100 }: Props) {
  const colors = useColors();
  const scaleLabel = useScaleLabel()(scale, value, min);
  return (
    <View style={styles.container}>
      {!hideLabel && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View style={styles.valueRow}>
        <Text style={[styles.scale, { color: colors.primary }]}>{scaleLabel}</Text>
        <Text style={[styles.value, { color: colors.primary }]}>{value}%</Text>
      </View>
      <Slider
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: `${value}%, ${scaleLabel}` }}
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
  label: { fontSize: 16 },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  scale: { flex: 1, fontSize: 17, fontWeight: '600' },
  value: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  slider: { width: '100%', height: 40 },
});
