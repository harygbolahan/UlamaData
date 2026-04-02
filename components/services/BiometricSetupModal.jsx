import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { enableBiometric } from "@/services/biometric";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BiometricSetupModal({ visible, onClose, onSuccess }) {
  const { colors, fonts, isDark } = useTheme();
  const { showToast } = useToast();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter PIN, 2: Confirm PIN, 3: Success
  const [error, setError] = useState("");
  const [biometricType, setBiometricType] = useState("biometric");
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    [...Array(5)].map(() => new Animated.Value(1)),
  ).current;

  useEffect(() => {
    if (visible) {
      checkBiometricType();
      resetModal();
    }
  }, [visible]);

  const checkBiometricType = async () => {
    if (Platform.OS === "ios") {
      setBiometricType("face");
    } else {
      setBiometricType("fingerprint");
    }
  };

  const resetModal = () => {
    setPin("");
    setConfirmPin("");
    setStep(1);
    setError("");
  };

  const handleEnableBiometric = async () => {
    setLoading(true);
    setError("");

    try {
      // Use '12345' as the default transaction pin for biometric setup
      const result = await enableBiometric("12345");
      if (result.success) {
        setStep(2);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        if (result.error !== "Authentication cancelled") {
          setError(result.error || "Failed to enable biometric authentication");
        }
        setLoading(false);
      }
    } catch (error) {
      setError(error.message || "An error occurred");
      setLoading(false);
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
    ]).start();
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case "face":
        return "scan";
      case "fingerprint":
        return "finger-print";
      default:
        return "shield-checkmark";
    }
  };

  const getBiometricText = () => {
    return Platform.OS === "ios" ? "FaceID" : "Fingerprint";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.modalHandle,
              { backgroundColor: isDark ? "#3a3a3a" : "#d0d0d0" },
            ]}
          />

          {step === 2 ? (
            <View style={styles.successContainer}>
              <View
                style={[
                  styles.successIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color={colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.successTitle,
                  { color: colors.text, fontFamily: fonts.inter.bold },
                ]}
              >
                Biometric Enabled!
              </Text>
              <Text
                style={[
                  styles.successText,
                  { color: colors.icon, fontFamily: fonts.inter.regular },
                ]}
              >
                You can now use {getBiometricText().toLowerCase()} for
                transactions
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name={getBiometricIcon()}
                  size={48}
                  color={colors.primary}
                />
              </View>

              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontFamily: fonts.inter.bold },
                ]}
              >
                Quick Authentication
              </Text>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: colors.icon, fontFamily: fonts.inter.regular },
                ]}
              >
                Enable {getBiometricText()} to authorize your transactions quickly without entering any PIN.
              </Text>

              {error && (
                <Text
                  style={[
                    styles.errorText,
                    { color: colors.error, fontFamily: fonts.inter.medium, marginBottom: 16 },
                  ]}
                >
                  {error}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.enableButton, { backgroundColor: colors.primary }]}
                onPress={handleEnableBiometric}
                disabled={loading}
              >
                <Text style={[styles.enableButtonText, { fontFamily: fonts.inter.bold }]}>
                  {loading ? "Processing..." : `Enable ${getBiometricText()}`}
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.disclaimerText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                By enabling, you agree to use your biometric profile for transaction security.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 6,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  pinDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  numberPad: {
    alignItems: "center",
    marginBottom: 12,
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
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    textAlign: "center",
  },
  enableButton: {
    height: 56,
    borderRadius: 16,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  enableButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: "center",
    opacity: 0.6,
  },
});
