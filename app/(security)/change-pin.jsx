import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { updateStoredPin } from "@/services/biometric";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePinScreen() {
  const { colors, fonts, isDark } = useTheme();
  const { changePin } = useAuth();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const handleChangePin = async () => {
    // Validation
    if (!password || !newPin || !confirmPin) {
      showToast("error", "Please fill all fields");
      return;
    }
    if (newPin !== confirmPin) {
      showToast("error", "New PIN and Confirm PIN do not match");
      return;
    }
    if (newPin.length !== 5) {
      showToast("error", "PIN must be 5 digits");
      return;
    }

    setIsLoading(true);
    const result = await changePin(password, newPin);

    if (result.success) {
      // Update stored biometric PIN if enabled
      await updateStoredPin(newPin);
      setIsLoading(false);
      router.back();
    } else {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: fonts.inter.bold },
          ]}
        >
          Change PIN
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[styles.infoCard, { backgroundColor: colors.primary + "15" }]}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.primary}
          />
          <Text
            style={[
              styles.infoText,
              { color: colors.text, fontFamily: fonts.inter.regular },
            ]}
          >
            Your PIN is used to authorize transactions. You'll need your
            password to change it.
          </Text>
        </View>

        <View
          style={[
            styles.formCard,
            { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
          ]}
        >
          <Input
            label="Current Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            }
          />

          <Input
            label="New PIN"
            placeholder="Enter new 5-digit PIN"
            value={newPin}
            onChangeText={setNewPin}
            keyboardType="numeric"
            maxLength={5}
            secureTextEntry={!showNewPin}
            editable={!isLoading}
            rightIcon={
              <TouchableOpacity onPress={() => setShowNewPin(!showNewPin)}>
                <Ionicons
                  name={showNewPin ? "eye-off" : "eye"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            }
          />

          <Input
            label="Confirm New PIN"
            placeholder="Confirm new 5-digit PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="numeric"
            maxLength={5}
            secureTextEntry={!showConfirmPin}
            editable={!isLoading}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowConfirmPin(!showConfirmPin)}
              >
                <Ionicons
                  name={showConfirmPin ? "eye-off" : "eye"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            }
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isLoading ? "Changing PIN..." : "Change PIN"}
          onPress={handleChangePin}
          disabled={isLoading || !password || !newPin || !confirmPin}
          style={{
            opacity: isLoading || !password || !newPin || !confirmPin ? 0.5 : 1,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18 },
  content: {
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 12 },
  formCard: {
    padding: 20,
    borderRadius: 16,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
});
