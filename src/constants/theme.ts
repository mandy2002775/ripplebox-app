/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Ripplebox brand palette, from the client-approved prototype. Not theme-dependent. */
export const Brand = {
  brand: '#1C0A3A',
  brand2: '#2E1152',
  brand3: '#4A1F7C',
  accent: '#7B4FCC',
  rose: '#3D1530',
  lavender: '#EDE8F9',
  text2: '#7A6E8A',
  text3: '#B0A8C0',
  border: '#EAE4F2',
  bg: '#F8F5FC',
  green: '#1A5C38',
  greenBg: '#EAF5EE',
  amber: '#7A4F00',
  amberBg: '#FEF5E4',
  red: '#8B1F1F',
  redBg: '#FEF0F0',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

/** Caps the app's width on web so it reads as an app, not a phone screen
 *  stretched across a desktop browser — matches how WhatsApp Web/Telegram
 *  Web frame a mobile-first layout on wide viewports. */
export const MaxContentWidth = 480;
