import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

import { MASCOT_VIDEO_BACKGROUND, radius } from '../theme';

const VIDEOS = {
  wave: require('../../assets/mascot/sloth-wave.mp4'),
  laptop: require('../../assets/mascot/sloth-laptop.mp4'),
  stretch: require('../../assets/mascot/sloth-stretch.mp4'),
  idle: require('../../assets/mascot/sloth-idle.mp4'),
};
const STILL = require('../../assets/mascot/sloth-sitting.webp');

/** Aspect ratio (width / height) of each clip; wave is portrait, the rest are square. */
const ASPECT: Record<MascotVariant, number> = { wave: 720 / 1280, laptop: 1, stretch: 1, idle: 1 };

export type MascotVariant = keyof typeof VIDEOS;

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);
  return reduceMotion;
}

interface Props {
  variant: MascotVariant;
  /** Height of the mascot; width follows the clip's aspect ratio. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** The sloth. Decorative, so hidden from screen readers. */
export function Mascot({ variant, size = 180, style }: Props) {
  const reduceMotion = useReduceMotion();
  if (reduceMotion) {
    return (
      <View accessible={false} style={[{ width: size, height: size }, styles.center, style]}>
        <Image source={STILL} style={StyleSheet.absoluteFill} contentFit="contain" />
      </View>
    );
  }
  return <MascotVideo variant={variant} size={size} style={style} />;
}

function MascotVideo({ variant, size, style }: Required<Pick<Props, 'variant' | 'size'>> & Pick<Props, 'style'>) {
  const player = useVideoPlayer(VIDEOS[variant], (p) => {
    p.loop = true;
    p.muted = true;
    // Never pause the user's own music or podcasts.
    p.audioMixingMode = 'mixWithOthers';
    p.play();
  });

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.card,
        styles.center,
        { width: size * ASPECT[variant], height: size, backgroundColor: MASCOT_VIDEO_BACKGROUND },
        style,
      ]}
    >
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="contain"
        allowsPictureInPicture={false}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  center: { alignSelf: 'center' },
});
