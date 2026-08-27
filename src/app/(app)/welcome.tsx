import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const STEPS = [
  'Add up to 5 photos of your salon, team, and work',
  'Create your first referral reward — discounts, gift cards, or free treatments',
  'Share Ripplebox with your clients',
];

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
          <View style={styles.card}>
            <Text style={styles.heading}>
              Welcome to Ripplebox, {user?.salon?.business_name}!
            </Text>
            <Text style={styles.body}>
              Hi {user?.name}, your account is now active and your 30-day free trial has
              started. Here's everything you need to get going.
            </Text>

            <View style={styles.stepsBox}>
              <Text style={styles.stepsTitle}>Your next 3 steps</Text>
              {STEPS.map((step, i) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => router.replace('/')}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Open my dashboard</Text>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 20,
    padding: 20,
  },
  heading: {
    fontSize: 17,
    fontWeight: '500',
    color: Brand.brand,
    marginBottom: 10,
    lineHeight: 22,
  },
  body: {
    fontSize: 13,
    color: Brand.brand,
    lineHeight: 20,
    marginBottom: 16,
  },
  stepsBox: {
    backgroundColor: Brand.lavender,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  stepsTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.brand3,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 9,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: Brand.brand,
    lineHeight: 17,
  },
  button: {
    backgroundColor: Brand.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
