import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHero } from '@/components/screen-hero';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import { ClientDashboard } from '@/lib/types';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1200&q=80';

// Named distinctly from (tabs)/rewards.tsx, which is the salon's own
// rewards-management screen — this is the client's read-only "what have I
// earned" view.
export default function ClientRewardsScreen() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<ClientDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    apiRequest<ClientDashboard>('/clients/dashboard', { token })
      .then(setDashboard)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHero image={HERO_IMAGE} height={100} />
        <View style={styles.header}>
          <Text style={styles.heading}>My rewards</Text>
          <Text style={styles.subheading}>Everything you've earned from referring friends</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Couldn't load your rewards.</Text>
              <Pressable onPress={load} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : isLoading || !dashboard ? (
            <ActivityIndicator color={Brand.accent} style={{ marginTop: 20 }} />
          ) : (
            <>
              <View style={styles.statGrid}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{dashboard.rewards_count}</Text>
                  <Text style={styles.statLabel}>Rewards earned</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>${dashboard.earned}</Text>
                  <Text style={styles.statLabel}>Total value</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Reward history</Text>
              {dashboard.redemptions.length === 0 ? (
                <Text style={styles.emptyText}>
                  No rewards yet — refer a friend and they'll show up here once redeemed.
                </Text>
              ) : (
                dashboard.redemptions.map((r) => (
                  <View key={r.id} style={styles.row}>
                    <View style={styles.rewardIcon}>
                      <Feather name="gift" size={15} color={Brand.amber} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{r.description}</Text>
                      <Text style={styles.rowSub}>
                        {r.salon_name} • {new Date(r.redeemed_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 14, marginBottom: 16 },
  heading: { fontSize: 19, color: Brand.brand, fontFamily: Type.displayBold, letterSpacing: -0.2 },
  subheading: { fontSize: 11.5, color: Brand.text2, marginTop: 2, fontFamily: Type.body },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  statGrid: { flexDirection: 'row', gap: 9, marginBottom: 20 },
  stat: {
    flex: 1,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    paddingVertical: 17,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statNumber: { fontSize: 23, color: Brand.brand, fontFamily: Type.displayBold },
  statLabel: { fontSize: 10, color: Brand.text3, marginTop: 3, fontFamily: Type.bodyMedium },
  sectionLabel: {
    fontSize: 10.5,
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: Type.bodySemiBold,
  },
  emptyText: { fontSize: 12, color: Brand.text3, marginTop: 4, fontFamily: Type.body },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 13,
    marginBottom: 8,
    ...Shadow.sm,
  },
  rewardIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Brand.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 13, color: Brand.brand, fontFamily: Type.bodySemiBold },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 1, fontFamily: Type.body },
  errorBox: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 22,
    alignItems: 'center',
    marginTop: 10,
    ...Shadow.sm,
  },
  errorBoxText: { fontSize: 12.5, color: Brand.text2, marginBottom: 12, fontFamily: Type.body },
  retryButton: {
    backgroundColor: Brand.brand,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: { fontSize: 12.5, color: '#fff', fontFamily: Type.bodySemiBold },
});
