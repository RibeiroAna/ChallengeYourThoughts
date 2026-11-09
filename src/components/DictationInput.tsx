import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useDictation } from '../speech/useDictation';
import { radius, spacing, useColors } from '../theme';

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  /** Accessible name of the field, also used when no visible label is shown. */
  label: string;
  minHeight?: number;
}

/** A text field with an optional mic button. The mic only appears when on-device recognition is available. */
export function DictationInput({ value, onChangeText, label, minHeight = 96, style, ...rest }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const baseText = useRef('');
  const dictation = useDictation((transcript) => {
    onChangeText([baseText.current, transcript].filter(Boolean).join(baseText.current.endsWith('\n') ? '' : ' '));
  });

  const toggle = () => {
    if (dictation.listening) {
      dictation.stop();
    } else {
      baseText.current = value.trimEnd();
      dictation.start();
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          accessibilityLabel={label}
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textMuted}
          textAlignVertical="top"
          style={[styles.input, { color: colors.text, minHeight }, style]}
          {...rest}
        />
        {dictation.available && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dictation.listening ? t('dictation.stop') : t('dictation.start')}
            onPress={toggle}
            hitSlop={8}
            style={[
              styles.mic,
              { backgroundColor: dictation.listening ? colors.primary : colors.primarySoft },
            ]}
          >
            <Ionicons
              name={dictation.listening ? 'stop' : 'mic'}
              size={20}
              color={dictation.listening ? colors.primaryText : colors.primary}
            />
          </Pressable>
        )}
      </View>
      {dictation.listening && (
        <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.primary }]}>
          {t('dictation.listening')}
        </Text>
      )}
      {dictation.error && !dictation.listening && (
        <Text style={[styles.status, { color: colors.textMuted }]}>{t('dictation.error')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
  },
  input: { flex: 1, fontSize: 17, lineHeight: 24, paddingVertical: spacing.xs },
  mic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  status: { fontSize: 14 },
});
