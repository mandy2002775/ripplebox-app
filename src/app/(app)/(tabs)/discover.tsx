import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, ApiError } from '@/lib/api';
import { SALON_CATEGORIES, salonCategoryLabel } from '@/lib/salon-categories';
import { SalonCategory, SalonContentPost, SalonSummary } from '@/lib/types';

export default function DiscoverScreen() {
  const { token } = useAuth();
  const [salons, setSalons] = useState<SalonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SalonCategory | null>(null);

  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [content, setContent] = useState<SalonContentPost[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    apiRequest<SalonSummary[]>('/salons', { token })
      .then(setSalons)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  useEffect(() => {
    if (!selectedSalonId) {
      setContent([]);
      return;
    }
    setIsLoadingContent(true);
    apiRequest<SalonContentPost[]>(`/salons/${selectedSalonId}/content`, { token })
      .then(setContent)
      .catch(() => setContent([]))
      .finally(() => setIsLoadingContent(false));
  }, [selectedSalonId, token]);

  async function toggleLike(post: SalonContentPost) {
    setContent((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.likes_count + (p.liked_by_me ? -1 : 1) }
          : p
      )
    );
    try {
      await apiRequest<{ liked: boolean; likes_count: number }>(`/content/${post.id}/like`, {
        method: 'POST',
        token,
      });
    } catch {
      // Roll back on failure — the request already reflects the pre-tap state.
      setContent((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, liked_by_me: post.liked_by_me, likes_count: post.likes_count }
            : p
        )
      );
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return salons.filter((s) => {
      const matchesQuery =
        !q || s.business_name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
      const matchesCategory = !category || s.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [salons, query, category]);

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
          <Feather name="search" size={15} color={Brand.text3} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or suburb"
            placeholderTextColor={Brand.text3}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryStrip}
          contentContainerStyle={styles.categoryStripContent}>
          <Pressable
            onPress={() => setCategory(null)}
            style={[styles.categoryFilterChip, !category && styles.categoryFilterChipActive]}>
            <Text
              style={[styles.categoryFilterChipText, !category && styles.categoryFilterChipTextActive]}>
              All
            </Text>
          </Pressable>
          {SALON_CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setCategory(category === c.value ? null : c.value)}
              style={[
                styles.categoryFilterChip,
                category === c.value && styles.categoryFilterChipActive,
              ]}>
              <Feather
                name={c.icon}
                size={11}
                color={category === c.value ? '#fff' : Brand.accent}
              />
              <Text
                style={[
                  styles.categoryFilterChipText,
                  category === c.value && styles.categoryFilterChipTextActive,
                ]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.body}>
          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Couldn't load salons.</Text>
              <Pressable onPress={load} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <ActivityIndicator color={Brand.accent} style={{ marginTop: 20 }} />
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
                    <Text style={styles.rowSub}>
                      {s.location}
                      {salonCategoryLabel(s.category) ? ` • ${salonCategoryLabel(s.category)}` : ''}
                    </Text>
                    {s.top_reward && (
                      <View style={styles.rewardChip}>
                        <Feather name="gift" size={9} color={Brand.amber} />
                        <Text style={styles.rewardChipText}>{s.top_reward}</Text>
                      </View>
                    )}
                  </View>
                  <Feather
                    name={selectedSalonId === s.id ? 'chevron-down' : 'chevron-right'}
                    size={16}
                    color={Brand.text3}
                  />
                </Pressable>

                {selectedSalonId === s.id && (
                  <View style={styles.redeemBox}>
                    {isLoadingContent ? (
                      <ActivityIndicator color={Brand.accent} style={{ marginBottom: 10 }} />
                    ) : (
                      content.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.contentStrip}
                          contentContainerStyle={{ gap: 8 }}>
                          {content.map((post) => (
                            <View key={post.id} style={styles.contentItem}>
                              <Image
                                source={{ uri: post.image_url, headers: { Authorization: `Bearer ${token}` } }}
                                style={styles.contentImage}
                              />
                              <Pressable onPress={() => toggleLike(post)} style={styles.likeButton}>
                                <Feather
                                  name="heart"
                                  size={11}
                                  color={post.liked_by_me ? Brand.roseVivid : Brand.text3}
                                />
                                <Text style={styles.likeButtonText}>{post.likes_count}</Text>
                              </Pressable>
                            </View>
                          ))}
                        </ScrollView>
                      )
                    )}

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
  header: { paddingHorizontal: 20, paddingTop: 14, marginBottom: 14 },
  heading: { fontSize: 19, color: Brand.brand, fontFamily: Type.displayBold, letterSpacing: -0.2 },
  subheading: { fontSize: 11.5, color: Brand.text2, marginTop: 2, fontFamily: Type.body },
  searchWrap: { paddingHorizontal: 20, marginBottom: 14, position: 'relative', justifyContent: 'center' },
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
  categoryStrip: { marginBottom: 14 },
  categoryStripContent: { paddingHorizontal: 20, gap: 7 },
  categoryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Brand.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...Shadow.sm,
  },
  categoryFilterChipActive: {
    backgroundColor: Brand.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  categoryFilterChipText: {
    fontSize: 11.5,
    color: Brand.brand,
    fontFamily: Type.bodyMedium,
  },
  categoryFilterChipTextActive: {
    color: '#fff',
    fontFamily: Type.bodySemiBold,
  },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { fontSize: 12, color: Brand.text3, textAlign: 'center', marginTop: 30, fontFamily: Type.body },
  salonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 13,
    marginBottom: 8,
    ...Shadow.sm,
  },
  salonRowSelected: {
    backgroundColor: Brand.lavender,
    shadowOpacity: 0,
    elevation: 0,
  },
  salonLogo: { width: 42, height: 42, borderRadius: Radius.sm, backgroundColor: Brand.lavender },
  salonLogoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: Brand.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salonLogoInitial: { fontSize: 15, color: '#fff', fontFamily: Type.bodyBold },
  rowTitle: { fontSize: 13, color: Brand.brand, fontFamily: Type.bodySemiBold },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 1, fontFamily: Type.body },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Brand.amberBg,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
  },
  rewardChipText: { fontSize: 10, color: Brand.amber, fontFamily: Type.bodyMedium },
  redeemBox: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 15,
    marginTop: -3,
    marginBottom: 8,
    ...Shadow.sm,
  },
  redeemLabel: { fontSize: 12, color: Brand.brand3, marginBottom: 9, fontFamily: Type.bodySemiBold },
  contentStrip: { marginBottom: 12 },
  contentItem: { width: 100 },
  contentImage: {
    width: 100,
    height: 100,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
  },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  likeButtonText: { fontSize: 11, color: Brand.text2, fontFamily: Type.bodyMedium },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.brand,
    marginBottom: 10,
    fontFamily: Type.bodyMedium,
  },
  error: { fontSize: 12, color: Brand.red, marginBottom: 8, fontFamily: Type.body },
  success: { fontSize: 12, color: Brand.green, marginBottom: 8, fontFamily: Type.body },
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
