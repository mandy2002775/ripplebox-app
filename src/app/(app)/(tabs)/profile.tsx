import { useState } from 'react';
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
import { apiBlobRequest, apiRequest, ApiError } from '@/lib/api';
import { saveBlob } from '@/lib/download';
import { PlanType, Salon } from '@/lib/types';

const PLAN_LABELS: Record<PlanType, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

export default function ProfileScreen() {
  const { user, token, signOut, refreshUser } = useAuth();

  if (!user) return null;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Profile</Text>

          {user.user_type === 'salon' && user.salon ? (
            <SalonProfile salon={user.salon} token={token} refreshUser={refreshUser} />
          ) : (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.readValue}>{user.name}</Text>
              <Text style={styles.fieldLabel}>Phone number</Text>
              <Text style={styles.readValue}>{user.phone_number}</Text>
              {user.client && (
                <>
                  <Text style={styles.fieldLabel}>Referral code</Text>
                  <Text style={styles.readValue}>{user.client.referral_code}</Text>
                </>
              )}
            </View>
          )}

          <PrivacySection token={token} />

          <RowButton label="Sign out" variant="ghost" onPress={() => signOut()} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PrivacySection({ token }: { token: string | null }) {
  const { deleteAccount } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setIsExporting(true);
    try {
      const blob = await apiBlobRequest('/me/export', token);
      await saveBlob(blob, 'ripplebox-my-data.json', 'application/json');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not export your data.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete your account.');
      setIsDeleting(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.fieldLabel}>Privacy</Text>

      <Pressable
        disabled={isExporting}
        onPress={handleExport}
        style={({ pressed }) => [styles.privacyRow, (pressed || isExporting) && styles.pressed]}>
        <Text style={styles.privacyRowText}>
          {isExporting ? 'Preparing your data…' : 'Download my data'}
        </Text>
      </Pressable>

      {!isConfirmingDelete ? (
        <Pressable onPress={() => setIsConfirmingDelete(true)} style={styles.privacyRow}>
          <Text style={[styles.privacyRowText, styles.dangerText]}>Delete my account</Text>
        </Pressable>
      ) : (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            This permanently deletes your account and all of your data. This can't be undone.
          </Text>
          <Pressable
            disabled={isDeleting}
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.confirmButton,
              (pressed || isDeleting) && styles.pressed,
            ]}>
            <Text style={[styles.confirmButtonText, styles.dangerText]}>
              {isDeleting ? 'Deleting…' : 'Yes, delete my account'}
            </Text>
          </Pressable>
          <Pressable onPress={() => setIsConfirmingDelete(false)} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function SalonProfile({
  salon,
  token,
  refreshUser,
}: {
  salon: Salon;
  token: string | null;
  refreshUser: () => Promise<void>;
}) {
  const [businessName, setBusinessName] = useState(salon.business_name);
  const [location, setLocation] = useState(salon.location);
  const [website, setWebsite] = useState(salon.website ?? '');
  const [instagramHandle, setInstagramHandle] = useState(salon.instagram_handle ?? '');
  const [logoUrl, setLogoUrl] = useState(salon.logo_url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleSave() {
    setSaveError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await apiRequest<Salon>('/salons', {
        method: 'PATCH',
        token,
        body: {
          business_name: businessName.trim(),
          location: location.trim(),
          website: website.trim() || null,
          instagram_handle: instagramHandle.trim() || null,
          logo_url: logoUrl.trim() || null,
        },
      });
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelError(null);
    setIsCancelling(true);
    try {
      await apiRequest('/salons/subscription', { method: 'DELETE', token });
      setIsConfirmingCancel(false);
      await refreshUser();
    } catch (e) {
      setCancelError(e instanceof ApiError ? e.message : 'Could not cancel your subscription.');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <View style={styles.card}>
        {logoUrl.trim() && (
          <Image source={{ uri: logoUrl.trim() }} style={styles.logoPreview} />
        )}
        <Text style={styles.fieldLabel}>Business name</Text>
        <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} />
        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />
        <Text style={styles.fieldLabel}>
          Website <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>
          Instagram <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={instagramHandle}
          onChangeText={setInstagramHandle}
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>
          Logo URL <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={logoUrl}
          onChangeText={setLogoUrl}
          autoCapitalize="none"
        />

        {saveError && <Text style={styles.error}>{saveError}</Text>}
        {saved && <Text style={styles.success}>Saved.</Text>}

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={({ pressed }) => [styles.button, (pressed || isSaving) && styles.pressed]}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save changes</Text>
          )}
        </Pressable>
      </View>

      {salon.subscription && (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Subscription</Text>
          <Text style={styles.rowTitle}>{PLAN_LABELS[salon.subscription.plan_type]} plan</Text>
          <Text style={styles.rowSub}>
            {salon.subscription.status === 'cancelled'
              ? 'Cancelled'
              : `Renews ${new Date(salon.subscription.current_period_end).toLocaleDateString()}`}
          </Text>

          {salon.subscription.status !== 'cancelled' && !isConfirmingCancel && (
            <Pressable onPress={() => setIsConfirmingCancel(true)} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Cancel subscription</Text>
            </Pressable>
          )}

          {isConfirmingCancel && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                Cancel your subscription? You can still use the dashboard, but this ends billing
                renewal.
              </Text>
              <Pressable
                disabled={isCancelling}
                onPress={handleCancelSubscription}
                style={({ pressed }) => [
                  styles.confirmButton,
                  (pressed || isCancelling) && styles.pressed,
                ]}>
                <Text style={styles.confirmButtonText}>
                  {isCancelling ? 'Cancelling…' : 'Yes, cancel subscription'}
                </Text>
              </Pressable>
              {cancelError && <Text style={styles.error}>{cancelError}</Text>}
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  heading: { fontSize: 21, fontWeight: '500', color: Brand.brand, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  logoPreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Brand.lavender,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.accent,
    marginBottom: 5,
  },
  optional: {
    color: Brand.text3,
    fontWeight: '400',
  },
  readValue: {
    fontSize: 14,
    color: Brand.brand,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.brand,
    marginBottom: 12,
  },
  error: { fontSize: 12, color: Brand.red, marginBottom: 10 },
  success: { fontSize: 12, color: Brand.green, marginBottom: 10 },
  privacyRow: { paddingVertical: 10 },
  privacyRowText: { fontSize: 13, color: Brand.brand },
  dangerText: { color: Brand.red },
  button: {
    backgroundColor: Brand.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  pressed: { opacity: 0.8 },
  rowTitle: { fontSize: 13, fontWeight: '500', color: Brand.brand, marginTop: 4 },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 2 },
  cancelLink: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  cancelLinkText: { fontSize: 11, fontWeight: '500', color: Brand.text2 },
  confirmBox: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    padding: 12,
    marginTop: 10,
  },
  confirmText: { fontSize: 11, color: Brand.brand3, lineHeight: 16, marginBottom: 10 },
  confirmButton: {
    backgroundColor: '#fff',
    borderRadius: 11,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButtonText: { fontSize: 12.5, fontWeight: '500', color: Brand.brand },
});
