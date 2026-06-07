import { useServices } from "@/contexts/services-context";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function BulkSMSScreen() {
  const { colors, fonts, isDark } = useTheme();
  const { purchaseBulkSMS, fetchBulkSMSPricing } = useServices();
  const { showToast } = useToast();
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [pricePerSMS, setPricePerSMS] = useState(4); // Default price

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const data = await fetchBulkSMSPricing();
        console.log("SMS Pricing data:", data);
        // Check if data is an object with a charge property (API uses 'charge')
        const price =
          typeof data === "object"
            ? data.charge || data.price || data.amount
            : data;
        if (price && !isNaN(price)) {
          setPricePerSMS(Number(price));
        }
      } catch (err) {
        console.error("Failed to load SMS pricing:", err);
      }
    };
    loadPricing();
  }, []);

  const getPhoneCount = () => {
    const numbers = phoneNumbers.split(",").filter((n) => n.trim().length > 0);
    return numbers.length;
  };

  const getMessageCount = () => {
    return Math.ceil(message.length / 160);
  };

  const getPricePerSMS = () => pricePerSMS;

  const getTotalAmount = () => {
    return getPhoneCount() * getMessageCount() * getPricePerSMS();
  };

  const handleContinue = () => {
    const numbers = phoneNumbers.split(",").filter((n) => n.trim().length > 0);
    if (numbers.length === 0 || !message || !subject) {
      showToast("warning", "Please fill in all required fields");
      return;
    }

    router.push({
      pathname: "/(services)/transaction-summary",
      params: {
        service: "Bulk SMS",
        beneficiary: `${numbers.length} recipients`,
        amount: getTotalAmount().toString(),
        planSize: `${getMessageCount()} SMS per recipient`,
        senderName: senderName || "Default",
        subject: subject,
        phoneNumbers: phoneNumbers,
        message: message,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: fonts.inter.bold },
          ]}
        >
          Bulk SMS
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sender Name */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.inter.semiBold },
          ]}
        >
          Sender Name
        </Text>
        <View
          style={[
            styles.input,
            { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
          ]}
        >
          <TextInput
            placeholder="e.g., MyBusiness"
            placeholderTextColor={colors.icon}
            value={senderName}
            onChangeText={setSenderName}
            maxLength={11}
            style={[
              styles.inputText,
              { color: colors.text, fontFamily: fonts.inter.regular },
            ]}
          />
        </View>

        {/* Subject */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.inter.semiBold },
          ]}
        >
          Subject *
        </Text>
        <View
          style={[
            styles.input,
            { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
          ]}
        >
          <TextInput
            placeholder="e.g., Promotional Message"
            placeholderTextColor={colors.icon}
            value={subject}
            onChangeText={setSubject}
            style={[
              styles.inputText,
              { color: colors.text, fontFamily: fonts.inter.regular },
            ]}
          />
        </View>

        {/* Phone Numbers */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.inter.semiBold },
          ]}
        >
          Phone Numbers (Comma separated)
        </Text>
        <View
          style={[
            styles.textAreaContainer,
            { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
          ]}
        >
          <TextInput
            placeholder="08012345678, 08098765432, 07011223344"
            placeholderTextColor={colors.icon}
            value={phoneNumbers}
            onChangeText={setPhoneNumbers}
            multiline
            numberOfLines={4}
            keyboardType="default"
            returnKeyType="default"
            blurOnSubmit={false}
            textAlignVertical="top"
            style={[
              styles.textArea,
              {
                color: colors.text,
                fontFamily: fonts.inter.regular,
                minHeight: 80,
              },
            ]}
          />
          <View style={styles.countBadge}>
            <Text
              style={[
                styles.countText,
                { color: colors.primary, fontFamily: fonts.inter.semiBold },
              ]}
            >
              {getPhoneCount()} recipients
            </Text>
          </View>
        </View>

        {/* Message */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.inter.semiBold },
          ]}
        >
          Message
        </Text>
        <View
          style={[
            styles.textAreaContainer,
            { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
          ]}
        >
          <TextInput
            placeholder="Type your message here..."
            placeholderTextColor={colors.icon}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={8}
            returnKeyType="default"
            blurOnSubmit={false}
            textAlignVertical="top"
            style={[
              styles.textArea,
              { color: colors.text, fontFamily: fonts.inter.regular },
            ]}
          />
          <View style={styles.messageInfo}>
            <Text
              style={[
                styles.charCount,
                { color: colors.icon, fontFamily: fonts.inter.regular },
              ]}
            >
              {message.length} characters
            </Text>
            <Text
              style={[
                styles.smsCount,
                { color: colors.primary, fontFamily: fonts.inter.semiBold },
              ]}
            >
              {getMessageCount()} SMS
            </Text>
          </View>
        </View>

        {/* Pricing Info */}
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
            SMS are charged at ₦{getPricePerSMS()} per page (160 characters)
          </Text>
        </View>

        {/* Total Summary */}
        {getTotalAmount() > 0 && (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.text, fontFamily: fonts.inter.regular },
                ]}
              >
                Recipients
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: colors.text, fontFamily: fonts.inter.semiBold },
                ]}
              >
                {getPhoneCount()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.text, fontFamily: fonts.inter.regular },
                ]}
              >
                SMS per recipient
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: colors.text, fontFamily: fonts.inter.semiBold },
                ]}
              >
                {getMessageCount()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.text, fontFamily: fonts.inter.regular },
                ]}
              >
                Total SMS
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: colors.text, fontFamily: fonts.inter.semiBold },
                ]}
              >
                {getPhoneCount() * getMessageCount()}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text
                style={[
                  styles.totalLabel,
                  { color: colors.text, fontFamily: fonts.inter.bold },
                ]}
              >
                Total Amount
              </Text>
              <Text
                style={[
                  styles.totalValue,
                  { color: colors.primary, fontFamily: fonts.inter.bold },
                ]}
              >
                ₦{getTotalAmount().toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            (getTotalAmount() === 0 || loading) && { opacity: 0.5 },
          ]}
          onPress={handleContinue}
          disabled={getTotalAmount() === 0 || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[
                styles.continueText,
                { fontFamily: fonts.inter.semiBold },
              ]}
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18 },
  sectionTitle: { fontSize: 16, paddingHorizontal: 20, marginBottom: 12 },
  input: {
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputText: { fontSize: 14 },
  textAreaContainer: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  textArea: {
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  countBadge: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  countText: { fontSize: 12 },
  messageInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  charCount: { fontSize: 12 },
  smsCount: { fontSize: 12 },
  infoCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 13 },
  summaryCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  totalLabel: { fontSize: 16 },
  totalValue: { fontSize: 18 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  continueText: {
    fontSize: 16,
    color: "#fff",
  },
});
