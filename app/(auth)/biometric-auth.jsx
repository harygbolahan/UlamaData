import { useAuth } from "@/contexts/auth-context";
import { useAutoLock } from "@/contexts/auto-lock-context";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { authenticateForLogin } from "@/services/biometric";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BiometricAuthScreen() {
  const { colors, fonts } = useTheme();
  const { login } = useAuth();
  const { unlock } = useAutoLock();
  const { showToast } = useToast();
  const router = useRouter();
  const [authenticating, setAuthenticating] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();

    Animated.parallel([
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

    // Auto-trigger biometric after animation
    setTimeout(() => {
      handleBiometricAuth();
    }, 800);
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("user_email");
      const name = await AsyncStorage.getItem("user_name");

      if (email) {
        setUserEmail(email);
        setUserName(name || email.split("@")[0]);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleBiometricAuth = async () => {
    setAuthenticating(true);

    try {
      const result = await authenticateForLogin();

      if (result.success && result.email && result.password) {
        // Authenticate with stored credentials
        const loginResult = await login(
          {
            email: result.email,
            password: result.password,
          },
          true,
        ); // Skip toast

        if (loginResult.success) {
          unlock(); // Unlock the app
          router.replace("/(tabs)/home");
          return;
        }
      }

      // Handle different failure scenarios
      if (result.cancelled) {
        // User cancelled, do nothing - they can try again
        setAuthenticating(false);
      } else if (result.useFallback) {
        // User chose to use password instead
        handleUsePassword();
      } else {
        // Authentication failed
        showToast("error", result.error || "Biometric authentication failed");
        setAuthenticating(false);
      }
    } catch (error) {
      console.error("Biometric auth error:", error);
      showToast("error", "Biometric authentication failed");
      setAuthenticating(false);
    }
  };

  const handleUsePassword = () => {
    router.replace("/(auth)/welcome-back");
  };

  const getBiometricIcon = () => {
    return Platform.OS === "ios" ? "scan" : "finger-print";
  };

  const getBiometricText = () => {
    return Platform.OS === "ios" ? "Face ID" : "Fingerprint";
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
          <Text
            style={[
              styles.welcomeText,
              { color: colors.text, fontFamily: fonts.inter.semiBold },
            ]}
          >
            Welcome Back
          </Text>
          {userName && (
            <Text
              style={[
                styles.nameText,
                { color: colors.primary, fontFamily: fonts.inter.bold },
              ]}
            >
              {userName}
            </Text>
          )}
          {userEmail && (
            <Text
              style={[
                styles.emailText,
                { color: colors.icon, fontFamily: fonts.inter.regular },
              ]}
            >
              {userEmail}
            </Text>
          )}
        </Animated.View>

        {/* Biometric Icon */}
        <Animated.View
          style={[styles.biometricContainer, { opacity: fadeAnim }]}
        >
          <View
            style={[
              styles.biometricCircle,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons
              name={getBiometricIcon()}
              size={44}
              color={colors.primary}
            />
          </View>
          <Text
            style={[
              styles.biometricTitle,
              { color: colors.text, fontFamily: fonts.inter.semiBold },
            ]}
          >
            {getBiometricText()} Authentication
          </Text>
          <Text
            style={[
              styles.biometricSubtitle,
              { color: colors.icon, fontFamily: fonts.inter.regular },
            ]}
          >
            {authenticating
              ? "Authenticating..."
              : `Tap to authenticate with ${getBiometricText().toLowerCase()}`}
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
          {!authenticating && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleBiometricAuth}
              activeOpacity={0.8}
            >
              <Ionicons name={getBiometricIcon()} size={24} color="#fff" />
              <Text
                style={[
                  styles.retryButtonText,
                  { fontFamily: fonts.inter.semiBold },
                ]}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          )}

          {authenticating && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          <TouchableOpacity
            style={styles.passwordButton}
            onPress={handleUsePassword}
            disabled={authenticating}
          >
            <Text
              style={[
                styles.passwordButtonText,
                { color: colors.primary, fontFamily: fonts.inter.medium },
              ]}
            >
              Use Password Instead
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: "150%",
    height: "150%",
    borderRadius: 40,
  },
  welcomeContainer: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 20,
    marginBottom: 8,
  },
  nameText: {
    fontSize: 32,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
  },
  biometricContainer: {
    alignItems: "center",
  },
  biometricCircle: {
    width: 70,
    height: 70,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  biometricTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  biometricSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  actionsContainer: {
    gap: 16,
  },
  retryButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  passwordButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  passwordButtonText: {
    fontSize: 15,
  },
});
