import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  if (user.user_type === 'salon' && !user.salon) {
    return <Redirect href="/salon-profile-setup" />;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.eyebrow}>
          {user.user_type === 'salon' ? 'Business account' : 'Client account'}
        </Text>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.phone}>{user.phone_number}</Text>

        {user.user_type === 'client' && user.client && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your referral code</Text>
            <Text style={styles.referralCode}>{user.client.referral_code}</Text>
            <Text style={styles.cardHint}>
              The full referral, rewards, and sharing screens are next — this confirms your login
              and account are wired up end to end.
            </Text>
          </View>
        )}

        {user.user_type === 'salon' && user.salon && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{user.salon.business_name}</Text>
            <Text style={styles.cardHint}>
              {user.salon.location}
              {'\n\n'}
              Profile saved. Stripe subscription and the full dashboard are next.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => signOut()}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Sign out</Text>
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
    fontSize: 11,
    color: Brand.text3,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '500',
    color: Brand.brand,
  },
  phone: {
    fontSize: 13,
    color: Brand.text2,
    marginTop: 2,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 16,
  },
  cardLabel: {
    fontSize: 11,
    color: Brand.text2,
    marginBottom: 6,
  },
  referralCode: {
    fontSize: 26,
    fontWeight: '500',
    color: Brand.brand,
    letterSpacing: 4,
    marginBottom: 8,
  },
  cardHint: {
    fontSize: 12,
    color: Brand.text2,
    lineHeight: 18,
  },
  signOutButton: {
    marginTop: 'auto',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Brand.brand,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: Brand.brand,
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
  },
});
