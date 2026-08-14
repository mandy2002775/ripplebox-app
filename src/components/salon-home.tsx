import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import { SalonDashboard, User } from '@/lib/types';
import { RowButton } from '@/components/row-button';

export function SalonHome({ user }: { user: User }) {
  const { token, signOut } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<SalonDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      apiRequest<SalonDashboard>('/salons/dashboard', { token })
        .then((data) => {
          if (!cancelled) setDashboard(data);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [token])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Business dashboard</Text>
      <Text style={styles.name}>{user.salon?.business_name}</Text>

      {isLoading || !dashboard ? (
        <ActivityIndicator color={Brand.brand} style={{ marginTop: 20 }} />
      ) : (
        <>
          <View style={styles.statGrid}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{dashboard.referrals_count}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{dashboard.converted_count}</Text>
              <Text style={styles.statLabel}>Converted</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Recent referrals</Text>
          {dashboard.recent_referrals.length === 0 ? (
            <Text style={styles.emptyText}>No referrals yet.</Text>
          ) : (
            dashboard.recent_referrals.map((r) => (
              <View key={r.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {r.referrer_name} referred {r.referred_name}
                  </Text>
                </View>
                <StatusBadge status={r.status} />
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>Active rewards</Text>
          {dashboard.active_rewards.length === 0 ? (
            <Text style={styles.emptyText}>No active rewards yet.</Text>
          ) : (
            dashboard.active_rewards.map((reward) => (
              <View key={reward.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{reward.description}</Text>
                  <Text style={styles.rowSub}>{reward.redemptions_count ?? 0} redeemed</Text>
                </View>
              </View>
            ))
          )}

          <RowButton label="+ Add reward" onPress={() => router.push('/rewards')} />
          <RowButton label="Sign out" variant="ghost" onPress={() => signOut()} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    color: Brand.text3,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '500',
    color: Brand.brand,
    marginBottom: 18,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '500',
    color: Brand.brand,
  },
  statLabel: {
    fontSize: 10,
    color: Brand.text3,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: Brand.text3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 7,
  },
  rowTitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: Brand.brand,
  },
  rowSub: {
    fontSize: 11,
    color: Brand.text2,
    marginTop: 1,
  },
});
