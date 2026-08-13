import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { UserType } from '@/lib/types';

type RoleOption = {
  role: UserType;
  title: string;
  subtitle: string;
  enabled: true;
};

type ComingSoonOption = {
  title: string;
  subtitle: string;
  enabled: false;
};

const roles: (RoleOption | ComingSoonOption)[] = [
  {
    role: 'salon',
    title: 'Salon or beauty business',
    subtitle: 'Subscribe and build your referral program',
    enabled: true,
  },
  {
    role: 'client',
    title: 'Client',
    subtitle: 'Download free — refer friends and earn rewards',
    enabled: true,
  },
  {
    title: 'Online products business',
    subtitle: 'Manage product referrals and orders',
    enabled: false,
  },
  {
    title: 'B2B referrals',
    subtitle: 'Business to business referral programs',
    enabled: false,
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.eyebrow}>WELCOME</Text>
        <Text style={styles.heading}>Who are you{'\n'}joining as?</Text>
        <Text style={styles.subheading}>Choose your account type to get started</Text>

        <View style={styles.list}>
          {roles.map((option) => {
            const isSalon = option.enabled && option.role === 'salon';

            return (
              <Pressable
                key={option.title}
                disabled={!option.enabled}
                onPress={() => {
                  if (option.enabled) {
                    router.push({ pathname: '/login', params: { role: option.role } });
                  }
                }}
                style={({ pressed }) => [
                  styles.card,
                  isSalon && styles.cardPrimary,
                  !option.enabled && styles.cardDisabled,
                  pressed && option.enabled && styles.pressed,
                ]}>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, isSalon && styles.cardTitleOnDark]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, isSalon && styles.cardSubtitleOnDark]}>
                    {option.subtitle}
                  </Text>
                </View>
                {!option.enabled && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Coming soon</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
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
  eyebrow: {
    fontSize: 10,
    color: Brand.text3,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  heading: {
    fontSize: 23,
    fontWeight: '500',
    color: Brand.brand,
    lineHeight: 28,
    marginBottom: 3,
  },
  subheading: {
    fontSize: 12,
    color: Brand.text2,
    marginBottom: 22,
  },
  list: {
    gap: 9,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 18,
    padding: 16,
  },
  cardPrimary: {
    backgroundColor: Brand.brand,
    borderColor: Brand.brand,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.brand,
  },
  cardTitleOnDark: {
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 11,
    color: Brand.text2,
    marginTop: 1,
  },
  cardSubtitleOnDark: {
    color: '#8868B8',
  },
  badge: {
    backgroundColor: Brand.lavender,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Brand.brand3,
  },
  pressed: {
    opacity: 0.85,
  },
});
