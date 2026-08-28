import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import { ClientDashboard } from '@/lib/types';

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
            <ActivityIndicator color={Brand.brand} style={{ marginTop: 20 }} />
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
                      <Text style={styles.rewardIconText}>🎁</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 14 },
  heading: { fontSize: 16, fontWeight: '500', color: Brand.brand },
  subheading: { fontSize: 11, color: Brand.text2 },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  statGrid: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statNumber: { fontSize: 22, fontWeight: '500', color: Brand.brand },
  statLabel: { fontSize: 10, color: Brand.text3, marginTop: 2 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  emptyText: { fontSize: 12, color: Brand.text3, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 7,
  },
  rewardIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Brand.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconText: { fontSize: 16 },
  rowTitle: { fontSize: 12.5, fontWeight: '500', color: Brand.brand },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 1 },
  errorBox: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  errorBoxText: { fontSize: 12.5, color: Brand.text2, marginBottom: 12 },
  retryButton: {
    backgroundColor: Brand.brand,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: { fontSize: 12.5, fontWeight: '500', color: '#fff' },
});
