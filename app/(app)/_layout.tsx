import { Tabs } from 'expo-router';
import { Folder, Home, Library, Mic2, Settings } from 'lucide-react-native';

const ICONS = {
  home: Home,
  scripts: Folder,
  voices: Mic2,
  library: Library,
  settings: Settings,
} as const;

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0b0b12', borderTopColor: '#222236', height: 72, paddingBottom: 10, paddingTop: 8 },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#71717a',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => {
          const name = route.name as keyof typeof ICONS;
          const Icon = ICONS[name] ?? Mic2;
          return <Icon size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Studio' }} />
      <Tabs.Screen name="scripts" options={{ title: 'Scripts' }} />
      <Tabs.Screen name="voices" options={{ title: 'Voices' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      <Tabs.Screen name="editor/[id]" options={{ title: 'Editor', href: null }} />
      <Tabs.Screen name="run/[id]" options={{ title: 'Run', href: null }} />
    </Tabs>
  );
}
