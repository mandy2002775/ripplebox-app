import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, ApiError } from '@/lib/api';
import { NotificationsResponse, SalonDashboard, User } from '@/lib/types';
import { RowButton } from '@/components/row-button';

export function SalonHome({ user }: { user: User }) {
  const { token } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<SalonDashboard | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pickingRewardFor, setPickingRewardFor] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isEngaging, setIsEngaging] = useState(false);
  const [engageError, setEngageError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    return Promise.all([
      apiRequest<SalonDashboard>('/salons/dashboard', { token }),
      apiRequest<NotificationsResponse>('/notifications', { token }),
    ])
      .then(([d, n]) => {
        setDashboard(d);
        setUnreadCount(n.unread_count);
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleEngage(referralId: string) {
    setEngageError(null);
    setIsEngaging(true);
    try {
      await apiRequest(`/referrals/${referralId}/engage`, { method: 'PATCH', token });
      load();
    } catch (e) {
      setEngageError(
        e instanceof ApiError ? e.message : 'Could not mark this referral as engaged.'
      );
    } finally {
      setIsEngaging(false);
    }
  }

  async function handleComplete(referralId: string, rewardId: string) {
    setCompleteError(null);
    setIsCompleting(true);
    try {
      await apiRequest(`/referrals/${referralId}/complete`, {
        method: 'PATCH',
        token,
        body: { reward_id: rewardId },
      });
      setPickingRewardFor(null);
      load();
    } catch (e) {
      setCompleteError(e instanceof ApiError ? e.message : 'Could not complete this referral.');
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerIdentity}>
          {user.salon?.logo_url ? (
            <Image source={{ uri: user.salon.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Feather name="scissors" size={16} color={Brand.accent} />
            </View>
          )}
          <View>
            <Text style={styles.eyebrow}>Business dashboard</Text>
            <Text style={styles.name}>{user.salon?.business_name}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
            <Feather name="bell" size={16} color={Brand.brand} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push('/profile')} style={styles.iconButton}>
            <Feather name="settings" size={16} color={Brand.brand} />
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
        <ActivityIndicator color={Brand.accent} style={{ marginTop: 20 }} />
      ) : (
        <>
          <View style={styles.statGrid}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{dashboard.referrals_count}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{dashboard.converted_count}</Text>
              <Text style={styles.statLabel}>Converted</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Recent referrals</Text>
          {engageError && <Text style={styles.error}>{engageError}</Text>}
          {dashboard.recent_referrals.length === 0 ? (
            <Text style={styles.emptyText}>No referrals yet.</Text>
          ) : (
            dashboard.recent_referrals.map((r) => (
              <View key={r.id}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {r.referrer_name} referred {r.referred_name}
                    </Text>
                  </View>
                  {r.status === 'redeemed' ? (
                    <StatusBadge status={r.status} />
                  ) : (
                    <View style={styles.actionRow}>
                      {r.status === 'engaged' && <StatusBadge status={r.status} />}
                      {r.status === 'pending' && (
                        <Pressable
                          disabled={isEngaging}
                          onPress={() => handleEngage(r.id)}
                          style={styles.engageLink}>
                          <Text style={styles.engageLinkText}>Mark engaged</Text>
                        </Pressable>
                      )}
                      {dashboard.active_rewards.length > 0 && (
                        <Pressable
                          onPress={() =>
                            setPickingRewardFor(pickingRewardFor === r.id ? null : r.id)
                          }
                          style={styles.completeLink}>
                          <Text style={styles.completeLinkText}>Complete</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                {pickingRewardFor === r.id && (
                  <View style={styles.rewardPicker}>
                    <Text style={styles.rewardPickerLabel}>Pay out which reward?</Text>
                    {dashboard.active_rewards.map((reward) => (
                      <Pressable
                        key={reward.id}
                        disabled={isCompleting}
                        onPress={() => handleComplete(r.id, reward.id)}
                        style={({ pressed }) => [
                          styles.rewardOption,
                          (pressed || isCompleting) && styles.pressed,
                        ]}>
                        <Text style={styles.rewardOptionText}>{reward.description}</Text>
                      </Pressable>
                    ))}
                    {completeError && <Text style={styles.error}>{completeError}</Text>}
                  </View>
                )}
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>Active rewards</Text>
          {dashboard.active_rewards.length === 0 ? (
            <Text style={styles.emptyText}>No active rewards yet.</Text>
          ) : (
            dashboard.active_rewards.map((reward) => (
              <View key={reward.id} style={styles.row}>
                <View style={styles.rewardIconWrap}>
                  <Feather name="gift" size={15} color={Brand.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{reward.description}</Text>
                  <Text style={styles.rowSub}>{reward.redemptions_count ?? 0} redeemed</Text>
                </View>
              </View>
            ))
          )}

          <RowButton label="+ Add reward" onPress={() => router.push('/rewards')} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    color: Brand.text3,
    fontFamily: Type.bodyMedium,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  name: {
    fontSize: 21,
    color: Brand.brand,
    fontFamily: Type.displayBold,
    letterSpacing: -0.2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
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
  statGrid: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statNumber: {
    fontSize: 23,
    color: Brand.brand,
    fontFamily: Type.displayBold,
  },
  statLabel: {
    fontSize: 10,
    color: Brand.text3,
    marginTop: 3,
    fontFamily: Type.bodyMedium,
  },
  sectionLabel: {
    fontSize: 10.5,
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
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
    gap: 11,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 13,
    marginBottom: 8,
    ...Shadow.sm,
  },
  rewardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engageLink: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  engageLinkText: {
    fontSize: 11,
    color: Brand.text2,
    fontFamily: Type.bodyMedium,
  },
  completeLink: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  completeLinkText: {
    fontSize: 11,
    color: Brand.brand3,
    fontFamily: Type.bodyMedium,
  },
  rewardPicker: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 13,
    marginTop: -3,
    marginBottom: 8,
    ...Shadow.sm,
  },
  rewardPickerLabel: {
    fontSize: 10.5,
    color: Brand.text3,
    marginBottom: 8,
    fontFamily: Type.bodyMedium,
  },
  rewardOption: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.sm,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 6,
  },
  rewardOptionText: {
    fontSize: 13,
    color: Brand.brand,
    fontFamily: Type.bodySemiBold,
  },
  pressed: {
    opacity: 0.8,
  },
  error: {
    fontSize: 11.5,
    color: Brand.red,
    marginTop: 2,
    fontFamily: Type.body,
  },
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
