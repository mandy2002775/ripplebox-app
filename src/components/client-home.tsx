import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RowButton } from '@/components/row-button';
import { StatusBadge } from '@/components/status-badge';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, ApiError } from '@/lib/api';
import { ClientDashboard, NotificationsResponse, SalonSummary, User } from '@/lib/types';

export function ClientHome({ user }: { user: User }) {
  const { token, signOut } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ClientDashboard | null>(null);
  const [salons, setSalons] = useState<SalonSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    Promise.all([
      apiRequest<ClientDashboard>('/clients/dashboard', { token }),
      apiRequest<SalonSummary[]>('/salons', { token }),
      apiRequest<NotificationsResponse>('/notifications', { token }),
    ])
      .then(([d, s, n]) => {
        setDashboard(d);
        setSalons(s);
        setUnreadCount(n.unread_count);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  async function handleShare() {
    const message = `Use my Ripplebox code ${user.client?.referral_code} at a participating salon and we both get a reward!`;
    try {
      await Share.share({ message });
    } catch {
      // Share sheet unsupported (e.g. some web browsers) — nothing to do,
      // the code is already visible on screen to copy manually.
    }
  }

  async function handleRedeem() {
    if (!selectedSalonId || !redeemCode.trim()) return;
    setMessage(null);
    setIsRedeeming(true);
    try {
      await apiRequest('/referrals', {
        method: 'POST',
        token,
        body: { referral_code: redeemCode.trim(), salon_id: selectedSalonId },
      });
      setMessage({ text: 'Code redeemed! Your referral is now pending.', isError: false });
      setRedeemCode('');
      setSelectedSalonId(null);
      load();
    } catch (e) {
      setMessage({
        text: e instanceof ApiError ? e.message : 'Could not redeem that code.',
        isError: true,
      });
    } finally {
      setIsRedeeming(false);
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
      </View>

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
              <Text style={styles.statNumber}>{dashboard.rewards_count}</Text>
              <Text style={styles.statLabel}>Rewards</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>${dashboard.earned}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          {dashboard.referrals.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>My referrals</Text>
              {dashboard.referrals.map((r) => (
                <View key={r.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{r.referred_name}</Text>
                    <Text style={styles.rowSub}>{r.salon_name}</Text>
                  </View>
                  <StatusBadge status={r.status} />
                </View>
              ))}
            </>
          )}

          {dashboard.redemptions.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>My rewards</Text>
              {dashboard.redemptions.map((r) => (
                <View key={r.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{r.description}</Text>
                    <Text style={styles.rowSub}>{r.salon_name}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          <Text style={styles.sectionLabel}>Redeem a friend's code</Text>
          <Text style={styles.sectionHint}>
            Pick the salon you're visiting, then enter the code they gave you.
          </Text>

          {salons.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSelectedSalonId(s.id)}
              style={[styles.salonRow, selectedSalonId === s.id && styles.salonRowSelected]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{s.business_name}</Text>
                <Text style={styles.rowSub}>{s.location}</Text>
              </View>
              {selectedSalonId === s.id && <Text style={styles.selectedMark}>✓</Text>}
            </Pressable>
          ))}

          {selectedSalonId && (
            <View style={styles.redeemBox}>
              <TextInput
                style={styles.input}
                value={redeemCode}
                onChangeText={setRedeemCode}
                placeholder="Friend's referral code"
                placeholderTextColor={Brand.text3}
                autoCapitalize="characters"
              />
              {message && (
                <Text style={message.isError ? styles.error : styles.success}>
                  {message.text}
                </Text>
              )}
              <RowButton
                label={isRedeeming ? 'Redeeming…' : 'Redeem code'}
                onPress={handleRedeem}
                disabled={isRedeeming || !redeemCode.trim()}
              />
            </View>
          )}

          <RowButton label="Sign out" variant="ghost" onPress={() => signOut()} />
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
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 4,
  },
  sectionHint: { fontSize: 11.5, color: Brand.text2, marginBottom: 8, lineHeight: 16 },
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
  salonRow: {
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
  salonRowSelected: {
    borderWidth: 1.5,
    borderColor: Brand.brand,
    backgroundColor: Brand.lavender,
  },
  selectedMark: { color: Brand.brand, fontWeight: '700' },
  redeemBox: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.brand,
    marginBottom: 10,
  },
  error: { fontSize: 12, color: Brand.red, marginBottom: 8 },
  success: { fontSize: 12, color: Brand.green, marginBottom: 8 },
});
