import { Redirect } from 'expo-router';

import { ClientHome } from '@/components/client-home';
import { SalonHome } from '@/components/salon-home';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.user_type === 'salon' && !user.salon) {
    return <Redirect href="/salon-profile-setup" />;
  }

  if (user.user_type === 'salon' && user.salon && !user.salon.subscription) {
    return <Redirect href="/subscription-setup" />;
  }

  if (user.user_type === 'salon' && user.salon) {
    return <SalonHome user={user} />;
  }

  return <ClientHome user={user} />;
}
