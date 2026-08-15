import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="salon-profile-setup" />
      <Stack.Screen name="subscription-setup" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}
