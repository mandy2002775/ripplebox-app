import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { Brand, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

function TabIcon({ name, color }: { name: keyof typeof Feather.glyphMap; color: ColorValue }) {
  return <Feather name={name} size={20} color={color} />;
}

export default function TabsLayout() {
  const { user } = useAuth();
  const isSalon = user?.user_type === 'salon';
  const isClient = user?.user_type === 'client';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.accent,
        tabBarInactiveTintColor: Brand.text3,
        tabBarStyle: {
          backgroundColor: Brand.surface,
          borderTopWidth: 0,
          shadowColor: '#2A1150',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
          paddingTop: 8,
          paddingBottom: 10,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 9.5, fontFamily: Type.bodySemiBold },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isSalon ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color }) => <TabIcon name={isSalon ? 'bar-chart-2' : 'home'} color={color} />,
        }}
      />

      <Tabs.Protected guard={isSalon}>
        <Tabs.Screen
          name="clients"
          options={{
            title: 'Clients',
            tabBarIcon: ({ color }) => <TabIcon name="users" color={color} />,
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ color }) => <TabIcon name="gift" color={color} />,
          }}
        />
        <Tabs.Screen
          name="content"
          options={{
            title: 'Content',
            tabBarIcon: ({ color }) => <TabIcon name="image" color={color} />,
          }}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={isClient}>
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <TabIcon name="search" color={color} />,
          }}
        />
        <Tabs.Screen
          name="refer"
          options={{
            title: 'Refer',
            tabBarIcon: ({ color }) => <TabIcon name="send" color={color} />,
          }}
        />
        <Tabs.Screen
          name="client-rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ color }) => <TabIcon name="gift" color={color} />,
          }}
        />
      </Tabs.Protected>

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
