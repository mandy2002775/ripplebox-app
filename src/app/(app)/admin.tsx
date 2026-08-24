import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import { AdminStats, AdminSubscriptionSummary, PlanType, SalonLead } from '@/lib/types';

const PLAN_LABELS: Record<PlanType, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  trialing: { bg: Brand.amberBg, text: Brand.amber },
  active: { bg: Brand.greenBg, text: Brand.green },
  overdue: { bg: Brand.redBg, text: Brand.red },
  cancelled: { bg: Brand.lavender, text: Brand.text2 },
};

export default function AdminScreen() {
  const { user, token, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionSummary[]>([]);
  const [leads, setLeads] = useState<SalonLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    return Promise.all([
      apiRequest<AdminStats>('/admin/stats', { token }),
      apiRequest<AdminSubscriptionSummary[]>('/admin/subscriptions', { token }),
      apiRequest<SalonLead[]>('/admin/leads', { token }),
    ])
      .then(([s, subs, l]) => {
        setStats(s);
        setSubscriptions(subs);
        setLeads(l);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Owner access only</Text>
            <Text style={styles.heading}>Admin panel</Text>
          </View>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>🛡️ {user?.name}</Text>
          </View>
        </View>

        {isLoading || !stats ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.statGrid}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Active salons</Text>
              <Text style={styles.statNumber}>{stats.active_salons_count}</Text>
              <Text style={styles.statTrend}>+{stats.active_salons_this_week} this week</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Total clients</Text>
              <Text style={styles.statNumber}>{stats.total_clients_count}</Text>
              <Text style={styles.statTrend}>+{stats.total_clients_this_week} this week</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Monthly revenue</Text>
              <Text style={styles.statNumberAccent}>${stats.monthly_revenue.toFixed(0)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Total referrals</Text>
              <Text style={styles.statNumber}>{stats.total_referrals_count}</Text>
              <Text style={styles.statTrend}>+{stats.total_referrals_this_week} this week</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Website leads</Text>
              <Text style={styles.statNumber}>{stats.pending_leads_count}</Text>
            </View>
          </View>
        )}

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <Text style={styles.sectionLabel}>Recent subscriptions</Text>
          {subscriptions.length === 0 ? (
            <Text style={styles.emptyText}>No subscriptions yet.</Text>
          ) : (
            subscriptions.map((s) => {
              const colors = STATUS_COLORS[s.status] ?? STATUS_COLORS.trialing;
              return (
                <View key={s.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{s.salon_name}</Text>
                    <Text style={styles.rowSub}>{PLAN_LABELS[s.plan_type]}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          <Text style={styles.sectionLabel}>Website leads</Text>
          {leads.length === 0 ? (
            <Text style={styles.emptyText}>No signups from the website yet.</Text>
          ) : (
            leads.map((lead) => (
              <View key={lead.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{lead.business_name}</Text>
                  <Text style={styles.rowSub}>
                    {[lead.owner_name, lead.location, lead.phone_number, lead.email]
                      .filter(Boolean)
                      .join(' • ') || 'No contact details'}
                  </Text>
                </View>
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>Quick actions</Text>
          <View style={styles.actionGrid}>
            <Pressable onPress={() => router.push('/reports')} style={styles.actionTile}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Reports</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/db-schema')} style={styles.actionTile}>
              <Text style={styles.actionIcon}>🗄️</Text>
              <Text style={styles.actionLabel}>DB schema</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => signOut()}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
            <Text style={styles.signOutText}>Sign out</Text>
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
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    color: '#9070C0',
  },
  heading: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: 'rgba(142,232,200,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8ee8c8',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  stat: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 11,
    padding: 12,
  },
  statLabel: {
    fontSize: 9,
    color: '#9070C0',
    marginBottom: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
  },
  statNumberAccent: {
    fontSize: 22,
    fontWeight: '500',
    color: '#8ee8c8',
  },
  statTrend: {
    fontSize: 9,
    color: '#8ee8c8',
    marginTop: 1,
  },
  body: {
    flex: 1,
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
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
  badge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Brand.brand,
    marginTop: 5,
  },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: Brand.brand,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.brand,
  },
});
