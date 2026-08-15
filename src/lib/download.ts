import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Saves a downloaded file so the user can actually get to it — a browser
 * download on web, the native share sheet (save/AirDrop/email/etc.) on
 * iOS/Android, since there's no user-facing "Downloads" folder there.
 */
export async function saveBlob(blob: Blob, filename: string, mimeType: string): Promise<void> {
  if (Platform.OS === 'web') {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType });
  }
}
