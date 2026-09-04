import { Feather } from '@expo/vector-icons';
import { Redirect, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHero } from '@/components/screen-hero';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import { AdminStats, AdminSubscriptionSummary, PlanType, SalonLead } from '@/lib/types';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1200&q=80';

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
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
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
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function deleteLead(lead: SalonLead) {
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    try {
      await apiRequest(`/admin/leads/${lead.id}`, { method: 'DELETE', token });
    } catch {
      // Roll back on failure — same optimistic-update pattern as elsewhere.
      setLeads((prev) => [...prev, lead].sort((a, b) => b.created_at.localeCompare(a.created_at)));
    }
  }

  // Only reachable via index.tsx's own redirect in normal use, but nothing
  // stops a non-admin from deep-linking straight here — the API would 403
  // them anyway, but this avoids that showing up as an unexplained stuck
  // spinner.
  if (user && user.user_type !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHero image={HERO_IMAGE} height={110} fadeTo={Brand.brand} />
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Owner access only</Text>
            <Text style={styles.heading}>Admin panel</Text>
          </View>
          <View style={styles.adminBadge}>
            <Feather name="shield" size={11} color="#8ee8c8" />
            <Text style={styles.adminBadgeText}>{user?.name}</Text>
          </View>
        </View>

        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>Couldn't load the admin panel.</Text>
            <Pressable onPress={load} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : isLoading || !stats ? (
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
                <Pressable onPress={() => deleteLead(lead)} hitSlop={8} style={styles.deleteButton}>
                  <Feather name="trash-2" size={15} color={Brand.text3} />
                </Pressable>
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>Quick actions</Text>
          <View style={styles.actionGrid}>
            <Pressable onPress={() => router.push('/reports')} style={styles.actionTile}>
              <View style={styles.actionIconWrap}>
                <Feather name="bar-chart-2" size={18} color={Brand.accent} />
              </View>
              <Text style={styles.actionLabel}>Reports</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/db-schema')} style={styles.actionTile}>
              <View style={styles.actionIconWrap}>
                <Feather name="database" size={18} color={Brand.accent} />
              </View>
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
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    color: '#9070C0',
    fontFamily: Type.body,
  },
  heading: {
    fontSize: 21,
    color: '#fff',
    letterSpacing: -0.2,
    marginTop: 3,
    fontFamily: Type.displayBold,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(142,232,200,0.15)',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#8ee8c8',
    fontFamily: Type.bodyMedium,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  stat: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.md,
    padding: 13,
  },
  statLabel: {
    fontSize: 9,
    color: '#9070C0',
    marginBottom: 4,
    fontFamily: Type.bodyMedium,
  },
  statNumber: {
    fontSize: 22,
    color: '#fff',
    fontFamily: Type.displayBold,
  },
  statNumberAccent: {
    fontSize: 22,
    color: '#8ee8c8',
    fontFamily: Type.displayBold,
  },
  statTrend: {
    fontSize: 9,
    color: '#8ee8c8',
    marginTop: 2,
    fontFamily: Type.bodyMedium,
  },
  body: {
    flex: 1,
    backgroundColor: Brand.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 10.5,
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
    fontFamily: Type.bodySemiBold,
  },
  emptyText: {
    fontSize: 12,
    color: Brand.text3,
    fontFamily: Type.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 13,
    marginBottom: 8,
    ...Shadow.sm,
  },
  rowTitle: {
    fontSize: 13,
    color: Brand.brand,
    fontFamily: Type.bodySemiBold,
  },
  rowSub: {
    fontSize: 11,
    color: Brand.text2,
    marginTop: 1,
    fontFamily: Type.body,
  },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Type.bodySemiBold,
  },
  deleteButton: {
    padding: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
  },
  actionTile: {
    flex: 1,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    ...Shadow.sm,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: Brand.brand,
    marginTop: 8,
    fontFamily: Type.bodySemiBold,
  },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: Brand.brand,
    borderRadius: Radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  signOutText: {
    fontSize: 14,
    color: Brand.brand,
    fontFamily: Type.bodySemiBold,
  },
  errorBox: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.md,
    padding: 20,
    alignItems: 'center',
  },
  errorBoxText: { fontSize: 12.5, color: '#fff', marginBottom: 12, fontFamily: Type.body },
  retryButton: {
    backgroundColor: '#8ee8c8',
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: { fontSize: 12.5, color: Brand.brand, fontFamily: Type.bodySemiBold },
});
