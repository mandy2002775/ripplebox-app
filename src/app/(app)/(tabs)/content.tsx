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

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, apiUploadRequest, ApiError } from '@/lib/api';
import { ContentPost } from '@/lib/types';

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
                  <Pressable
                    disabled={isUploading}
                    onPress={handleUpload}
                    style={[styles.postButton, isUploading && styles.buttonDisabled]}>
                    <Text style={styles.postButtonText}>{isUploading ? 'Posting…' : 'Post'}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable onPress={handlePick} style={styles.pickButton}>
                <Text style={styles.pickButtonIcon}>📷</Text>
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
            <ActivityIndicator color={Brand.brand} style={{ marginTop: 20 }} />
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
                    <Text style={styles.likesText}>❤️ {post.likes_count}</Text>
                    <Pressable
                      disabled={deletingId === post.id}
                      onPress={() =>
                        Alert.alert('Delete post?', 'This removes it for good.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(post) },
                        ])
                      }
                      style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>
                        {deletingId === post.id ? '…' : '🗑'}
                      </Text>
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
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 12 },
  heading: { fontSize: 16, fontWeight: '500', color: Brand.brand },
  subheading: { fontSize: 11, color: Brand.text2 },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  uploadCard: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  pickButton: {
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
  },
  pickButtonIcon: { fontSize: 26, marginBottom: 6 },
  pickButtonText: { fontSize: 12.5, color: Brand.text2, fontWeight: '500' },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: Brand.lavender },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: Brand.brand,
    marginTop: 10,
  },
  error: { fontSize: 12, color: Brand.red, marginTop: 8 },
  uploadActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 12.5, fontWeight: '500', color: Brand.text2 },
  postButton: {
    flex: 1,
    backgroundColor: Brand.brand,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  postButtonText: { fontSize: 12.5, fontWeight: '500', color: '#fff' },
  emptyText: { fontSize: 12, color: Brand.text3, textAlign: 'center', marginTop: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47%' },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: Brand.lavender,
  },
  gridOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  likesText: { fontSize: 11.5, color: Brand.text2 },
  deleteButton: { padding: 4 },
  deleteButtonText: { fontSize: 13 },
  caption: { fontSize: 11, color: Brand.text2, marginTop: 2 },
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
