import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/status-badge';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import { ClientDashboard, ReferralStatus } from '@/lib/types';

type FilterTab = 'all' | ReferralStatus;

const FILTERS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'redeemed', label: 'Redeemed' },
];

const SHARE_ACTIONS: { key: string; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { key: 'share', icon: 'share', label: 'Share' },
  { key: 'whatsapp', icon: 'message-circle', label: 'WhatsApp' },
  { key: 'email', icon: 'mail', label: 'Email' },
  { key: 'copy', icon: 'copy', label: 'Copy' },
];

export default function ReferScreen() {
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<ClientDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [isCopied, setIsCopied] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    apiRequest<ClientDashboard>('/clients/dashboard', { token })
      .then(setDashboard)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  const code = user?.client?.referral_code ?? '';
  const shareMessage = `Use my Ripplebox code ${code} at a participating salon and we both get a reward!`;

  async function handleShare() {
    try {
      await Share.share({ message: shareMessage });
    } catch {
      // Share sheet unsupported — the code is already visible on screen.
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
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the platform — code is on screen.
    }
  }

  const handlers: Record<string, () => void> = {
    share: handleShare,
    whatsapp: handleShareWhatsApp,
    email: handleShareEmail,
    copy: handleCopyCode,
  };

  const referrals = dashboard?.referrals ?? [];
  const filtered = useMemo(
    () => (filter === 'all' ? referrals : referrals.filter((r) => r.status === filter)),
    [referrals, filter]
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.heading}>Refer & earn</Text>
          <Text style={styles.subheading}>Share your code, track every referral</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <LinearGradient
            colors={[Brand.roseVivid, Brand.accent, Brand.brand3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}>
            <Text style={styles.heroLabel}>Your referral code</Text>
            <Text style={styles.heroCode}>{code}</Text>
            <Text style={styles.heroHint}>
              Send this to a friend — when they book their first visit and mention it, you both
              get rewarded.
            </Text>
            <View style={styles.shareGrid}>
              {SHARE_ACTIONS.map((a) => (
                <Pressable key={a.key} onPress={handlers[a.key]} style={styles.shareBtn}>
                  <Feather
                    name={a.key === 'copy' && isCopied ? 'check' : a.icon}
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.shareBtnText}>
                    {a.key === 'copy' && isCopied ? 'Copied' : a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </LinearGradient>

          <View style={styles.tabRow}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[styles.tab, filter === f.value && styles.tabActive]}>
                <Text style={[styles.tabText, filter === f.value && styles.tabTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Couldn't load your referrals.</Text>
              <Pressable onPress={load} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <ActivityIndicator color={Brand.accent} style={{ marginTop: 20 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {referrals.length === 0
                ? 'No referrals yet — share your code above to get started.'
                : 'Nothing here yet.'}
            </Text>
          ) : (
            filtered.map((r) => (
              <View key={r.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{r.referred_name}</Text>
                  <Text style={styles.rowSub}>
                    {r.salon_name} • {new Date(r.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <StatusBadge status={r.status} />
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 14, marginBottom: 14 },
  heading: { fontSize: 19, color: Brand.brand, fontFamily: Type.displayBold, letterSpacing: -0.2 },
  subheading: { fontSize: 11.5, color: Brand.text2, marginTop: 2, fontFamily: Type.body },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  heroCard: {
    borderRadius: Radius.lg,
    padding: 21,
    marginBottom: 18,
    ...Shadow.md,
    shadowColor: Brand.accent,
  },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 7, fontFamily: Type.bodyMedium },
  heroCode: { fontSize: 31, color: '#fff', letterSpacing: 5, marginBottom: 12, fontFamily: Type.displayBold },
  heroHint: { fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 17, marginBottom: 17, fontFamily: Type.body },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  shareBtnText: { fontSize: 11.5, color: '#fff', fontFamily: Type.bodySemiBold },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    ...Shadow.sm,
  },
  tabActive: { backgroundColor: Brand.brand, shadowOpacity: 0, elevation: 0 },
  tabText: { fontSize: 11, color: Brand.text2, fontFamily: Type.bodyMedium },
  tabTextActive: { color: '#fff', fontFamily: Type.bodySemiBold },
  emptyText: { fontSize: 12, color: Brand.text3, textAlign: 'center', marginTop: 30, fontFamily: Type.body },
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
