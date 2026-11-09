import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';

import { getDb } from '../db/database';
import { getLanguageSetting } from '../db/settings';
import { initI18n } from '../i18n';
import { configureNotificationHandler, NEW_THOUGHT_URL } from '../notifications/reminders';
import { useColors } from '../theme';

// Open the database and load the language before the first render.
getDb();
initI18n(getLanguageSetting());
configureNotificationHandler();

/** Opens "new thought" when the user taps a reminder, including on cold start. */
function useReminderTaps() {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier + response.notification.date;
    if (handled.current === id) return;
    handled.current = id;
    if (response.notification.request.content.data?.url === NEW_THOUGHT_URL) {
      router.push(NEW_THOUGHT_URL);
    }
  }, [response]);
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = useColors();
  const { t } = useTranslation();
  useReminderTaps();

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      primary: colors.primary,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="index" options={{ title: t('home.title') }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
        <Stack.Screen name="reminders" options={{ title: t('reminders.title') }} />
        <Stack.Screen name="thought/new" options={{ title: t('flow.newTitle') }} />
        <Stack.Screen name="thought/[id]/index" options={{ title: t('detail.title') }} />
        <Stack.Screen name="thought/[id]/challenge" options={{ title: t('flow.challengeTitle') }} />
      </Stack>
    </ThemeProvider>
  );
}
