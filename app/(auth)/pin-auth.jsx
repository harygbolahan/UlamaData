import { useAuth } from "@/contexts/auth-context";
import { useAutoLock } from "@/contexts/auto-lock-context";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import {
    isBiometricLoginEnabled,
    verifyPinForLogin,
} from "@/services/biometric";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PinAuthScreen() {
  const { colors, fonts, isDark } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const { unlock } = useAutoLock();
  const { showToast } = useToast();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    [...Array(5)].map(() => new Animated.Value(1)),
  ).current;

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

  const handlePinPress = (num) => {
    if (pin.length < 5 && !authenticating) {
      const newPin = pin + num;
      setPin(newPin);
      setError("");

      // Animate the dot
      const index = pin.length;
      Animated.sequence([
        Animated.timing(scaleAnims[index], {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims[index], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-submit when 5 digits entered
      if (newPin.length === 5) {
        setTimeout(() => handlePinSubmit(newPin), 200);
      }
    }
  };

  const handlePinDelete = () => {
    if (pin.length > 0 && !authenticating) {
      setPin(pin.slice(0, -1));
      setError("");
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setError("");
        setPin("");
      }, 500);
    });
  };

  const handlePinSubmit = async (pinToVerify) => {
    setError("");
    setAuthenticating(true);

    const result = await verifyPinForLogin(pinToVerify);

    if (result.success) {
      // PIN verified - check if we have stored credentials
      const biometricEnabled = await isBiometricLoginEnabled();

      if (biometricEnabled) {
        // Get stored credentials (without biometric prompt)
        const SecureStore = require("expo-secure-store");
        const email = await SecureStore.getItemAsync("biometric_email");
        const password = await SecureStore.getItemAsync("biometric_password");

        if (email && password) {
          const loginResult = await login(
            {
              email,
              password,
            },
            true,
          );

          if (loginResult.success) {
            unlock();
            router.replace("/(tabs)/home");
            return;
          }
        }
      }

      // If no credentials stored, just go to home if already authenticated
      if (isAuthenticated) {
        unlock();
        router.replace("/(tabs)/home");
        return;
      }
    }

    setAuthenticating(false);
    setError(result.error || "Incorrect PIN");
    shake();
  };

  const handleUsePassword = () => {
    router.replace("/(auth)/welcome-back");
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

        {/* PIN Entry Section */}
        <Animated.View style={[styles.pinSection, { opacity: fadeAnim }]}>
          
          <Text
            style={[
              styles.pinTitle,
              { color: colors.text, fontFamily: fonts.inter.semiBold },
            ]}
          >
            Enter Your PIN
          </Text>
          <Text
            style={[
              styles.pinSubtitle,
              {
                color: error ? "#FF3B30" : colors.icon,
                fontFamily: fonts.inter.regular,
              },
            ]}
          >
            {error || "Enter your 5-digit PIN to continue"}
          </Text>

          {/* PIN Display */}
          <Animated.View
            style={[
              styles.pinDisplay,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5",
                    borderWidth: 2,
                    borderColor: error
                      ? "#FF3B30"
                      : isDark
                        ? "#2a2a2a"
                        : "#e0e0e0",
                  },
                  pin.length > i && {
                    backgroundColor: error ? "#FF3B30" : colors.primary,
                    borderColor: error ? "#FF3B30" : colors.primary,
                  },
                  { transform: [{ scale: scaleAnims[i] }] },
                ]}
              />
            ))}
          </Animated.View>

          {/* Number Pad */}
          <View style={styles.numberPad}>
            {[
              [1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.numberRow}>
                {row.map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.numberButton,
                      { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
                    ]}
                    onPress={() => handlePinPress(num.toString())}
                    activeOpacity={0.7}
                    disabled={authenticating}
                  >
                    <Text
                      style={[
                        styles.numberText,
                        {
                          color: colors.text,
                          fontFamily: fonts.inter.semiBold,
                        },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={styles.numberRow}>
              <View style={styles.numberButton} />
              <TouchableOpacity
                style={[
                  styles.numberButton,
                  { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
                ]}
                onPress={() => handlePinPress("0")}
                activeOpacity={0.7}
                disabled={authenticating}
              >
                <Text
                  style={[
                    styles.numberText,
                    { color: colors.text, fontFamily: fonts.inter.semiBold },
                  ]}
                >
                  0
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={handlePinDelete}
                activeOpacity={0.7}
                disabled={pin.length === 0 || authenticating}
              >
                <Ionicons
                  name="backspace-outline"
                  size={26}
                  color={pin.length === 0 ? colors.icon + "40" : colors.icon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Action Button */}
        <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
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
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
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
    fontSize: 18,
    marginBottom: 8,
  },
  nameText: {
    fontSize: 28,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
  },
  pinSection: {
    alignItems: "center",
  },
  pinIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  pinTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  pinSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    minHeight: 20,
  },
  pinDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  numberPad: {
    alignItems: "center",
  },
  numberRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  numberButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
  },
  numberText: {
    fontSize: 24,
  },
  actionsContainer: {
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
