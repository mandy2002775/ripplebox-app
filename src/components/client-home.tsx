import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
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
          <Feather name="bell" size={17} color={Brand.brand} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <LinearGradient
        colors={[Brand.roseVivid, Brand.accent, Brand.brand3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your referral code</Text>
        <View style={styles.codeRow}>
          <Text style={styles.code}>{user.client?.referral_code}</Text>
          <Pressable onPress={handleShare} style={styles.shareButton}>
            <Feather name="share" size={13} color="#fff" />
            <Text style={styles.shareButtonText}>Share</Text>
          </Pressable>
        </View>
        <View style={styles.quickShareRow}>
          <Pressable onPress={handleShareWhatsApp} style={styles.quickShareChip}>
            <Feather name="message-circle" size={11} color="#fff" />
            <Text style={styles.quickShareChipText}>WhatsApp</Text>
          </Pressable>
          <Pressable onPress={handleShareEmail} style={styles.quickShareChip}>
            <Feather name="mail" size={11} color="#fff" />
            <Text style={styles.quickShareChipText}>Email</Text>
          </Pressable>
          <Pressable onPress={handleCopyCode} style={styles.quickShareChip}>
            <Feather name={isCopied ? 'check' : 'copy'} size={11} color="#fff" />
            <Text style={styles.quickShareChipText}>{isCopied ? 'Copied' : 'Copy'}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>Couldn't load your dashboard.</Text>
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
            <Pressable onPress={() => router.push('/refer')} style={styles.seeAllRow}>
              <Text style={styles.seeAll}>See all</Text>
              <Feather name="arrow-right" size={12} color={Brand.accent} />
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

          <Pressable onPress={() => router.push('/discover')}>
            {({ pressed }) => (
              <LinearGradient
                colors={[Brand.brand2, Brand.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.discoverCard, pressed && styles.pressed]}>
                <View style={styles.discoverIconWrap}>
                  <Feather name="search" size={17} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.discoverTitle}>Got a friend's code?</Text>
                  <Text style={styles.discoverSub}>Find their salon and redeem it in Discover</Text>
                </View>
                <Feather name="arrow-right" size={17} color="#fff" />
              </LinearGradient>
            )}
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
    fontFamily: Type.bodyMedium,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  name: { fontSize: 23, color: Brand.brand, fontFamily: Type.displayBold, letterSpacing: -0.3 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
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
    fontFamily: Type.bodyBold,
    color: '#fff',
  },
  codeCard: {
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: 20,
    ...Shadow.md,
    shadowColor: Brand.accent,
  },
  codeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontFamily: Type.bodyMedium },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontSize: 26, color: '#fff', letterSpacing: 4, fontFamily: Type.displayBold },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  shareButtonText: { fontSize: 11.5, color: '#fff', fontFamily: Type.bodySemiBold },
  quickShareRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
  },
  quickShareChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  quickShareChipText: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Type.bodyMedium,
  },
  statGrid: { flexDirection: 'row', gap: 9, marginBottom: 10 },
  stat: {
    flex: 1,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statNumber: { fontSize: 20, color: Brand.brand, fontFamily: Type.displayBold },
  statLabel: { fontSize: 9.5, color: Brand.text3, marginTop: 3, fontFamily: Type.bodyMedium },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 10.5,
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: Type.bodySemiBold,
  },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAll: {
    fontSize: 11.5,
    color: Brand.accent,
    fontFamily: Type.bodySemiBold,
  },
  emptyText: { fontSize: 12, color: Brand.text3, marginTop: 4, fontFamily: Type.body },
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
  rowTitle: { fontSize: 13, color: Brand.brand, fontFamily: Type.bodySemiBold },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 1, fontFamily: Type.body },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.lg,
    padding: 17,
    marginTop: 20,
    ...Shadow.md,
  },
  discoverIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverTitle: { fontSize: 14, color: '#fff', marginBottom: 2, fontFamily: Type.bodySemiBold },
  discoverSub: { fontSize: 11, color: 'rgba(255,255,255,0.68)', fontFamily: Type.body },
  pressed: { opacity: 0.9 },
  errorBox: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 22,
    alignItems: 'center',
    marginTop: 20,
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
