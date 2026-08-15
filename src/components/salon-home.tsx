import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { Brand } from '@/constants/theme';
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
  const [pickingRewardFor, setPickingRewardFor] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isEngaging, setIsEngaging] = useState(false);
  const [engageError, setEngageError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    return Promise.all([
      apiRequest<SalonDashboard>('/salons/dashboard', { token }),
      apiRequest<NotificationsResponse>('/notifications', { token }),
    ])
      .then(([d, n]) => {
        setDashboard(d);
        setUnreadCount(n.unread_count);
      })
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
          {user.salon?.logo_url && (
            <Image source={{ uri: user.salon.logo_url }} style={styles.logo} />
          )}
          <View>
            <Text style={styles.eyebrow}>Business dashboard</Text>
            <Text style={styles.name}>{user.salon?.business_name}</Text>
          </View>
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
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '500',
    color: Brand.brand,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Brand.lavender,
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
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '500',
    color: Brand.brand,
  },
  statLabel: {
    fontSize: 10,
    color: Brand.text3,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: Brand.text3,
  },
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
  rowTitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: Brand.brand,
  },
  rowSub: {
    fontSize: 11,
    color: Brand.text2,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engageLink: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  engageLinkText: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.text2,
  },
  completeLink: {
    backgroundColor: Brand.lavender,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  completeLinkText: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.brand3,
  },
  rewardPicker: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 12,
    marginTop: -3,
    marginBottom: 7,
  },
  rewardPickerLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: Brand.text3,
    marginBottom: 8,
  },
  rewardOption: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  rewardOptionText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: Brand.brand,
  },
  pressed: {
    opacity: 0.75,
  },
  error: {
    fontSize: 11.5,
    color: Brand.red,
    marginTop: 2,
  },
});
