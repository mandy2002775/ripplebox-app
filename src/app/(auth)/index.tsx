import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

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
          By continuing you agree to our Terms of Service{'\n'}and Privacy Policy
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
});
