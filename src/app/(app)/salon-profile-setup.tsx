import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, ApiError } from '@/lib/api';
import { Salon } from '@/lib/types';

export default function SalonProfileSetupScreen() {
  const { token, refreshUser } = useAuth();
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiRequest<Salon>('/salons', {
        method: 'POST',
        token,
        body: {
          business_name: businessName.trim(),
          location: location.trim(),
          ...(instagramHandle.trim() ? { instagram_handle: instagramHandle.trim() } : {}),
          ...(website.trim() ? { website: website.trim() } : {}),
          ...(logoUrl.trim() ? { logo_url: logoUrl.trim() } : {}),
        },
      });
      // Pulls the freshly created salon back into context, then returns to
      // the home route — it decides what to render based on user.salon now
      // being present, instead of redirecting back here.
      await refreshUser();
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save your profile. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSave = businessName.trim().length > 0 && location.trim().length > 0 && !isSubmitting;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.heading}>Business profile</Text>
        <Text style={styles.subheading}>Step 1 of 2 — Your details</Text>

        <View style={styles.logoRow}>
          <View style={styles.logoPreview}>
            {logoUrl.trim() ? (
              <Image source={{ uri: logoUrl.trim() }} style={styles.logoImage} />
            ) : (
              <>
                <Text style={styles.logoPlaceholderIcon}>📷</Text>
                <Text style={styles.logoPlaceholderText}>Add logo</Text>
              </>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoTitle}>Business logo</Text>
            <Text style={styles.logoHint}>Paste a logo URL below — PNG or JPG</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Business name</Text>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Gloss Hair Studio"
          placeholderTextColor={Brand.text3}
        />

        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="42 King St, Perth WA 6000"
          placeholderTextColor={Brand.text3}
        />

        <Text style={styles.fieldLabel}>
          Website <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={website}
          onChangeText={setWebsite}
          placeholder="www.yoursalon.com.au"
          placeholderTextColor={Brand.text3}
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>
          Instagram <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={instagramHandle}
          onChangeText={setInstagramHandle}
          placeholder="@yoursalon"
          placeholderTextColor={Brand.text3}
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>
          Logo URL <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={logoUrl}
          onChangeText={setLogoUrl}
          placeholder="https://yoursalon.com.au/logo.png"
          placeholderTextColor={Brand.text3}
          autoCapitalize="none"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            No website? No problem — home-based salons can use Instagram or Facebook instead.
            Website is optional.
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          disabled={!canSave}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.button,
            (pressed || !canSave) && styles.buttonDisabled,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue to payment</Text>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heading: {
    fontSize: 21,
    fontWeight: '500',
    color: Brand.brand,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 12,
    color: Brand.text2,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoPreview: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: Brand.lavender,
    borderWidth: 1.5,
    borderColor: Brand.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 62,
    height: 62,
  },
  logoPlaceholderIcon: {
    fontSize: 20,
  },
  logoPlaceholderText: {
    fontSize: 8,
    color: Brand.text3,
    marginTop: 2,
  },
  logoTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Brand.brand,
  },
  logoHint: {
    fontSize: 11,
    color: Brand.text2,
    marginTop: 1,
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
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Brand.brand,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    padding: 11,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 11,
    color: Brand.brand3,
    lineHeight: 16,
  },
  error: {
    fontSize: 12,
    color: Brand.red,
    marginBottom: 10,
  },
  button: {
    backgroundColor: Brand.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
