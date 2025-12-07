import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useTransactions } from "@/contexts/transactions-context";
import { useApiColors } from "@/hooks/use-api-colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BannerCarousel from "../ui/BannerCarousel";

export default function CompactDashboard() {
  const { fonts, toggleTheme, isDark } = useTheme();
  const colors = useApiColors();
  const { user } = useAuth();
  const { transactions, loading, fetchTransactions } = useTransactions();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const accentColor = colors.primary;

  useEffect(() => {
    loadBalanceVisibility();
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      await fetchTransactions(1, "", "");
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadBalanceVisibility = async () => {
    try {
      const saved = await AsyncStorage.getItem("balanceVisible");
      if (saved !== null) setBalanceVisible(JSON.parse(saved));
    } catch (error) {
      console.error("Error loading balance visibility:", error);
    }
  };

  const toggleBalanceVisibility = async () => {
    const newValue = !balanceVisible;
    setBalanceVisible(newValue);
    try {
      await AsyncStorage.setItem("balanceVisible", JSON.stringify(newValue));
    } catch (error) {
      console.error("Error saving balance visibility:", error);
    }
  };

  const services = [
    { id: "1", name: "Data", icon: "wifi", route: "/(services)/buy-data" },
    {
      id: "2",
      name: "Airtime",
      icon: "phone-portrait",
      route: "/(services)/buy-airtime",
    },
    { id: "3", name: "Cable TV", icon: "tv", route: "/(services)/cable-tv" },
    {
      id: "4",
      name: "Electricity",
      icon: "flash",
      route: "/(services)/electricity",
    },
    {
      id: "5",
      name: "Bulk Order",
      icon: "layers",
      route: "/(services)/bulk-order",
    },
    {
      id: "6",
      name: "Bulk SMS",
      icon: "chatbubbles",
      route: "/(services)/bulk-sms",
    },
    {
      id: "7",
      name: "Schedule",
      icon: "time",
      route: "/(services)/schedule-transaction",
    },
    { id: "8", name: "More", icon: "apps", route: "/(tabs)/services" },
  ];

  const getServiceIcon = (service) => {
    const serviceMap = {
      data: "wifi",
      airtime: "phone-portrait",
      cable: "tv",
      electricity: "flash",
      exam: "school",
      sms: "chatbubbles",
      coupon: "pricetag",
      wallet: "wallet",
      transfer: "swap-horizontal",
    };
    const serviceLower = service?.toLowerCase() || "";
    for (const [key, icon] of Object.entries(serviceMap)) {
      if (serviceLower.includes(key)) return icon;
    }
    return "receipt";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }
    return (
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const recentTransactions = transactions.slice(0, 5).map((tx) => ({
    id: tx.tId || tx.transactionRef,
    title: tx.servicename || "Transaction",
    subtitle: truncateText(tx.servicedesc || tx.category || "No description"),
    amount: `-₦${parseFloat(tx.amount || 0).toLocaleString("en-NG")}`,
    date: formatDate(tx.date || tx.created_at),
    icon: getServiceIcon(tx.servicename),
    status:
      tx.tStatus?.toLowerCase() === "completed"
        ? "success"
        : tx.tStatus?.toLowerCase() === "processing"
        ? "pending"
        : "failed",
    transactionRef: tx.transref || tx.transactionRef,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Compact Header */}
        <View style={[styles.header, { backgroundColor: accentColor }]}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Text
                style={[
                  styles.logo,
                  { fontFamily: fonts.inter.bold, color: colors.primaryText },
                ]}
              >
                UlamaData
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
                <Ionicons
                  name={isDark ? "sunny" : "moon"}
                  size={20}
                  color={colors.primaryText}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.primaryText}
                />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCardContainer}>
          <View
            style={[
              styles.balanceCard,
              { backgroundColor: colors.isDark ? "#1f1f1f" : "#fff" },
            ]}
          >
            <View style={styles.balanceHeader}>
              <View>
                <Text
                  style={[
                    styles.userName,
                    { color: colors.text, fontFamily: fonts.inter.semiBold },
                  ]}
                >
                  {user?.name?.toUpperCase() || "USER"}{" "}
                  {user?.surname?.toUpperCase() || ""}
                </Text>
                <Text
                  style={[
                    styles.userNumber,
                    { color: colors.icon, fontFamily: fonts.inter.regular },
                  ]}
                >
                  {user?.email || "user@example.com"}
                </Text>
              </View>
              <TouchableOpacity onPress={toggleBalanceVisibility}>
                <Ionicons
                  name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text
                  style={[
                    styles.balanceValue,
                    { color: accentColor, fontFamily: fonts.inter.bold },
                  ]}
                >
                  {balanceVisible
                    ? parseFloat(user?.wallet || 0).toLocaleString("en-NG", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : "****"}
                </Text>
                <Text
                  style={[
                    styles.balanceUnit,
                    { color: accentColor, fontFamily: fonts.inter.semiBold },
                  ]}
                >
                  NGN
                </Text>
                <Text
                  style={[
                    styles.balanceSubLabel,
                    { color: colors.icon, fontFamily: fonts.inter.regular },
                  ]}
                >
                  Wallet Balance
                </Text>
              </View>

              <View
                style={[
                  styles.balanceDivider,
                  { backgroundColor: colors.isDark ? "#2a2a2a" : "#E0E0E0" },
                ]}
              />

              <View style={styles.balanceItem}>
                <Text
                  style={[
                    styles.balanceValue,
                    { color: colors.text, fontFamily: fonts.inter.bold },
                  ]}
                >
                  {balanceVisible
                    ? parseFloat(user?.cashback || 0).toLocaleString("en-NG", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : "****"}
                </Text>
                <Text
                  style={[
                    styles.balanceLabel,
                    { color: colors.text, fontFamily: fonts.inter.regular },
                  ]}
                >
                  NGN
                </Text>
                <Text
                  style={[
                    styles.balanceSubLabel,
                    { color: colors.icon, fontFamily: fonts.inter.regular },
                  ]}
                >
                  Cashback
                </Text>
              </View>

              <View
                style={[
                  styles.balanceDivider,
                  { backgroundColor: colors.isDark ? "#2a2a2a" : "#E0E0E0" },
                ]}
              />

              <View style={styles.balanceItem}>
                <Text
                  style={[
                    styles.balanceValue,
                    { color: colors.text, fontFamily: fonts.inter.bold },
                  ]}
                >
                  {balanceVisible ? user?.totalTransactions || "0" : "***"}
                </Text>
                <Text
                  style={[
                    styles.balanceLabel,
                    { color: colors.text, fontFamily: fonts.inter.regular },
                  ]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    styles.balanceSubLabel,
                    { color: colors.icon, fontFamily: fonts.inter.regular },
                  ]}
                >
                  Transactions
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.isDark
                      ? accentColor + "20"
                      : "#FFF5F5",
                    borderColor: accentColor,
                  },
                ]}
                onPress={() => router.push("/fund-wallet")}
              >
                <Ionicons name="add-circle" size={18} color={accentColor} />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: accentColor, fontFamily: fonts.inter.semiBold },
                  ]}
                >
                  Top Up
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.isDark
                      ? accentColor + "20"
                      : "#FFF5F5",
                    borderColor: accentColor,
                  },
                ]}
                onPress={() => router.push("/(services)/funds-transfer")}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={18}
                  color={accentColor}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: accentColor, fontFamily: fonts.inter.semiBold },
                  ]}
                >
                  Transfer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Services */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.inter.bold },
            ]}
          >
            Quick Services
          </Text>

          <View style={styles.quickActionsGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.quickActionItem}
                onPress={() => service.route && router.push(service.route)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: colors.isDark ? "#1f1f1f" : "#fff" },
                  ]}
                >
                  <Ionicons name={service.icon} size={28} color={accentColor} />
                </View>
                <Text
                  style={[
                    styles.quickActionText,
                    { color: colors.text, fontFamily: fonts.inter.regular },
                  ]}
                >
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Banners */}
        <View style={styles.section}>
          <BannerCarousel />
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fonts.inter.bold },
              ]}
            >
              Recent
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/transactions")}
            >
              <Text
                style={[
                  styles.viewAll,
                  { color: accentColor, fontFamily: fonts.inter.semiBold },
                ]}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={accentColor} />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={32}
                color={colors.icon}
                style={{ opacity: 0.3 }}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.icon, fontFamily: fonts.inter.regular },
                ]}
              >
                No transactions yet
              </Text>
            </View>
          ) : (
            recentTransactions.map((transaction, index) => (
              <TouchableOpacity
                key={transaction.id}
                style={[
                  styles.transactionCard,
                  {
                    backgroundColor: colors.isDark ? "#1f1f1f" : "#fff",
                    marginBottom:
                      index === recentTransactions.length - 1 ? 0 : 8,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/transaction-details",
                    params: {
                      transactionRef: transaction.transactionRef,
                      transactionDate: transaction.date,
                    },
                  })
                }
              >
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: accentColor + "15" },
                  ]}
                >
                  <Ionicons
                    name={transaction.icon}
                    size={18}
                    color={accentColor}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text
                    style={[
                      styles.transactionTitle,
                      { color: colors.text, fontFamily: fonts.inter.bold },
                    ]}
                    numberOfLines={1}
                  >
                    {transaction.title}
                  </Text>
                  <Text
                    style={[
                      styles.transactionSubtitle,
                      { color: colors.icon, fontFamily: fonts.inter.regular },
                    ]}
                    numberOfLines={1}
                  >
                    {transaction.subtitle}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: colors.text, fontFamily: fonts.inter.bold },
                    ]}
                  >
                    {transaction.amount}
                  </Text>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          transaction.status === "success"
                            ? colors.success
                            : transaction.status === "pending"
                            ? "#FFA500"
                            : "#EF4444",
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
   paddingTop: 50,
    paddingBottom: 106,
     borderBottomEndRadius: 26,
    borderBottomStartRadius: 26,
    },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {},
  logo: { fontSize: 28, letterSpacing: -1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { position: "relative" },
  notificationButton: { position: "relative" },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#00D4AA",
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#E60000",
  },

  balanceCardContainer: { paddingHorizontal: 16, marginTop: -80 },
  balanceCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  userName: { fontSize: 14, marginBottom: 2 },
  userNumber: { fontSize: 12 },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  balanceItem: { flex: 1, alignItems: "center" },
  balanceValue: { fontSize: 24, marginBottom: 2 },
  balanceUnit: { fontSize: 14, marginBottom: 4 },
  balanceLabel: { fontSize: 14, marginBottom: 2 },
  balanceSubLabel: { fontSize: 11 },
  balanceDivider: { width: 1, marginHorizontal: 8 },

  actionButtons: { flexDirection: "row", gap: 12, marginBottom: 12 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: { fontSize: 13 },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  transferButtonText: { fontSize: 14, color: "#fff" },

  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, marginBottom: 16 },
  viewAll: { fontSize: 13 },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: "20%",
    alignItems: "center",
    marginBottom: 4,
  },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: { fontSize: 11, textAlign: "center", lineHeight: 14 },

  transactionCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontSize: 14, marginBottom: 3 },
  transactionSubtitle: { fontSize: 11, marginBottom: 2 },
  transactionDate: { fontSize: 10 },
  transactionRight: { alignItems: "flex-end" },
  transactionAmount: { fontSize: 15, marginBottom: 5 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  loadingContainer: { paddingVertical: 20, alignItems: "center" },
  emptyContainer: { paddingVertical: 20, alignItems: "center" },
  emptyText: { fontSize: 13, marginTop: 8 },
});
