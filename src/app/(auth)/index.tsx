import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const TERMS_URL = 'https://claude.ai/code/artifact/b812c43a-a284-488c-872b-ca1f293eb17d';
const PRIVACY_URL = 'https://claude.ai/code/artifact/78dcc113-2ffa-4b32-b2b5-b005d37f6c38';

export default function WelcomeScreen() {
  const router = useRouter();
  const { sessionExpired } = useAuth();

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#2E1152', '#1C0A3A', '#0F0519']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.glowRose} />
      <View pointerEvents="none" style={styles.glowGold} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <LinearGradient
            colors={['#FF6F91', '#7B4FCC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoMark}>
            <Text style={styles.logoLetter}>R</Text>
          </LinearGradient>

          <Text style={styles.title}>
            Ripple<Text style={styles.titleItalic}>box</Text>
          </Text>
          <Text style={styles.tagline}>
            The ripple effect of referrals,{'\n'}for hair &amp; beauty.
          </Text>
        </View>

        {sessionExpired && (
          <View style={styles.sessionExpiredBanner}>
            <Text style={styles.sessionExpiredText}>
              You've been signed out — please sign in again.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/role-select')}>
            {({ pressed }) => (
              <LinearGradient
                colors={['#FF6F91', '#8A5CF5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Get started</Text>
              </LinearGradient>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/role-select')}
            style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
            <Text style={styles.ghostButtonText}>Sign in to my account</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms of Service
          </Text>
          {'\n'}and{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1C0A3A',
    overflow: 'hidden',
  },
  glowRose: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#FF6F91',
    opacity: 0.16,
    top: -100,
    right: -110,
  },
  glowGold: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFC978',
    opacity: 0.08,
    bottom: 40,
    left: -100,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    shadowColor: '#FF6F91',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  logoLetter: {
    fontSize: 30,
    color: '#fff',
    fontFamily: Type.display,
  },
  title: {
    fontSize: 36,
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 12,
    fontFamily: Type.displayBold,
  },
  titleItalic: {
    fontFamily: Type.displayItalic,
    color: '#E8B8FF',
  },
  tagline: {
    fontSize: 14.5,
    color: 'rgba(232,216,255,0.62)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Type.body,
  },
  sessionExpiredBanner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    width: '100%',
  },
  sessionExpiredText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontFamily: Type.bodyMedium,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF6F91',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Type.bodySemiBold,
  },
  ghostButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Radius.pill,
    paddingVertical: 14.5,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14.5,
    fontFamily: Type.bodyMedium,
  },
  pressed: {
    opacity: 0.85,
  },
  legal: {
    marginTop: 26,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    lineHeight: 17,
    fontFamily: Type.body,
  },
  legalLink: {
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
});
