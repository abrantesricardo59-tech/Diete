import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function CoachTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: '#2E7D6B' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mes coachés',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="coache/[id]" options={{ href: null, title: 'Coaché·e' }} />
    </Tabs>
  );
}
