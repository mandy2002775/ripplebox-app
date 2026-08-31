import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { UserType } from '@/lib/types';

type RoleOption = {
  role: UserType;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  enabled: true;
};

type ComingSoonOption = {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  enabled: false;
};

const roles: (RoleOption | ComingSoonOption)[] = [
  {
    role: 'salon',
    title: 'Salon or beauty business',
    subtitle: 'Subscribe and build your referral program',
    icon: 'scissors',
    enabled: true,
  },
  {
    role: 'client',
    title: 'Client',
    subtitle: 'Download free — refer friends and earn rewards',
    icon: 'heart',
    enabled: true,
  },
  {
    title: 'Online products business',
    subtitle: 'Manage product referrals and orders',
    icon: 'shopping-bag',
    enabled: false,
  },
  {
    title: 'B2B referrals',
    subtitle: 'Business to business referral programs',
    icon: 'briefcase',
    enabled: false,
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.eyebrow}>WELCOME</Text>
        <Text style={styles.heading}>
          Who are you{'\n'}joining <Text style={styles.headingItalic}>as?</Text>
        </Text>
        <Text style={styles.subheading}>Choose your account type to get started</Text>

        <View style={styles.list}>
          {roles.map((option) => {
            const isSalon = option.enabled && option.role === 'salon';

            const content = (
              <>
                <View style={[styles.iconWrap, isSalon && styles.iconWrapOnDark]}>
                  <Feather
                    name={option.icon}
                    size={19}
                    color={isSalon ? '#fff' : Brand.accent}
                  />
                </View>
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
                {option.enabled && (
                  <Feather
                    name="arrow-right"
                    size={17}
                    color={isSalon ? 'rgba(255,255,255,0.6)' : Brand.text3}
                  />
                )}
              </>
            );

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
                  !option.enabled && styles.cardDisabled,
                  pressed && option.enabled && styles.pressed,
                ]}>
                {isSalon ? (
                  <LinearGradient
                    colors={[Brand.brand3, Brand.brand]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.card, styles.cardPrimary]}>
                    {content}
                  </LinearGradient>
                ) : (
                  <View style={styles.card}>{content}</View>
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
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  eyebrow: {
    fontSize: 10.5,
    color: Brand.text3,
    fontFamily: Type.bodySemiBold,
    letterSpacing: 1,
    marginBottom: 8,
  },
  heading: {
    fontSize: 30,
    color: Brand.brand,
    lineHeight: 36,
    marginBottom: 6,
    fontFamily: Type.displayBold,
    letterSpacing: -0.3,
  },
  headingItalic: {
    fontFamily: Type.displayItalic,
    color: Brand.accent,
  },
  subheading: {
    fontSize: 13,
    color: Brand.text2,
    marginBottom: 26,
    fontFamily: Type.body,
  },
  list: {
    gap: 11,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    padding: 17,
    gap: 13,
    ...Shadow.sm,
  },
  cardPrimary: {
    ...Shadow.md,
    shadowColor: Brand.brand,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOnDark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    color: Brand.brand,
    fontFamily: Type.bodySemiBold,
  },
  cardTitleOnDark: {
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: Brand.text2,
    marginTop: 2,
    fontFamily: Type.body,
  },
  cardSubtitleOnDark: {
    color: 'rgba(255,255,255,0.62)',
  },
  badge: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    color: Brand.brand3,
    fontFamily: Type.bodyMedium,
  },
  pressed: {
    opacity: 0.88,
  },
});
