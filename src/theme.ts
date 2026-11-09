import { useColorScheme } from 'react-native';

/** Background of the sloth videos. Must sit behind every video, in light and dark mode. */
export const MASCOT_VIDEO_BACKGROUND = '#FDFDFD';

const light = {
  background: '#F6F4EF',
  surface: '#FFFFFF',
  text: '#26302B',
  textMuted: '#5F6B65',
  border: '#DAD6CC',
  primary: '#4F7D66',
  primaryText: '#FFFFFF',
  primarySoft: '#E1ECE5',
  evidenceFor: '#B5654A',
  evidenceAgainst: '#4A7DB5',
  danger: '#B3261E',
};

const dark: typeof light = {
  background: '#151917',
  surface: '#202624',
  text: '#E8ECE9',
  textMuted: '#A3AEA8',
  border: '#36403B',
  primary: '#86B79D',
  primaryText: '#10241A',
  primarySoft: '#2A3A31',
  evidenceFor: '#E09A7F',
  evidenceAgainst: '#8FB6E3',
  danger: '#F2B8B5',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 14, lg: 20 };
