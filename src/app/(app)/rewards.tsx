import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { RecipientType, Reward, RewardType } from '@/lib/types';

type Tab = 'create' | 'active' | 'expired';

const REWARD_TYPES: { value: RewardType; label: string }[] = [
  { value: 'gift_card', label: 'Gift card' },
  { value: 'free_service', label: 'Free service' },
  { value: 'product', label: 'Product' },
  { value: 'vip_perk', label: 'VIP perk' },
];

const RECIPIENTS: { value: RecipientType; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'referrer', label: 'Referrer' },
  { value: 'new_client', label: 'New client' },
];

export default function RewardsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('create');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [rewardType, setRewardType] = useState<RewardType>('gift_card');
  const [rewardValue, setRewardValue] = useState('100');
  const [description, setDescription] = useState('$100 gift card for you and your friend');
  const [recipientType, setRecipientType] = useState<RecipientType>('both');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    apiRequest<Reward[]>('/rewards', { token })
      .then(setRewards)
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await apiRequest<Reward>('/rewards', {
        method: 'POST',
        token,
        body: {
          reward_type: rewardType,
          reward_value: Number(rewardValue),
          description,
          recipient_type: recipientType,
          expiry_date: expiryDate,
        },
      });
      load();
      setTab('active');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save this reward.');
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePause(reward: Reward) {
    await apiRequest<Reward>(`/rewards/${reward.id}`, {
      method: 'PATCH',
      token,
      body: { is_active: !reward.is_active },
    });
    load();
  }

  const active = rewards.filter((r) => r.is_active);
  const expired = rewards.filter((r) => !r.is_active);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'‹'}</Text>
          </Pressable>
          <View>
            <Text style={styles.heading}>Rewards</Text>
            <Text style={styles.subheading}>Create and manage your referral rewards</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {(
            [
              ['create', 'Create new'],
              ['active', `Active (${active.length})`],
              ['expired', 'Expired'],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setTab(value)}
              style={[styles.tab, tab === value && styles.tabActive]}>
              <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {tab === 'create' && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Reward type</Text>
              <View style={styles.typeGrid}>
                {REWARD_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setRewardType(t.value)}
                    style={[styles.typeCard, rewardType === t.value && styles.typeCardActive]}>
                    <Text
                      style={[
                        styles.typeCardText,
                        rewardType === t.value && styles.typeCardTextActive,
                      ]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Reward value ($)</Text>
              <TextInput
                style={styles.input}
                value={rewardValue}
                onChangeText={setRewardValue}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={styles.input} value={description} onChangeText={setDescription} />

              <Text style={styles.fieldLabel}>Who receives it?</Text>
              <View style={styles.whoRow}>
                {RECIPIENTS.map((r) => (
                  <Pressable
                    key={r.value}
                    onPress={() => setRecipientType(r.value)}
                    style={[styles.whoChip, recipientType === r.value && styles.whoChipActive]}>
                    <Text
                      style={[
                        styles.whoChipText,
                        recipientType === r.value && styles.whoChipTextActive,
                      ]}>
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Expiry date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={expiryDate} onChangeText={setExpiryDate} />

              {error && <Text style={styles.error}>{error}</Text>}

              <RowButton
                label={isSaving ? 'Saving…' : 'Save and activate reward'}
                onPress={handleSave}
                disabled={isSaving}
              />
            </View>
          )}

          {tab !== 'create' && isLoading && <ActivityIndicator color={Brand.brand} />}

          {tab === 'active' &&
            !isLoading &&
            (active.length === 0 ? (
              <Text style={styles.emptyText}>No active rewards yet.</Text>
            ) : (
              active.map((r) => (
                <View key={r.id} style={styles.rewardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{r.description}</Text>
                    <Text style={styles.rowSub}>
                      ${r.reward_value} &bull; {r.recipient_type.replace('_', ' ')}
                    </Text>
                  </View>
                  <Pressable onPress={() => togglePause(r)} style={styles.pauseButton}>
                    <Text style={styles.pauseButtonText}>Pause</Text>
                  </Pressable>
                </View>
              ))
            ))}

          {tab === 'expired' &&
            !isLoading &&
            (expired.length === 0 ? (
              <Text style={styles.emptyText}>No paused or expired rewards.</Text>
            ) : (
              expired.map((r) => (
                <View key={r.id} style={styles.rewardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{r.description}</Text>
                    <Text style={styles.rowSub}>${r.reward_value} &bull; Paused</Text>
                  </View>
                  <Pressable onPress={() => togglePause(r)} style={styles.pauseButton}>
                    <Text style={styles.pauseButtonText}>Resume</Text>
                  </Pressable>
                </View>
              ))
            ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 14,
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 18, color: Brand.brand, marginTop: -2 },
  heading: { fontSize: 16, fontWeight: '500', color: Brand.brand },
  subheading: { fontSize: 11, color: Brand.text2 },
  tabRow: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    textAlign: 'center',
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
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.accent,
    marginBottom: 6,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  typeCard: {
    width: '48%',
    borderWidth: 0.5,
    borderColor: Brand.border,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeCardActive: { borderWidth: 1.5, borderColor: Brand.brand, backgroundColor: Brand.lavender },
  typeCardText: { fontSize: 11, color: Brand.text3 },
  typeCardTextActive: { color: Brand.brand3, fontWeight: '500' },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.brand,
    marginBottom: 12,
  },
  whoRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  whoChip: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: Brand.border,
    backgroundColor: '#fff',
    borderRadius: 9,
    paddingVertical: 7,
    alignItems: 'center',
  },
  whoChipActive: { borderWidth: 1.5, borderColor: Brand.brand, backgroundColor: Brand.lavender },
  whoChipText: { fontSize: 11, color: Brand.text2 },
  whoChipTextActive: { color: Brand.brand3, fontWeight: '500' },
  error: { fontSize: 12, color: Brand.red, marginBottom: 6 },
  emptyText: { fontSize: 12, color: Brand.text3, textAlign: 'center', marginTop: 30 },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  rowTitle: { fontSize: 12.5, fontWeight: '500', color: Brand.brand },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 2 },
  pauseButton: {
    backgroundColor: Brand.lavender,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  pauseButtonText: { fontSize: 11, fontWeight: '500', color: Brand.brand3 },
});
