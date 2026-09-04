import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Radius, Shadow, Type } from '@/constants/theme';
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
          <Feather name="search" size={15} color={Brand.text3} style={styles.searchIcon} />
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
            <ActivityIndicator color={Brand.accent} style={{ marginTop: 20 }} />
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
                    <Feather name="check-circle" size={10} color={Brand.green} />
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
  header: { paddingHorizontal: 20, paddingTop: 14, marginBottom: 14 },
  heading: { fontSize: 19, color: Brand.brand, fontFamily: Type.displayBold, letterSpacing: -0.2 },
  subheading: { fontSize: 11.5, color: Brand.text2, marginTop: 2, fontFamily: Type.body },
  statGrid: { flexDirection: 'row', gap: 9, paddingHorizontal: 20, marginBottom: 14 },
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
  searchWrap: { paddingHorizontal: 20, marginBottom: 14, justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 33, zIndex: 1 },
  search: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.sm,
    paddingLeft: 38,
    paddingRight: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: Brand.brand,
    fontFamily: Type.bodyMedium,
    ...Shadow.sm,
  },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { fontSize: 12, color: Brand.text3, textAlign: 'center', marginTop: 30, fontFamily: Type.body },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 13,
    marginBottom: 8,
    ...Shadow.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 15, color: Brand.brand3, fontFamily: Type.bodyBold },
  rowTitle: { fontSize: 13, color: Brand.brand, fontFamily: Type.bodySemiBold },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 1, fontFamily: Type.body },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.greenBg,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
  },
  customerBadgeText: { fontSize: 10, color: Brand.green, fontFamily: Type.bodySemiBold },
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
