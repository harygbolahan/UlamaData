import { useTheme } from "@/contexts/theme-context";
import {
  isBiometricLoginEnabled,
  isPinLoginEnabled,
} from "@/services/biometric";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      await handleNavigation();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");

      if (hasSeenOnboarding !== "true") {
        router.replace("/(onboarding)");
        return;
      }

      let storedEmail = await AsyncStorage.getItem("user_email");
      if (!storedEmail) {
        const userData = await AsyncStorage.getItem("user_data");
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.email) {
              await AsyncStorage.setItem("user_email", user.email);
              await AsyncStorage.setItem(
                "user_name",
                user.name || user.username || "",
              );
              storedEmail = user.email;
            }
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }

      // PRIORITY 1: Biometric authentication
      const biometricEnabled = await isBiometricLoginEnabled();
      if (biometricEnabled) {
        router.replace("/(auth)/biometric-auth");
        return;
      }

      // PRIORITY 2: PIN authentication
      const pinLoginEnabled = await isPinLoginEnabled();
      if (pinLoginEnabled) {
        router.replace("/(auth)/pin-auth");
        return;
      }

      // PRIORITY 3: Password authentication
      if (storedEmail) {
        router.replace("/(auth)/welcome-back");
      } else {
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      router.replace("/(auth)/login");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Animated.View
        style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { fontFamily: fonts.inter.bold }]}>
          UlamaData
        </Text>
        <Text style={[styles.subtitle, { fontFamily: fonts.inter.regular }]}>
          Affordable, Fast and Reliable.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoContainer: { marginBottom: 24 },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: { width: "150%", height: "150%", borderRadius: 40 },
  textContainer: { alignItems: "center" },
  title: { fontSize: 36, color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#fff", opacity: 0.9 },
});
