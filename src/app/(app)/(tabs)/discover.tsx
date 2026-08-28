import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RowButton } from '@/components/row-button';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, ApiError } from '@/lib/api';
import { SalonSummary } from '@/lib/types';

export default function DiscoverScreen() {
  const { token } = useAuth();
  const [salons, setSalons] = useState<SalonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');

  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    apiRequest<SalonSummary[]>('/salons', { token })
      .then(setSalons)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return salons;
    return salons.filter(
      (s) => s.business_name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)
    );
  }, [salons, query]);

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
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.heading}>Discover</Text>
          <Text style={styles.subheading}>Find a salon and redeem a friend's code</Text>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or suburb"
            placeholderTextColor={Brand.text3}
          />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Couldn't load salons.</Text>
              <Pressable onPress={load} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <ActivityIndicator color={Brand.brand} style={{ marginTop: 20 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {salons.length === 0 ? 'No salons on Ripplebox yet.' : 'No salons match your search.'}
            </Text>
          ) : (
            filtered.map((s) => (
              <View key={s.id}>
                <Pressable
                  onPress={() => setSelectedSalonId(selectedSalonId === s.id ? null : s.id)}
                  style={[styles.salonRow, selectedSalonId === s.id && styles.salonRowSelected]}>
                  {s.logo_url ? (
                    <Image source={{ uri: s.logo_url }} style={styles.salonLogo} />
                  ) : (
                    <View style={styles.salonLogoPlaceholder}>
                      <Text style={styles.salonLogoInitial}>{s.business_name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{s.business_name}</Text>
                    <Text style={styles.rowSub}>{s.location}</Text>
                    {s.top_reward && (
                      <View style={styles.rewardChip}>
                        <Text style={styles.rewardChipText}>🎁 {s.top_reward}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.chevron}>{selectedSalonId === s.id ? '▾' : '▸'}</Text>
                </Pressable>

                {selectedSalonId === s.id && (
                  <View style={styles.redeemBox}>
                    <Text style={styles.redeemLabel}>Redeem a code at {s.business_name}</Text>
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
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  search: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: Brand.brand,
  },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { fontSize: 12, color: Brand.text3, textAlign: 'center', marginTop: 30 },
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
  salonLogo: { width: 40, height: 40, borderRadius: 12, backgroundColor: Brand.lavender },
  salonLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Brand.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salonLogoInitial: { fontSize: 15, fontWeight: '600', color: '#fff' },
  rowTitle: { fontSize: 12.5, fontWeight: '500', color: Brand.brand },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 1 },
  rewardChip: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.amberBg,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 5,
  },
  rewardChipText: { fontSize: 10, fontWeight: '500', color: Brand.amber },
  chevron: { fontSize: 14, color: Brand.text3 },
  redeemBox: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 14,
    marginTop: -3,
    marginBottom: 7,
  },
  redeemLabel: { fontSize: 11.5, fontWeight: '500', color: Brand.brand3, marginBottom: 8 },
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
