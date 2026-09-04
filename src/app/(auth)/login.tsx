import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHero } from '@/components/screen-hero';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { UserType } from '@/lib/types';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1637777277337-f114350fb088?auto=format&fit=crop&w=1200&q=80';

type Stage = 'phone' | 'code';

export default function LoginScreen() {
  const { role } = useLocalSearchParams<{ role?: UserType }>();
  const router = useRouter();
  const { requestOtp, verifyOtp } = useAuth();

  const [stage, setStage] = useState<Stage>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+61');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This maps to users.name (the account holder), not salons.business_name —
  // the business name itself is captured later, during profile setup.
  const nameLabel = 'Your name';

  async function handleSendCode() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await requestOtp(phoneNumber.trim());
      setDebugCode(result.debug_code);
      setStage('code');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send a code. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyOtp(
        phoneNumber.trim(),
        code.trim(),
        name.trim() || undefined,
        role,
        email.trim() || undefined
      );
      // AuthProvider now holds a user; the root layout's protected-route guard
      // takes it from here and swaps to the (app) group automatically.
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That code didn’t work. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSend = phoneNumber.trim().length >= 8;
  const canVerify = code.trim().length === 6;

  return (
    <View style={styles.screen}>
      <ScreenHero image={HERO_IMAGE} height={100} />
      <SafeAreaView style={styles.safeArea}>
        <Pressable
          onPress={() => (stage === 'code' ? setStage('phone') : router.back())}
          style={styles.backButton}>
          <Feather name="chevron-left" size={19} color={Brand.brand} />
        </Pressable>

        <Text style={styles.heading}>
          {stage === 'phone' ? "What's your phone number?" : 'Enter your code'}
        </Text>
        <Text style={styles.subheading}>
          {stage === 'phone'
            ? "We'll text you a one-time code — no password needed."
            : `Sent to ${phoneNumber}`}
        </Text>

        {stage === 'phone' ? (
          <>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+61411111111"
              placeholderTextColor={Brand.text3}
              keyboardType="phone-pad"
              autoFocus
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable disabled={isSubmitting || !canSend} onPress={handleSendCode}>
              {({ pressed }) =>
                canSend ? (
                  <LinearGradient
                    colors={[Brand.roseVivid, Brand.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, (pressed || isSubmitting) && styles.pressed]}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Send code</Text>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={[styles.button, styles.buttonDisabled]}>
                    <Text style={styles.buttonTextDisabled}>Send code</Text>
                  </View>
                )
              }
            </Pressable>
          </>
        ) : (
          <>
            {debugCode && (
              <View style={styles.debugBox}>
                <Feather name="zap" size={13} color={Brand.amber} />
                <Text style={styles.debugText}>Dev mode — your code is {debugCode}</Text>
              </View>
            )}
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={Brand.text3}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <Text style={styles.fieldLabel}>{nameLabel}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={role === 'salon' ? 'Kate Dawes' : 'Jane Doe'}
              placeholderTextColor={Brand.text3}
            />
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Brand.text3}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.hint}>We'll send your welcome email here — you can change it anytime in Profile.</Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable disabled={isSubmitting || !canVerify} onPress={handleVerify}>
              {({ pressed }) =>
                canVerify ? (
                  <LinearGradient
                    colors={[Brand.roseVivid, Brand.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, (pressed || isSubmitting) && styles.pressed]}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Continue</Text>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={[styles.button, styles.buttonDisabled]}>
                    <Text style={styles.buttonTextDisabled}>Continue</Text>
                  </View>
                )
              }
            </Pressable>
          </>
        )}
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
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    ...Shadow.sm,
  },
  heading: {
    fontSize: 23,
    color: Brand.brand,
    marginBottom: 6,
    fontFamily: Type.displayBold,
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 12.5,
    color: Brand.text2,
    marginBottom: 22,
    fontFamily: Type.body,
  },
  fieldLabel: {
    fontSize: 11,
    color: Brand.accent,
    marginBottom: 6,
    marginTop: 2,
    fontFamily: Type.bodySemiBold,
  },
  input: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Brand.brand,
    marginBottom: 11,
    fontFamily: Type.bodyMedium,
    ...Shadow.sm,
  },
  debugBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Brand.amberBg,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 14,
  },
  debugText: {
    fontSize: 12,
    color: Brand.amber,
    fontFamily: Type.bodyMedium,
  },
  hint: {
    fontSize: 10.5,
    color: Brand.text3,
    marginBottom: 6,
    lineHeight: 15,
    fontFamily: Type.body,
  },
  error: {
    fontSize: 12,
    color: Brand.red,
    marginBottom: 10,
    fontFamily: Type.body,
  },
  button: {
    borderRadius: Radius.pill,
    paddingVertical: 15.5,
    alignItems: 'center',
    marginTop: 8,
    ...Shadow.md,
    shadowColor: Brand.accent,
  },
  buttonDisabled: {
    backgroundColor: Brand.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14.5,
    fontFamily: Type.bodySemiBold,
  },
  buttonTextDisabled: {
    color: Brand.text3,
    fontSize: 14.5,
    fontFamily: Type.bodySemiBold,
  },
  pressed: {
    opacity: 0.88,
  },
});
