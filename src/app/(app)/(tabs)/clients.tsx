import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import { SalonClientSummary } from '@/lib/types';

export default function ClientsScreen() {
  const { token } = useAuth();
  const [clients, setClients] = useState<SalonClientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    apiRequest<SalonClientSummary[]>('/salons/clients', { token })
      .then(setClients)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  const customerCount = clients.filter((c) => c.is_customer).length;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.heading}>Clients</Text>
          <Text style={styles.subheading}>Everyone who's referred or been referred to you</Text>
        </View>

        {!isLoading && !loadError && clients.length > 0 && (
          <View style={styles.statGrid}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{clients.length}</Text>
              <Text style={styles.statLabel}>Total clients</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{customerCount}</Text>
              <Text style={styles.statLabel}>Converted</Text>
            </View>
          </View>
        )}

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name"
            placeholderTextColor={Brand.text3}
          />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Couldn't load your clients.</Text>
              <Pressable onPress={load} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <ActivityIndicator color={Brand.brand} style={{ marginTop: 20 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {clients.length === 0
                ? 'No clients yet — they show up here once a referral comes in.'
                : 'No clients match your search.'}
            </Text>
          ) : (
            filtered.map((c) => (
              <View key={c.id} style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>{c.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{c.name}</Text>
                  <Text style={styles.rowSub}>
                    {c.referrals_made} referral{c.referrals_made === 1 ? '' : 's'} made •{' '}
                    {new Date(c.last_activity).toLocaleDateString()}
                  </Text>
                </View>
                {c.is_customer && (
                  <View style={styles.customerBadge}>
                    <Text style={styles.customerBadgeText}>Customer</Text>
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
  statGrid: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 15, fontWeight: '600', color: Brand.brand3 },
  rowTitle: { fontSize: 12.5, fontWeight: '500', color: Brand.brand },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 1 },
  customerBadge: {
    backgroundColor: Brand.greenBg,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  customerBadgeText: { fontSize: 10, fontWeight: '500', color: Brand.green },
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
