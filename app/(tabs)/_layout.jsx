import { Fonts } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabsLayout() {
    const { colors } = useTheme();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.icon,
                    tabBarShowLabel: true,
                    tabBarStyle: {
                        backgroundColor: colors.background,
                        borderTopWidth: 1,
                        borderTopColor: colors.isDark ? '#2a2a2a' : '#e5e5e5',
                        paddingBottom: 10,
                        paddingTop: 10,
                        height: 65,
                        elevation: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontFamily: Fonts.inter.semiBold,
                        marginTop: 2,
                    },
                    tabBarItemStyle: {
                        paddingVertical: 4,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="services"
                    options={{
                        title: 'Services',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="transactions"
                    options={{
                        title: 'History',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="earn"
                    options={{
                        title: 'Earn',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'gift' : 'gift-outline'} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="cards"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}
