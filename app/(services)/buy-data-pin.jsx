import { useServices } from "@/contexts/services-context";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NETWORK_IMAGES = {
  mtn: require("@/assets/networks/mtn.png"),
  airtel: require("@/assets/networks/airtel.png"),
  "9mobile": require("@/assets/networks/9mobile.png"),
  glo: require("@/assets/networks/glo.png"),
};

const NETWORK_BACKGROUNDS = {
  mtn: "rgba(255, 204, 0, 0.2)",
  airtel: "rgba(255, 0, 0, 0.2)",
  "9mobile": "rgba(0, 166, 90, 0.2)",
  glo: "rgba(0, 168, 89, 0.2)",
};

export default function BuyDataPinScreen() {
  const { colors, fonts, isDark } = useTheme();
  const { fetchDataPinNetworks, fetchDataPinTypes, fetchDataPinPlans } =
    useServices();
  const { showToast } = useToast();

  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [activePlanType, setActivePlanType] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [businessName, setBusinessName] = useState("");

  const [networks, setNetworks] = useState([]);
  const [dataTypes, setDataTypes] = useState([]);
  const [dataPlans, setDataPlans] = useState([]);

  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Fetch networks on mount
  useEffect(() => {
    loadNetworks();
  }, []);

  // Set MTN as default network once networks are loaded
  useEffect(() => {
    if (networks.length > 0 && !selectedNetwork) {
      const mtnNetwork = networks.find(
        (n) => n.network.toUpperCase() === "MTN",
      );
      if (mtnNetwork) {
        setSelectedNetwork({
          id: mtnNetwork.network.toLowerCase(),
          name: mtnNetwork.network.toUpperCase(),
        });
      }
    }
  }, [networks]);

  // Fetch data types when network is selected
  useEffect(() => {
    if (selectedNetwork) {
      loadDataTypes(selectedNetwork.name);
    } else {
      setDataTypes([]);
      setActivePlanType(null);
      setDataPlans([]);
    }
  }, [selectedNetwork]);

  // Fetch data plans when plan type is selected
  useEffect(() => {
    if (selectedNetwork && activePlanType) {
      loadDataPlans(selectedNetwork.name, activePlanType);
    } else {
      setDataPlans([]);
    }
  }, [selectedNetwork, activePlanType]);

  const loadNetworks = async () => {
    setLoadingNetworks(true);
    try {
      const data = await fetchDataPinNetworks();
      setNetworks(data);
    } catch (error) {
      showToast("error", error.message || "Failed to load networks");
    } finally {
      setLoadingNetworks(false);
    }
  };

  const loadDataTypes = async (networkName) => {
    setLoadingTypes(true);
    try {
      const types = await fetchDataPinTypes(networkName);
      setDataTypes(types);
      if (types.length > 0) {
        setActivePlanType(types[0]);
      }
    } catch (error) {
      showToast("error", error.message || "Failed to load data types");
      setDataTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadDataPlans = async (networkName, dataType) => {
    setLoadingPlans(true);
    try {
      const plans = await fetchDataPinPlans(networkName, dataType);
      setDataPlans(plans);
    } catch (error) {
      showToast("error", error.message || "Failed to load data plans");
      setDataPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanSelect = async (plan) => {
    if (!selectedNetwork) {
      showToast("warning", "Please select a network");
      return;
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      showToast("warning", "Please enter a valid quantity");
      return;
    }

    // Validate business name
    if (!businessName.trim()) {
      showToast("warning", "Please enter a business name");
      return;
    }

    if (businessName.trim().length > 10) {
      showToast("warning", "Business name must be 10 characters or less");
      return;
    }

    const totalAmount = plan.price * qty;

    try {
      router.push({
        pathname: "/(services)/transaction-summary",
        params: {
          service: "Data Pin",
          beneficiary: `${qty} PIN(s)`,
          amount: totalAmount.toString(),
          bonus: "0",
          network: selectedNetwork.name,
          planSize: plan.datasize,
          validity: `${plan.day} days`,
          planId: plan.datasize,
          planType: activePlanType,
          quantity: qty.toString(),
          businessName: businessName.trim(),
        },
      });
    } catch (error) {
      showToast("error", error.message || "Failed to proceed");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
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
          Buy Data Pin
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Network Selector */}
        {loadingNetworks ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: colors.icon, fontFamily: fonts.inter.regular },
              ]}
            >
              Loading networks...
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fonts.inter.semiBold },
              ]}
            >
              Select Network
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.networkList}
            >
              {networks.map((network) => {
                const networkId = network.network.toLowerCase();
                const networkName = network.network.toUpperCase();
                const isSelected = selectedNetwork?.id === networkId;

                return (
                  <TouchableOpacity
                    key={networkId}
                    style={[
                      styles.networkCard,
                      { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
                      isSelected && {
                        backgroundColor: colors.primary + "20",
                        borderColor: colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() =>
                      setSelectedNetwork({ id: networkId, name: networkName })
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.networkLogoContainer,
                        { backgroundColor: NETWORK_BACKGROUNDS[networkId] },
                      ]}
                    >
                      <Image
                        source={NETWORK_IMAGES[networkId]}
                        style={styles.networkLogo}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      style={[
                        styles.networkName,
                        { fontFamily: fonts.inter.semiBold },
                        isSelected
                          ? { color: colors.primary }
                          : { color: colors.text },
                      ]}
                    >
                      {networkName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Quantity Input */}
        {selectedNetwork && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fonts.inter.semiBold },
              ]}
            >
              Quantity
            </Text>
            <View
              style={[
                styles.quantityContainer,
                { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  { backgroundColor: colors.primary + "20" },
                ]}
                onPress={() => {
                  const current = parseInt(quantity) || 1;
                  if (current > 1) setQuantity((current - 1).toString());
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.quantityInput,
                  { color: colors.text, fontFamily: fonts.inter.semiBold },
                ]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                maxLength={3}
              />

              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  { backgroundColor: colors.primary + "20" },
                ]}
                onPress={() => {
                  const current = parseInt(quantity) || 0;
                  if (current < 999) setQuantity((current + 1).toString());
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Business Name Input */}
        {selectedNetwork && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fonts.inter.semiBold },
              ]}
            >
              Business Name (Max 10 characters)
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
              ]}
            >
              <Ionicons name="business-outline" size={20} color={colors.icon} />
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, fontFamily: fonts.inter.regular },
                ]}
                value={businessName}
                onChangeText={(text) => {
                  if (text.length <= 10) {
                    setBusinessName(text);
                  }
                }}
                placeholder="Enter business name"
                placeholderTextColor={colors.icon}
                maxLength={10}
              />
              <Text
                style={[
                  styles.charCount,
                  { color: colors.icon, fontFamily: fonts.inter.regular },
                ]}
              >
                {businessName.length}/10
              </Text>
            </View>
          </View>
        )}

        {/* Plan Type Selector */}
        {selectedNetwork && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fonts.inter.semiBold },
              ]}
            >
              Select Plan Type
            </Text>
            {loadingTypes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.planTypes}
              >
                {dataTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.planTypeChip,
                      { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
                      activePlanType === type && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={() => setActivePlanType(type)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.planTypeText,
                        { fontFamily: fonts.inter.semiBold },
                        activePlanType === type
                          ? { color: "#fff" }
                          : { color: colors.text },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* Data Plans Grid */}
        {selectedNetwork && activePlanType && (
          <>
            {loadingPlans ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[
                    styles.loadingText,
                    { color: colors.icon, fontFamily: fonts.inter.regular },
                  ]}
                >
                  Loading plans...
                </Text>
              </View>
            ) : dataPlans.length > 0 ? (
              <View style={styles.plansGrid}>
                {dataPlans.map((plan) => {
                  const qty = parseInt(quantity) || 1;
                  const totalPrice = plan.price * qty;

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planCard,
                        { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
                      ]}
                      onPress={() => handlePlanSelect(plan)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.planLabel,
                          isDark 
                            ? { backgroundColor: colors.primary } 
                            : { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.planLabelText,
                            {
                              fontFamily: fonts.inter.semiBold,
                            },
                            isDark ? { color: colors.apiTextColor || '#fff' } : { color: colors.primary }
                          ]}
                        >
                          {plan.type}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.planSize,
                          { color: colors.text, fontFamily: fonts.inter.bold },
                        ]}
                      >
                        {plan.datasize}
                      </Text>
                      <View style={styles.planDetails}>
                        <View>
                          <Text
                            style={[
                              styles.planPrice,
                              {
                                fontFamily: fonts.inter.bold,
                              },
                              isDark ? { color: colors.text } : { color: colors.primary }
                            ]}
                          >
                            ₦{totalPrice.toLocaleString()}
                          </Text>
                          {qty > 1 && (
                            <Text
                              style={[
                                styles.unitPrice,
                                {
                                  color: colors.icon,
                                  fontFamily: fonts.inter.regular,
                                },
                              ]}
                            >
                              ₦{plan.price}/unit
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.planDays,
                            {
                              color: colors.icon,
                              fontFamily: fonts.inter.regular,
                            },
                          ]}
                        >
                          {plan.day} {plan.day === "1" ? "day" : "days"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="file-tray-outline"
                  size={48}
                  color={colors.icon}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.icon, fontFamily: fonts.inter.regular },
                  ]}
                >
                  No plans available
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
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
    paddingTop: 50,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18 },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  networkList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  networkCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
    gap: 6,
  },
  networkLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  networkLogo: {
    width: 32,
    height: 32,
  },
  networkName: {
    fontSize: 12,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    fontSize: 24,
    textAlign: "center",
    minWidth: 60,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
  },
  planTypes: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  planTypeChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  planTypeText: { fontSize: 13 },
  plansGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
  },
  planCard: {
    width: "45%",
    margin: "1.5%",
    padding: 16,
    borderRadius: 12,
  },
  planLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  planLabelText: { fontSize: 10 },
  planSize: { fontSize: 20, marginBottom: 8 },
  planDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  planPrice: { fontSize: 16 },
  unitPrice: { fontSize: 10, marginTop: 2 },
  planDays: { fontSize: 12 },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14 },
});
