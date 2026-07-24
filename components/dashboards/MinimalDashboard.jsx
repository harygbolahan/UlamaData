import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useTransactions } from "@/contexts/transactions-context";
import { useApiColors } from "@/hooks/use-api-colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BannerCarousel from '../ui/BannerCarousel';

export default function MinimalDashboard() {
  const { fonts, toggleTheme, isDark } = useTheme();
  const colors = useApiColors();
  const { user, refreshUser } = useAuth();
  const { transactions, loading, fetchTransactions } = useTransactions();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBalanceVisibility();
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      await fetchTransactions(1, '', '');
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadTransactions()]);
    setRefreshing(false);
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
    { id: '1', name: 'Data', icon: 'wifi', route: '/(services)/buy-data', color: '#667eea' },
    { id: '2', name: 'Airtime', icon: 'phone-portrait', route: '/(services)/buy-airtime', color: '#f5576c' },
    { id: '3', name: 'Data Pin', icon: 'card', color: '#009688', category: 'Recharge', route: '/(services)/buy-data-pin' },
    { id: '4', name: 'Electricity', icon: 'flash', color: '#F44336', category: 'Bills', route: '/(services)/electricity' },
    { id: '5', name: 'Education', icon: 'school', color: '#FF5722', category: 'Bills', route: '/(services)/education' },
    { id: '6', name: 'Cable TV', icon: 'tv', color: '#FF9800', category: 'Entertainment', route: '/(services)/cable-tv' },
    { id: '7', name: 'Airtime Pin', icon: 'wallet', color: '#E91E63', category: 'Recharge', route: '/(services)/buy-airtime-pin' },
    { id: '8', name: 'More', icon: 'apps', route: '/(tabs)/services', color: '#607d8b' },
  ];

  const banners = [
    {
      id: "1",
      title: "Get 5% Cashback",
      subtitle: "On all data purchases",
      color: "#FF6B6B",
    },
    {
      id: "2",
      title: "Refer & Earn",
      subtitle: "Get ₦500 per referral",
      color: "#4ECDC4",
    },
    {
      id: "3",
      title: "Weekend Bonus",
      subtitle: "Extra 10% on all bills",
      color: "#A8E6CF",
    },
  ];

  const getServiceIcon = (service) => {
    const serviceMap = {
      'data': 'wifi',
      'airtime': 'phone-portrait',
      'cable': 'tv',
      'electricity': 'flash',
      'exam': 'school',
      'sms': 'chatbubbles',
      'coupon': 'pricetag',
      'wallet': 'wallet',
      'transfer': 'swap-horizontal',
    };
    const serviceLower = service?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(serviceMap)) {
      if (serviceLower.includes(key)) return icon;
    }
    return 'receipt';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const recentTransactions = transactions.slice(0, 5).map(tx => ({
    id: tx.tId || tx.transactionRef,
    title: tx.servicename || 'Transaction',
    subtitle: truncateText(tx.servicedesc || tx.category || 'No description'),
    amount: `-₦${parseFloat(tx.amount || 0).toLocaleString('en-NG')}`,
    date: formatDate(tx.date || tx.created_at),
    icon: getServiceIcon(tx.servicename),
    status: (tx.tStatus?.toLowerCase() === 'completed' || String(tx.status) === '0') ? 'success' :
      (tx.tStatus?.toLowerCase() === 'refund' || tx.tStatus?.toLowerCase() === 'refunded' || String(tx.status) === '3') ? 'refund' :
        (tx.tStatus?.toLowerCase() === 'pending' || tx.tStatus?.toLowerCase() === 'processing' || String(tx.status) === '1') ? 'pending' : 'failed',
    transactionRef: tx.transref || tx.transactionRef
  }));


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
                    backgroundColor={colors.primary}
                    barStyle={isDark ? 'light-content' : 'light-content'}
                    translucent={false}
                />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Minimal Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { fontFamily: fonts.inter.regular, color: colors.primaryText }]}>
                Hi, {user?.name || 'User'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleTheme}
              >
                <Ionicons name={isDark ? "sunny" : "moon"} size={18} color={colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={18} color={colors.primaryText} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Elegant Balance Card */}
        <View style={styles.balanceContainer}>
          <View style={[styles.balanceCard, {
            backgroundColor: isDark ? '#1a1a1a' : '#fff',
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? '#2a2a2a' : 'transparent'
          }]}>
            <View style={styles.balanceHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.balanceLabel, { color: colors.icon, fontFamily: fonts.inter.medium }]}>
                  Balance
                </Text>
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceAmount, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    {balanceVisible ? `₦${parseFloat(user?.wallet || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₦****"}
                  </Text>
                  <TouchableOpacity
                    onPress={toggleBalanceVisibility}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                      size={16}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.button }]}
                onPress={() => router.push("/fund-wallet")}
              >
                <Ionicons name="add-circle" size={18} color={colors.primaryText} />
                <Text style={[styles.actionButtonText, { fontFamily: fonts.inter.bold, color: colors.primaryText }]}>
                  Add Money
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.button }]}
                onPress={() => router.push('/(services)/funds-transfer')}
              >
                <Ionicons name="swap-horizontal" size={18} color={colors.primaryText} />
                <Text style={[styles.actionButtonText, { fontFamily: fonts.inter.bold, color: colors.primaryText }]}>
                  Transfer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cashback Card */}
          <View style={[styles.cashbackCard, {
            backgroundColor: '#4ade8015',
            borderRadius: 12,
            padding: 12,
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }]}>
            <View style={[styles.cashbackIconBg, { backgroundColor: '#4ade8025' }]}>
              <Ionicons name="gift" size={18} color="#4ade80" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cashbackLabel, { color: colors.icon, fontFamily: fonts.inter.medium, fontSize: 10 }]}>
                Available Cashback
              </Text>
              <Text style={[styles.cashbackAmount, { color: colors.text, fontFamily: fonts.inter.bold, fontSize: 15 }]}>
                {balanceVisible ? `₦${parseFloat(user?.cashback || 0).toLocaleString('en-NG')}` : "₦****"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.icon} />
          </View>
        </View>

        {/* Clean Services Grid */}
        <View style={styles.servicesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
            Services
          </Text>
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceItem}
                onPress={() => service.route && router.push(service.route)}
              >
                <View style={[styles.serviceIcon, {
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#fff",
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? '#2a2a2a' : 'transparent',
                }]}>
                  <Ionicons name={service.icon} size={24} color={colors.primary} />
                </View>
                <Text
                  style={[
                    styles.serviceName,
                    { color: colors.text, fontFamily: fonts.inter.medium },
                  ]}
                  numberOfLines={1}
                >
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        {/* Banners */}
        <View style={styles.servicesSection}>
          <BannerCarousel />
        </View>


        {/* Minimal Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
              Recent
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text style={[styles.seeAll, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={32} color={colors.icon} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
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
                    backgroundColor: colors.isDark ? "#1a1a1a" : "#fff",
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? '#2a2a2a' : 'transparent',
                    marginBottom: index === recentTransactions.length - 1 ? 0 : 8,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/transaction-details',
                    params: {
                      transactionRef: transaction.transactionRef,
                      transactionDate: transaction.date
                    }
                  })
                }
              >
                <View style={[styles.transactionIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name={transaction.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text
                    style={[
                      styles.transactionTitle,
                      { color: colors.text, fontFamily: fonts.inter.semiBold },
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
                  <View style={[styles.statusDot, {
                    backgroundColor: transaction.status === 'success' ? colors.success : transaction.status === 'pending' ? '#FFA500' : transaction.status === 'refund' ? '#2196F3' : '#EF4444'
                  }]} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Minimal Header
  header: {
    paddingTop: 48,
    paddingBottom: 106,
    paddingHorizontal: 16,
    borderBottomEndRadius: 26,
    borderBottomStartRadius: 26,
    // marginBottom: -98
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff20',
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff4757",
  },

  // Elegant Balance Card
  balanceContainer: {
    paddingHorizontal: 16,
    marginTop: -98,
    marginBottom: 20,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceAmount: {
    fontSize: 26,
    letterSpacing: -0.5,
  },
  eyeButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 12,
  },
  cashbackCard: {
    // Styles defined inline
  },
  cashbackIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashbackLabel: {
    // Styles defined inline
  },
  cashbackAmount: {
    // Styles defined inline
  },

  // Clean Services
  servicesSection: {
    paddingHorizontal: 16,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 17,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  serviceItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceName: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 12,
  },

  // Minimal Transactions
  transactionsSection: { paddingHorizontal: 16 },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: { fontSize: 13 },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.6,
  },
  transactionCard: {
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionTitle: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  transactionSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  transactionRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  transactionAmount: {
    fontSize: 14,
    letterSpacing: -0.3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
