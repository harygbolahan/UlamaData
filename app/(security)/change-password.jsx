import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useTheme } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const { colors, fonts, isDark } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and Confirm password do not match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    Alert.alert("Success", "Password changed successfully", [
      { text: "OK", onPress: () => router.back() },
    ]);
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
          Change Password
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
            Choose a strong password with at least 6 characters including
            letters and numbers.
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
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <Input
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Input
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Change Password"
          onPress={handleChangePassword}
          style={{
            opacity:
              !currentPassword || !newPassword || !confirmPassword ? 0.5 : 1,
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
