import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useHeaderHeight } from 'expo-router/react-navigation';

/**
 * Top padding that keeps a screen's content clear of the navigation header.
 *
 * Whether content is laid out under the header differs between iOS versions and platforms
 * (iOS 26 places it below the bar, other setups draw it underneath), so instead of guessing,
 * this measures where the screen actually starts and pads only by the overlap.
 * Pass `onLayout` to the screen's root view.
 */
export function useHeaderInset() {
  const headerHeight = useHeaderHeight();
  const [top, setTop] = useState<number | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const view = event.currentTarget;
    if (typeof view !== 'number') view.measureInWindow((_x, y) => setTop(y));
  }, []);

  const paddingTop = top == null ? 0 : Math.max(0, Math.round(headerHeight - top));
  return { onLayout, paddingTop };
}
