import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/status-badge';
import { Brand } from '@/constants/theme';
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
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Your referral code</Text>
            <Text style={styles.heroCode}>{code}</Text>
            <Text style={styles.heroHint}>
              Send this to a friend — when they book their first visit and mention it, you both
              get rewarded.
            </Text>
            <View style={styles.shareGrid}>
              <Pressable onPress={handleShare} style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>📤 Share</Text>
              </Pressable>
              <Pressable onPress={handleShareWhatsApp} style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>💬 WhatsApp</Text>
              </Pressable>
              <Pressable onPress={handleShareEmail} style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>✉️ Email</Text>
              </Pressable>
              <Pressable onPress={handleCopyCode} style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>{isCopied ? '✓ Copied' : '📋 Copy'}</Text>
              </Pressable>
            </View>
          </View>

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
            <ActivityIndicator color={Brand.brand} style={{ marginTop: 20 }} />
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
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 12 },
  heading: { fontSize: 16, fontWeight: '500', color: Brand.brand },
  subheading: { fontSize: 11, color: Brand.text2 },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Brand.rose,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: { fontSize: 11, color: '#D0B8CC', marginBottom: 6 },
  heroCode: { fontSize: 30, fontWeight: '500', color: '#fff', letterSpacing: 5, marginBottom: 10 },
  heroHint: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17, marginBottom: 16 },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  shareBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  shareBtnText: { fontSize: 11.5, fontWeight: '500', color: '#fff' },
  tabRow: { flexDirection: 'row', gap: 5, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Brand.border,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Brand.brand, borderColor: Brand.brand },
  tabText: { fontSize: 11, color: Brand.text2 },
  tabTextActive: { color: '#fff', fontWeight: '500' },
  emptyText: { fontSize: 12, color: Brand.text3, textAlign: 'center', marginTop: 30 },
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
