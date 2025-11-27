import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import { BannerProvider } from '@/contexts/banner-context';
import { BeneficiaryProvider } from '@/contexts/beneficiary-context';
import { DashboardProvider } from '@/contexts/dashboard-context';
import { PaymentProvider } from '@/contexts/payment-context';
import { ServicesProvider } from '@/contexts/services-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { ToastProvider } from '@/contexts/toast-context';
import { TransactionsProvider } from '@/contexts/transactions-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
    <DashboardProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BannerProvider>
              <ServicesProvider>
                <PaymentProvider>
                  <TransactionsProvider>
                    <BeneficiaryProvider>
                      <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="splash" />
                          <Stack.Screen name="(onboarding)/index" />
                          <Stack.Screen name="(auth)/login" />
                          <Stack.Screen name="(auth)/signup" />
                          <Stack.Screen name="(auth)/forgot-password" />
                          <Stack.Screen name="index" />
                          <Stack.Screen name="(tabs)" />
                        </Stack>
                        <StatusBar style="auto" />
                      </NavigationThemeProvider>
                    </BeneficiaryProvider>
                  </TransactionsProvider>
                </PaymentProvider>
              </ServicesProvider>
            </BannerProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </DashboardProvider>
  );
}
