import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, ApiError } from '@/lib/api';
import { PlanType, SalonSubscription } from '@/lib/types';

const PLANS: { value: PlanType; label: string; price: string; note: string; badge?: string }[] = [
  { value: 'monthly', label: 'Monthly', price: '$49', note: 'per month' },
  { value: 'annual', label: 'Annual', price: '$490', note: 'per year', badge: 'Save 17%' },
];

const INCLUDED = [
  'Unlimited referral programs',
  'Custom rewards and expiry dates',
  'Referral tracking dashboard',
  'Push and email notifications',
  '30-day free trial — cancel anytime',
];

export default function SubscriptionSetupScreen() {
  const { token, refreshUser } = useAuth();
  const router = useRouter();

  const [planType, setPlanType] = useState<PlanType>('monthly');
  // The card fields below are decorative, matching the prototype's mock
  // payment screen (it uses Stripe's public test card number, and isn't
  // wired to a real Stripe integration either) — none of this is read or
  // sent anywhere. Only plan_type reaches the API.
  const [expiry, setExpiry] = useState('12 / 27');
  const [cvv, setCvv] = useState('123');
  const [nameOnCard, setNameOnCard] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartTrial() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiRequest<SalonSubscription>('/salons/subscription', {
        method: 'POST',
        token,
        body: { plan_type: planType },
      });
      // Same pattern as salon-profile-setup: pull the subscription back into
      // context before moving on, so the welcome screen and home route both
      // see user.salon.subscription as present.
      await refreshUser();
      router.replace('/welcome');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start your trial. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Subscribe</Text>
            <Text style={styles.subheading}>Step 2 of 2 — Payment</Text>
          </View>
          <View style={styles.secureBadge}>
            <Text style={styles.secureBadgeText}>🔒 Secured by Stripe</Text>
          </View>
        </View>
        <View style={styles.progress}>
          <View style={styles.progressFill} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.planRow}>
            {PLANS.map((plan) => (
              <Pressable
                key={plan.value}
                onPress={() => setPlanType(plan.value)}
                style={[styles.planCard, planType === plan.value && styles.planCardActive]}>
                {plan.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text
                  style={[styles.planPrice, planType === plan.value && styles.planPriceActive]}>
                  {plan.price}
                </Text>
                <Text style={styles.planNote}>{plan.note}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.includedBox}>
            <Text style={styles.includedTitle}>What's included</Text>
            {INCLUDED.map((item) => (
              <Text key={item} style={styles.includedItem}>
                ✓ {item}
              </Text>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Card number</Text>
          <View style={styles.cardNumber}>
            <Text style={styles.cardNumberText}>4242  4242  4242  4242</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>Expiry</Text>
              <TextInput style={styles.input} value={expiry} onChangeText={setExpiry} />
            </View>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={setCvv}
                secureTextEntry
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Name on card</Text>
          <TextInput
            style={styles.input}
            value={nameOnCard}
            onChangeText={setNameOnCard}
            placeholder="Kate Dawes"
            placeholderTextColor={Brand.text3}
          />

          <Text style={styles.disclaimer}>
            🛡️ Payments processed securely by Stripe. We never store card details.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            disabled={isSubmitting}
            onPress={handleStartTrial}
            style={({ pressed }) => [
              styles.button,
              (pressed || isSubmitting) && styles.buttonDisabled,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Start free trial</Text>
            )}
          </Pressable>
        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  subheading: {
    fontSize: 11,
    color: '#8060B0',
    marginTop: 2,
  },
  secureBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  secureBadgeText: {
    fontSize: 10,
    color: '#8ee8c8',
  },
  progress: {
    marginHorizontal: 20,
    height: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 14,
  },
  progressFill: {
    height: 3,
    borderRadius: 4,
    backgroundColor: '#8ee8c8',
    width: '100%',
  },
  body: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },
  planRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  planCardActive: {
    borderWidth: 1.5,
    borderColor: Brand.brand,
    backgroundColor: Brand.lavender,
  },
  planBadge: {
    backgroundColor: Brand.greenBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  planBadgeText: {
    fontSize: 10,
    color: Brand.green,
  },
  planPrice: {
    fontSize: 19,
    fontWeight: '500',
    color: Brand.text2,
  },
  planPriceActive: {
    color: Brand.brand,
  },
  planNote: {
    fontSize: 9,
    color: Brand.text3,
    marginTop: 1,
  },
  includedBox: {
    backgroundColor: Brand.lavender,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  includedTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.brand3,
    marginBottom: 7,
  },
  includedItem: {
    fontSize: 11,
    color: Brand.brand,
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.accent,
    marginBottom: 5,
  },
  cardNumber: {
    backgroundColor: Brand.lavender,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardNumberText: {
    fontSize: 18,
    fontWeight: '500',
    color: Brand.brand,
    letterSpacing: 3,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  half: {
    flex: 1,
  },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.brand,
    marginBottom: 9,
  },
  disclaimer: {
    fontSize: 10,
    color: Brand.text3,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  error: {
    fontSize: 12,
    color: Brand.red,
    marginBottom: 10,
  },
  button: {
    backgroundColor: Brand.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
