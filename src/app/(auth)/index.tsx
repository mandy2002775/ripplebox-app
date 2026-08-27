import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const TERMS_URL = 'https://claude.ai/code/artifact/b812c43a-a284-488c-872b-ca1f293eb17d';
const PRIVACY_URL = 'https://claude.ai/code/artifact/78dcc113-2ffa-4b32-b2b5-b005d37f6c38';

export default function WelcomeScreen() {
  const router = useRouter();
  const { sessionExpired } = useAuth();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.logoRing1}>
          <View style={styles.logoRing2}>
            <View style={styles.logoRing3}>
              <Text style={styles.logoLetter}>R</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>Ripplebox</Text>
        <Text style={styles.tagline}>
          creating the ripple effect of referrals{'\n'}for hair and beauty
        </Text>

        {sessionExpired && (
          <View style={styles.sessionExpiredBanner}>
            <Text style={styles.sessionExpiredText}>
              You've been signed out — please sign in again.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/role-select')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Get started</Text>
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
    backgroundColor: Brand.brand,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoRing1: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoRing2: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing3: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '300',
  },
  title: {
    fontSize: 27,
    fontWeight: '500',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 13,
    color: '#8060B0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
  },
  sessionExpiredBanner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    width: '100%',
  },
  sessionExpiredText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  ghostButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.75,
  },
  legal: {
    marginTop: 22,
    fontSize: 10,
    color: '#6040A0',
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: '#9070C0',
    textDecorationLine: 'underline',
  },
});
