import { useAuth } from "@/contexts/auth-context";
import { useAutoLock } from "@/contexts/auto-lock-context";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 375;

export default function SignUpScreen() {
  const { colors, fonts, isDark } = useTheme();
  const { register } = useAuth();
  const { unlock } = useAutoLock();
  const { showToast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Form fields
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accesspin, setAccesspin] = useState("");
  const [referBy, setReferBy] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name || !surname || !email) {
        showToast("warning", "Please fill in all required fields");
        return;
      }
      setCurrentStep(2);
    } else {
      handleSignUp();
    }
  };

  const handleSignUp = async () => {
    if (!phone || !password || !confirmPassword || !accesspin) {
      showToast("warning", "Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }
    if (accesspin.length !== 5) {
      showToast("error", "Access PIN must be 5 digits");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name,
      surname,
      phone,
      email,
      password,
      password_confirmation: confirmPassword,
      accesspin,
      refer_by: referBy || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      unlock(); // Unlock the app
      router.replace("/(tabs)/home");
    }
  };

  const renderInput = (label, value, onChangeText, options = {}) => (
    <View style={styles.inputGroup}>
      <Text
        style={[
          styles.label,
          { color: colors.text, fontFamily: fonts.inter.medium },
        ]}
      >
        {label}{" "}
        {options.required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? colors.card : colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        {options.icon && (
          <Ionicons
            name={options.icon}
            size={20}
            color={colors.icon}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.text, fontFamily: fonts.inter.regular },
          ]}
          placeholder={options.placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.icon + "80"}
          value={value}
          onChangeText={onChangeText}
          keyboardType={options.keyboardType || "default"}
          autoCapitalize={options.autoCapitalize || "words"}
          secureTextEntry={options.secureTextEntry && !options.showPassword}
          maxLength={options.maxLength}
          autoCorrect={false}
        />
        {options.secureTextEntry && (
          <Pressable onPress={options.togglePassword} style={styles.eyeIcon}>
            <Ionicons
              name={options.showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.icon}
            />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                style={styles.backButton}
                onPress={() =>
                  currentStep === 1 ? router.back() : setCurrentStep(1)
                }
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="person-add"
                  size={isSmallScreen ? 32 : 40}
                  color={colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontFamily: fonts.inter.bold },
                ]}
              >
                Create Account
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.icon, fontFamily: fonts.inter.regular },
                ]}
              >
                Step {currentStep} of 2
              </Text>
            </View>

            {/* Progress Bar */}
            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${(currentStep / 2) * 100}%`,
                  },
                ]}
              />
            </View>

            {/* Form */}
            <View style={styles.form}>
              {currentStep === 1 ? (
                <>
                  <Text
                    style={[
                      styles.stepTitle,
                      { color: colors.text, fontFamily: fonts.inter.bold },
                    ]}
                  >
                    Personal Information
                  </Text>
                  {renderInput("First Name", name, setName, {
                    icon: "person-outline",
                    required: true,
                  })}
                  {renderInput("Surname", surname, setSurname, {
                    icon: "person-outline",
                    required: true,
                  })}
                  {renderInput("Email Address", email, setEmail, {
                    icon: "mail-outline",
                    keyboardType: "email-address",
                    autoCapitalize: "none",
                    required: true,
                  })}
                </>
              ) : (
                <>
                  <Text
                    style={[
                      styles.stepTitle,
                      { color: colors.text, fontFamily: fonts.inter.bold },
                    ]}
                  >
                    Account Security
                  </Text>
                  {renderInput("Phone Number", phone, setPhone, {
                    icon: "call-outline",
                    keyboardType: "phone-pad",
                    placeholder: "08012345678",
                    required: true,
                  })}
                  {renderInput("Password", password, setPassword, {
                    icon: "lock-closed-outline",
                    secureTextEntry: true,
                    showPassword: showPassword,
                    togglePassword: () => setShowPassword(!showPassword),
                    required: true,
                  })}
                  {renderInput(
                    "Confirm Password",
                    confirmPassword,
                    setConfirmPassword,
                    {
                      icon: "lock-closed-outline",
                      secureTextEntry: true,
                      showPassword: showConfirmPassword,
                      togglePassword: () =>
                        setShowConfirmPassword(!showConfirmPassword),
                      required: true,
                    }
                  )}
                  {renderInput("Access PIN", accesspin, setAccesspin, {
                    icon: "keypad-outline",
                    keyboardType: "number-pad",
                    maxLength: 5,
                    placeholder: "5-digit PIN",
                    secureTextEntry: true,
                    required: true,
                  })}
                  {renderInput("Referral Code", referBy, setReferBy, {
                    icon: "gift-outline",
                    autoCapitalize: "characters",
                    placeholder: "Optional",
                  })}
                </>
              )}
            </View>

            {/* Action Button */}
            <Pressable
              style={[styles.actionButton, { opacity: isSubmitting ? 0.7 : 1 }]}
              onPress={handleNext}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + "DD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.buttonText,
                      { fontFamily: fonts.inter.bold },
                    ]}
                  >
                    {currentStep === 2 ? "Create Account" : "Continue"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Footer */}
            <View style={styles.footer}>
              <Text
                style={[
                  styles.footerText,
                  { color: colors.icon, fontFamily: fonts.inter.regular },
                ]}
              >
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("/(auth)/login")}>
                <Text
                  style={[
                    styles.footerLink,
                    { color: colors.primary, fontFamily: fonts.inter.bold },
                  ]}
                >
                  Sign In
                </Text>
              </Pressable>
            </View>
          </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingVertical: 40,
    marginTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: isSmallScreen ? 24 : 28,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
  iconWrapper: {
    width: isSmallScreen ? 70 : 80,
    height: isSmallScreen ? 70 : 80,
    borderRadius: isSmallScreen ? 20 : 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isSmallScreen ? 16 : 20,
  },
  title: {
    fontSize: isSmallScreen ? 26 : 32,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: isSmallScreen ? 24 : 28,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  form: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    marginBottom: isSmallScreen ? 16 : 20,
  },
  inputGroup: {
    marginBottom: isSmallScreen ? 14 : 16,
  },
  label: {
    fontSize: isSmallScreen ? 13 : 14,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: isSmallScreen ? 50 : 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 15,
  },
  eyeIcon: {
    padding: 4,
  },
  actionButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  gradientButton: {
    paddingVertical: isSmallScreen ? 15 : 17,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: isSmallScreen ? 15 : 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: isSmallScreen ? 13 : 14,
  },
  footerLink: {
    fontSize: isSmallScreen ? 13 : 14,
  },
});
