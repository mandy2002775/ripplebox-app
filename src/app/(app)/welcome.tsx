import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const STEPS = [
  'Add up to 5 photos of your salon, team, and work',
  'Create your first referral reward — discounts, gift cards, or free treatments',
  'Share Ripplebox with your clients',
];

const HERO_IMAGE = 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1200&q=80';

export default function WelcomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Only ever reached via subscription-setup.tsx's own redirect in normal
  // use, but nothing stops a deep link landing here without that context —
  // a client, or a salon that hasn't set up their business yet, would
  // otherwise see "Welcome to Ripplebox, undefined!".
  if (user && !user.salon) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
            <LinearGradient
              colors={['transparent', 'rgba(28,10,58,0.55)', Brand.bg]}
              locations={[0, 0.65, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>You're live</Text>
            <Text style={styles.heading}>
              Welcome to Ripplebox, <Text style={styles.headingItalic}>{user?.salon?.business_name}</Text>!
            </Text>
            <Text style={styles.body}>
              Hi {user?.name}, your account is now active and your 30-day free trial has
              started. Here's everything you need to get going.
            </Text>

            <View style={styles.stepsBox}>
              <Text style={styles.stepsTitle}>Your next 3 steps</Text>
              {STEPS.map((step, i) => (
                <View key={step} style={styles.stepRow}>
                  <LinearGradient
                    colors={[Brand.roseVivid, Brand.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </LinearGradient>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <Pressable onPress={() => router.replace('/')}>
              {({ pressed }) => (
                <LinearGradient
                  colors={[Brand.roseVivid, Brand.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.button, pressed && styles.pressed]}>
                  <Text style={styles.buttonText}>Open my dashboard</Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  heroWrap: {
    width: '100%',
    height: 200,
    marginBottom: -60,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    padding: 22,
    ...Shadow.md,
  },
  eyebrow: {
    fontSize: 11,
    color: Brand.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: Type.bodySemiBold,
  },
  heading: {
    fontSize: 22,
    color: Brand.brand,
    marginBottom: 12,
    lineHeight: 27,
    fontFamily: Type.displayBold,
    letterSpacing: -0.2,
  },
  headingItalic: {
    fontFamily: Type.displayItalic,
    color: Brand.accent,
  },
  body: {
    fontSize: 13.5,
    color: Brand.text2,
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: Type.body,
  },
  stepsBox: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.md,
    padding: 15,
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 11,
    color: Brand.brand3,
    marginBottom: 11,
    fontFamily: Type.bodySemiBold,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 10.5,
    color: '#fff',
    fontFamily: Type.bodyBold,
  },
  stepText: {
    flex: 1,
    fontSize: 12.5,
    color: Brand.brand,
    lineHeight: 18,
    fontFamily: Type.body,
  },
  button: {
    borderRadius: Radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadow.md,
    shadowColor: Brand.accent,
  },
  pressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14.5,
    fontFamily: Type.bodySemiBold,
  },
});
