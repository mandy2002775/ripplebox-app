import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="salon-profile-setup" />
      <Stack.Screen name="subscription-setup" />
      <Stack.Screen name="rewards" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
