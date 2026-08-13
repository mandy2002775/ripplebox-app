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

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { UserType } from '@/lib/types';

type Stage = 'phone' | 'code';

export default function LoginScreen() {
  const { role } = useLocalSearchParams<{ role?: UserType }>();
  const router = useRouter();
  const { requestOtp, verifyOtp } = useAuth();

  const [stage, setStage] = useState<Stage>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+61');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
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
      await verifyOtp(phoneNumber.trim(), code.trim(), name.trim() || undefined, role);
      // AuthProvider now holds a user; the root layout's protected-route guard
      // takes it from here and swaps to the (app) group automatically.
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That code didn’t work. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable
          onPress={() => (stage === 'code' ? setStage('phone') : router.back())}
          style={styles.backButton}>
          <Text style={styles.backButtonText}>{'‹'}</Text>
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
            <Pressable
              disabled={isSubmitting || phoneNumber.trim().length < 8}
              onPress={handleSendCode}
              style={({ pressed }) => [
                styles.button,
                (pressed || isSubmitting) && styles.pressed,
                phoneNumber.trim().length < 8 && styles.buttonDisabled,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send code</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            {debugCode && (
              <View style={styles.debugBox}>
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
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable
              disabled={isSubmitting || code.trim().length !== 6}
              onPress={handleVerify}
              style={({ pressed }) => [
                styles.button,
                (pressed || isSubmitting) && styles.pressed,
                code.trim().length !== 6 && styles.buttonDisabled,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 18,
    color: Brand.brand,
    marginTop: -2,
  },
  heading: {
    fontSize: 21,
    fontWeight: '500',
    color: Brand.brand,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 12,
    color: Brand.text2,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.accent,
    marginBottom: 5,
    marginTop: 4,
  },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Brand.brand,
    marginBottom: 9,
  },
  debugBox: {
    backgroundColor: Brand.amberBg,
    borderRadius: 11,
    padding: 11,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 12,
    color: Brand.amber,
    fontWeight: '500',
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
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
  },
});
