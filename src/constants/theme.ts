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

/** Ripplebox brand palette — deep aubergine anchor from the original
 *  prototype, extended with the warm rose/gold pairing the marketing site
 *  already established, plus soft-shadow-ready surfaces so cards read as
 *  lifted rather than just outlined. */
export const Brand = {
  brand: '#1C0A3A',
  brand2: '#2E1152',
  brand3: '#4A1F7C',
  accent: '#7B4FCC',
  accentSoft: '#9D78E0',
  rose: '#3D1530',
  roseVivid: '#FF6F91',
  gold: '#FFC978',
  lavender: '#EDE8F9',
  text2: '#7A6E8A',
  text3: '#B0A8C0',
  border: '#EAE4F2',
  borderSoft: 'rgba(28,10,58,0.06)',
  bg: '#FBF8FD',
  surface: '#FFFFFF',
  green: '#1A5C38',
  greenBg: '#EAF5EE',
  amber: '#7A4F00',
  amberBg: '#FEF5E4',
  red: '#8B1F1F',
  redBg: '#FEF0F0',
  /** Primary CTA / hero gradient — rose into aubergine, matches the
   *  marketing site's --grad-primary. */
  gradientPrimary: ['#FF6F91', '#7B4FCC', '#4A1F7C'] as const,
  /** Deep, moody backdrop for full-bleed auth/splash surfaces. */
  gradientDusk: ['#2E1152', '#1C0A3A', '#12061F'] as const,
} as const;

/** Real typography — Fraunces (an editorial display serif, used with
 *  restraint) for headings and hero numerals, Inter for everything read
 *  at length. Loaded via useFonts in the root layout; falls back to the
 *  platform system font until then. */
export const Type = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const Radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

/** Soft elevation presets — replaces flat 0.5px borders with real depth.
 *  `elevation` covers Android; iOS/web read the shadow* props. */
export const Shadow = {
  sm: {
    shadowColor: '#2A1150',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#2A1150',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1C0A3A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 36,
    elevation: 12,
  },
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
