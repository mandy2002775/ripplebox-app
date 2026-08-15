import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

// Prevents navigation entirely — used for tabs that are visible (matching
// the prototype's nav bar) but have no real screen behind them yet.
const disabledListeners = () => ({
  tabPress: (e: { preventDefault: () => void }) => e.preventDefault(),
});

function TabIcon({ label, color }: { label: string; color: ColorValue }) {
  return (
    <Text style={{ fontSize: 19, color, opacity: color === Brand.text3 ? 0.5 : 1 }}>{label}</Text>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const isSalon = user?.user_type === 'salon';
  const isClient = user?.user_type === 'client';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.brand,
        tabBarInactiveTintColor: Brand.text3,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: Brand.border,
          paddingTop: 7,
          paddingBottom: 9,
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isSalon ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color }) => <TabIcon label={isSalon ? '📊' : '🏠'} color={color} />,
        }}
      />

      <Tabs.Protected guard={isSalon}>
        <Tabs.Screen
          name="clients"
          options={{
            title: 'Clients',
            tabBarIcon: ({ color }) => <TabIcon label="👥" color={color} />,
          }}
          listeners={disabledListeners}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ color }) => <TabIcon label="🎁" color={color} />,
          }}
        />
        <Tabs.Screen
          name="content"
          options={{
            title: 'Content',
            tabBarIcon: ({ color }) => <TabIcon label="🖼️" color={color} />,
          }}
          listeners={disabledListeners}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={isClient}>
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <TabIcon label="🔍" color={color} />,
          }}
          listeners={disabledListeners}
        />
        <Tabs.Screen
          name="refer"
          options={{
            title: 'Refer',
            tabBarIcon: ({ color }) => <TabIcon label="📤" color={color} />,
          }}
          listeners={disabledListeners}
        />
        <Tabs.Screen
          name="client-rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ color }) => <TabIcon label="🎁" color={color} />,
          }}
          listeners={disabledListeners}
        />
      </Tabs.Protected>

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon label="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}
