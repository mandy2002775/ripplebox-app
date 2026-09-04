import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHero } from '@/components/screen-hero';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, apiUploadRequest, ApiError } from '@/lib/api';
import { ContentPost } from '@/lib/types';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80';

export default function ContentScreen() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    apiRequest<ContentPost[]>('/content', { token })
      .then(setPosts)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => load(), [load]));

  async function handlePick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to post content.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPickedUri(result.assets[0].uri);
      setUploadError(null);
    }
  }

  async function handleUpload() {
    if (!pickedUri) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      const filename = pickedUri.split('/').pop() ?? 'photo.jpg';
      const extMatch = /\.(\w+)$/.exec(filename);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      // React Native's fetch accepts this { uri, name, type } shape for a
      // FormData file field — it isn't a real Blob/File like on web.
      form.append('image', { uri: pickedUri, name: filename, type: mimeType } as unknown as Blob);
      if (caption.trim()) form.append('caption', caption.trim());

      await apiUploadRequest('/content', form, token);
      setPickedUri(null);
      setCaption('');
      load();
    } catch (e) {
      setUploadError(e instanceof ApiError ? e.message : 'Could not upload this photo.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(post: ContentPost) {
    setDeletingId(post.id);
    try {
      await apiRequest(`/content/${post.id}`, { method: 'DELETE', token });
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      Alert.alert('Could not delete', 'Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHero image={HERO_IMAGE} height={100} />
        <View style={styles.header}>
          <Text style={styles.heading}>Content</Text>
          <Text style={styles.subheading}>Share photos of your work with Ripplebox clients</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.uploadCard}>
            {pickedUri ? (
              <>
                <Image source={{ uri: pickedUri }} style={styles.preview} />
                <TextInput
                  style={styles.input}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a caption (optional)"
                  placeholderTextColor={Brand.text3}
                  maxLength={255}
                />
                {uploadError && <Text style={styles.error}>{uploadError}</Text>}
                <View style={styles.uploadActions}>
                  <Pressable
                    disabled={isUploading}
                    onPress={() => setPickedUri(null)}
                    style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable disabled={isUploading} onPress={handleUpload} style={styles.postButtonWrap}>
                    <LinearGradient
                      colors={[Brand.roseVivid, Brand.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.postButton, isUploading && styles.buttonDisabled]}>
                      <Text style={styles.postButtonText}>{isUploading ? 'Posting…' : 'Post'}</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable onPress={handlePick} style={styles.pickButton}>
                <View style={styles.pickIconWrap}>
                  <Feather name="camera" size={20} color={Brand.accent} />
                </View>
                <Text style={styles.pickButtonText}>Choose a photo to post</Text>
              </Pressable>
            )}
          </View>

          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Couldn't load your content.</Text>
              <Pressable onPress={load} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <ActivityIndicator color={Brand.accent} style={{ marginTop: 20 }} />
          ) : posts.length === 0 ? (
            <Text style={styles.emptyText}>No posts yet — share your first photo above.</Text>
          ) : (
            <View style={styles.grid}>
              {posts.map((post) => (
                <View key={post.id} style={styles.gridItem}>
                  <Image
                    source={{ uri: post.image_url, headers: { Authorization: `Bearer ${token}` } }}
                    style={styles.gridImage}
                  />
                  <View style={styles.gridOverlay}>
                    <View style={styles.likesRow}>
                      <Feather name="heart" size={11} color={Brand.roseVivid} />
                      <Text style={styles.likesText}>{post.likes_count}</Text>
                    </View>
                    <Pressable
                      disabled={deletingId === post.id}
                      onPress={() =>
                        Alert.alert('Delete post?', 'This removes it for good.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(post) },
                        ])
                      }
                      style={styles.deleteButton}>
                      <Feather name="trash-2" size={13} color={Brand.text3} />
                    </Pressable>
                  </View>
                  {post.caption && (
                    <Text style={styles.caption} numberOfLines={2}>
                      {post.caption}
                    </Text>
                  )}
                </View>
              ))}
            </View>
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
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  uploadCard: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    padding: 15,
    marginBottom: 18,
    ...Shadow.sm,
  },
  pickButton: {
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: 30,
    alignItems: 'center',
  },
  pickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pickButtonText: { fontSize: 12.5, color: Brand.text2, fontFamily: Type.bodyMedium },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.sm, backgroundColor: Brand.lavender },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: Brand.brand,
    marginTop: 10,
    fontFamily: Type.bodyMedium,
  },
  error: { fontSize: 12, color: Brand.red, marginTop: 8, fontFamily: Type.body },
  uploadActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 12.5, color: Brand.text2, fontFamily: Type.bodyMedium },
  postButtonWrap: { flex: 1 },
  postButton: {
    borderRadius: Radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
    ...Shadow.sm,
    shadowColor: Brand.accent,
  },
  buttonDisabled: { opacity: 0.6 },
  postButtonText: { fontSize: 12.5, color: '#fff', fontFamily: Type.bodySemiBold },
  emptyText: { fontSize: 12, color: Brand.text3, textAlign: 'center', marginTop: 30, fontFamily: Type.body },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
    backgroundColor: Brand.lavender,
  },
  gridOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  likesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likesText: { fontSize: 11.5, color: Brand.text2, fontFamily: Type.bodyMedium },
  deleteButton: { padding: 4 },
  caption: { fontSize: 11, color: Brand.text2, marginTop: 2, fontFamily: Type.body },
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
