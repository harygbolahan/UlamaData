import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ActivityTracker } from '@/components/activity-tracker';
import { AuthProvider } from '@/contexts/auth-context';
import { AutoLockProvider } from '@/contexts/auto-lock-context';
import { BannerProvider } from '@/contexts/banner-context';
import { BeneficiaryProvider } from '@/contexts/beneficiary-context';
import { DashboardProvider } from '@/contexts/dashboard-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { PaymentProvider } from '@/contexts/payment-context';
import { ServicesProvider } from '@/contexts/services-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { ToastProvider } from '@/contexts/toast-context';
import { TransactionsProvider } from '@/contexts/transactions-context';
import AsyncStorage from '@react-native-async-storage/async-storage';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();

        // Check if onboarding has been completed
        if (segments.length === 0) {
          const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

          if (hasSeenOnboarding === 'true') {
            // User has seen onboarding, go to splash
            router.replace('/splash');
          } else {
            // First time user, show onboarding
            router.replace('/(onboarding)');
          }
        }

        setIsReady(true);
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded || !isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <DashboardProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>
                <AutoLockProvider>
                  <ActivityTracker>
                    <BannerProvider>
                      <ServicesProvider>
                        <PaymentProvider>
                          <TransactionsProvider>
                            <BeneficiaryProvider>
                              <AppContent />
                            </BeneficiaryProvider>
                          </TransactionsProvider>
                        </PaymentProvider>
                      </ServicesProvider>
                    </BannerProvider>
                  </ActivityTracker>
                </AutoLockProvider>
              </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </DashboardProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { colorScheme } = useTheme();
  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1 }
      }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="(onboarding)/index" />
        <Stack.Screen name="(onboarding)/auth-selector" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
