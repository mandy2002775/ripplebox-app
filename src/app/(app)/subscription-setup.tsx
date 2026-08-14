import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RowButton } from '@/components/row-button';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, ApiError } from '@/lib/api';
import { PlanType, SalonSubscription } from '@/lib/types';

const PLANS: { value: PlanType; label: string; price: string; note: string }[] = [
  { value: 'monthly', label: 'Monthly', price: '$49/mo', note: 'Billed every month' },
  { value: 'annual', label: 'Annual', price: '$470/yr', note: 'Save ~20% vs monthly' },
];

export default function SubscriptionSetupScreen() {
  const { token, refreshUser } = useAuth();
  const router = useRouter();

  const [planType, setPlanType] = useState<PlanType>('monthly');
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
      // context, then let the home route decide what to render now that
      // user.salon.subscription is present.
      await refreshUser();
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start your trial. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.eyebrow}>STEP 2 OF 2</Text>
        <Text style={styles.heading}>Choose your plan</Text>
        <Text style={styles.subheading}>Start a 14-day free trial — no card required</Text>

        <View style={styles.planList}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.value}
              onPress={() => setPlanType(plan.value)}
              style={[styles.planCard, planType === plan.value && styles.planCardActive]}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.planLabel,
                    planType === plan.value && styles.planLabelActive,
                  ]}>
                  {plan.label}
                </Text>
                <Text style={styles.planNote}>{plan.note}</Text>
              </View>
              <Text
                style={[styles.planPrice, planType === plan.value && styles.planPriceActive]}>
                {plan.price}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your trial starts today and runs for 14 days. You won't be charged until it ends.
          </Text>
        </View>

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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  eyebrow: {
    fontSize: 10,
    color: Brand.text3,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  heading: {
    fontSize: 21,
    fontWeight: '500',
    color: Brand.brand,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 12,
    color: Brand.text2,
    marginBottom: 20,
  },
  planList: {
    gap: 9,
    marginBottom: 14,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 16,
  },
  planCardActive: {
    borderWidth: 1.5,
    borderColor: Brand.brand,
    backgroundColor: Brand.lavender,
  },
  planLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.brand,
  },
  planLabelActive: {
    color: Brand.brand3,
  },
  planNote: {
    fontSize: 11,
    color: Brand.text2,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: Brand.text2,
  },
  planPriceActive: {
    color: Brand.brand,
  },
  infoBox: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    padding: 11,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 11,
    color: Brand.brand3,
    lineHeight: 16,
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
