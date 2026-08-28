import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import { ClientDashboard, NotificationsResponse, User } from '@/lib/types';

export function ClientHome({ user }: { user: User }) {
  const { token } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ClientDashboard | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    Promise.all([
      apiRequest<ClientDashboard>('/clients/dashboard', { token }),
      apiRequest<NotificationsResponse>('/notifications', { token }),
    ])
      .then(([d, n]) => {
        setDashboard(d);
        setUnreadCount(n.unread_count);
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  const shareMessage = `Use my Ripplebox code ${user.client?.referral_code} at a participating salon and we both get a reward!`;

  async function handleShare() {
    try {
      await Share.share({ message: shareMessage });
    } catch {
      // Share sheet unsupported (e.g. some web browsers) — nothing to do,
      // the code is already visible on screen to copy manually.
    }
  }

  function handleShareWhatsApp() {
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`);
  }

  function handleShareEmail() {
    const subject = encodeURIComponent('Join me on Ripplebox');
    Linking.openURL(`mailto:?subject=${subject}&body=${encodeURIComponent(shareMessage)}`);
  }

  async function handleCopyCode() {
    if (!user.client?.referral_code) return;
    try {
      await Clipboard.setStringAsync(user.client.referral_code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the platform (e.g. an embedded
      // webview without clipboard permission) — the code is already
      // visible on screen to copy manually, so just leave the button as is.
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Good to see you</Text>
          <Text style={styles.name}>{user.name}</Text>
        </View>
        <Pressable onPress={() => router.push('/notifications')} style={styles.bellButton}>
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your referral code</Text>
        <View style={styles.codeRow}>
          <Text style={styles.code}>{user.client?.referral_code}</Text>
          <Pressable onPress={handleShare} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share</Text>
          </Pressable>
        </View>
        <View style={styles.quickShareRow}>
          <Pressable onPress={handleShareWhatsApp} style={styles.quickShareChip}>
            <Text style={styles.quickShareChipText}>💬 WhatsApp</Text>
          </Pressable>
          <Pressable onPress={handleShareEmail} style={styles.quickShareChip}>
            <Text style={styles.quickShareChipText}>✉️ Email</Text>
          </Pressable>
          <Pressable onPress={handleCopyCode} style={styles.quickShareChip}>
            <Text style={styles.quickShareChipText}>{isCopied ? '✓ Copied' : '📋 Copy'}</Text>
          </Pressable>
        </View>
      </View>

      {loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>Couldn't load your dashboard.</Text>
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
              <Text style={styles.statNumber}>{dashboard.referrals_count}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{dashboard.rewards_count}</Text>
              <Text style={styles.statLabel}>Rewards</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>${dashboard.earned}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Recent referrals</Text>
            <Pressable onPress={() => router.push('/refer')}>
              <Text style={styles.seeAll}>See all →</Text>
            </Pressable>
          </View>
          {dashboard.referrals.length === 0 ? (
            <Text style={styles.emptyText}>No referrals yet — share your code to get started.</Text>
          ) : (
            dashboard.referrals.slice(0, 3).map((r) => (
              <View key={r.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{r.referred_name}</Text>
                  <Text style={styles.rowSub}>{r.salon_name}</Text>
                </View>
                <StatusBadge status={r.status} />
              </View>
            ))
          )}

          <Pressable onPress={() => router.push('/discover')} style={styles.discoverCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.discoverTitle}>Got a friend's code?</Text>
              <Text style={styles.discoverSub}>Find their salon and redeem it in Discover</Text>
            </View>
            <Text style={styles.discoverArrow}>→</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  eyebrow: {
    fontSize: 11,
    color: Brand.text3,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: { fontSize: 22, fontWeight: '500', color: Brand.brand },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 15,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  codeCard: {
    backgroundColor: Brand.rose,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  codeLabel: { fontSize: 10, color: '#D0B8CC', marginBottom: 6 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontSize: 24, fontWeight: '500', color: '#fff', letterSpacing: 4 },
  shareButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  shareButtonText: { fontSize: 11, fontWeight: '500', color: '#fff' },
  quickShareRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 9,
  },
  quickShareChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  quickShareChipText: {
    fontSize: 10,
    color: '#D0B8CC',
  },
  statGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNumber: { fontSize: 19, fontWeight: '500', color: Brand.brand },
  statLabel: { fontSize: 9, color: Brand.text3, marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.accent,
  },
  emptyText: { fontSize: 12, color: Brand.text3, marginTop: 4 },
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
  rowTitle: { fontSize: 12.5, fontWeight: '500', color: Brand.brand },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 1 },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.brand,
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
  },
  discoverTitle: { fontSize: 13.5, fontWeight: '500', color: '#fff', marginBottom: 2 },
  discoverSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  discoverArrow: { fontSize: 18, color: '#fff', marginLeft: 10 },
  errorBox: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
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
