import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Brand, MaxContentWidth } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, isLoading } = useAuth();

  // Keep the native splash screen up while we check for a stored session —
  // otherwise we'd flash the auth screens before redirecting a logged-in user.
  if (isLoading) return null;

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

/** On web, the whole app is otherwise a phone-sized layout stretched full
 *  browser width — buttons and cards run edge to edge and it reads as
 *  broken rather than a real app. Frames it like WhatsApp/Telegram Web:
 *  a fixed-width column, centered, on a neutral surface either side. */
function WebFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View style={styles.webOuter}>
      <View style={styles.webFrame}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <WebFrame>
          <RootNavigator />
        </WebFrame>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    ...(Platform.OS === 'web' ? ({ minHeight: '100vh' } as object) : {}),
    flex: 1,
    alignItems: 'center',
    backgroundColor: Brand.brand2,
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: Brand.bg,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 60px rgba(0,0,0,0.25)' } as object)
      : {}),
  },
});
