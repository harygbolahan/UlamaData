import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useServices } from "@/contexts/services-context";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
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

export default function BuyAirtimePinScreen() {
  const { colors, fonts, isDark } = useTheme();
  const { fetchAirtimePinNetworks, fetchPinSizes } = useServices();
  const { showToast } = useToast();

  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedPinSize, setSelectedPinSize] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [businessName, setBusinessName] = useState("");

  const [networks, setNetworks] = useState([]);
  const [pinSizes, setPinSizes] = useState([]);

  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [loadingPinSizes, setLoadingPinSizes] = useState(false);

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

  // Fetch pin sizes when network is selected
  useEffect(() => {
    if (selectedNetwork) {
      loadPinSizes(selectedNetwork.name);
    } else {
      setPinSizes([]);
      setSelectedPinSize(null);
    }
  }, [selectedNetwork]);

  const loadNetworks = async () => {
    setLoadingNetworks(true);
    try {
      const data = await fetchAirtimePinNetworks();
      setNetworks(data);
    } catch (error) {
      showToast("error", error.message || "Failed to load networks");
    } finally {
      setLoadingNetworks(false);
    }
  };

  const loadPinSizes = async (networkName) => {
    setLoadingPinSizes(true);
    try {
      const sizes = await fetchPinSizes(networkName);
      setPinSizes(sizes);
    } catch (error) {
      showToast("error", error.message || "Failed to load pin sizes");
      setPinSizes([]);
    } finally {
      setLoadingPinSizes(false);
    }
  };

  const handleProceed = async () => {
    if (!selectedNetwork) {
      showToast("warning", "Please select a network");
      return;
    }

    if (!selectedPinSize) {
      showToast("warning", "Please select a pin size");
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

    const totalAmount = selectedPinSize.price * qty;

    try {
      router.push({
        pathname: "/(services)/transaction-summary",
        params: {
          service: "Airtime Pin",
          beneficiary: `${qty} PIN(s)`,
          amount: totalAmount.toString(),
          bonus: "0",
          network: selectedNetwork.name,
          planSize: `₦${selectedPinSize.pinsize}`,
          pinSize: selectedPinSize.pinsize,
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
          Buy Airtime Pin
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Network Selector */}
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

        {/* Pin Sizes */}
        {selectedNetwork && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fonts.inter.semiBold },
              ]}
            >
              Select Pin Size
            </Text>
            {pinSizes.length > 0 && !loadingPinSizes ? (
              <View style={styles.pinSizesGrid}>
                {pinSizes.map((pinData) => {
                  const qty = parseInt(quantity) || 1;
                  const totalPrice = pinData.price * qty;
                  const isSelected = selectedPinSize?.id === pinData.id;

                  return (
                    <TouchableOpacity
                      key={pinData.id}
                      style={[
                        styles.pinSizeCard,
                        { backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" },
                        isSelected && {
                          backgroundColor: colors.primary + "20",
                          borderColor: colors.primary,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedPinSize(pinData)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.pinSizeIcon,
                          { backgroundColor: colors.primary + "15" },
                        ]}
                      >
                        <Ionicons
                          name="card-outline"
                          size={24}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.pinSizeValue,
                          { color: colors.text, fontFamily: fonts.inter.bold },
                        ]}
                      >
                        ₦{pinData.pinsize}
                      </Text>
                      <Text
                        style={[
                          styles.pinSizeLabel,
                          {
                            color: colors.icon,
                            fontFamily: fonts.inter.regular,
                          },
                        ]}
                      >
                        ₦{pinData.price} per PIN
                      </Text>
                      {qty > 1 && (
                        <Text
                          style={[
                            styles.pinSizeTotal,
                            {
                              color: colors.primary,
                              fontFamily: fonts.inter.semiBold,
                            },
                          ]}
                        >
                          Total: ₦{totalPrice.toLocaleString()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              !loadingPinSizes && (
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
                    No pin sizes available
                  </Text>
                </View>
              )
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <LoadingOverlay visible={loadingNetworks || loadingPinSizes} />

      {/* Proceed Button */}
      {selectedNetwork && selectedPinSize && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.proceedButton, { backgroundColor: colors.primary }]}
            onPress={handleProceed}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.proceedButtonText,
                { fontFamily: fonts.inter.semiBold },
              ]}
            >
              Proceed to Payment
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
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
  pinSizesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
  },
  pinSizeCard: {
    width: "45%",
    margin: "1.5%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  pinSizeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  pinSizeValue: {
    fontSize: 20,
  },
  pinSizeLabel: {
    fontSize: 12,
  },
  pinSizeTotal: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14 },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    color: "#fff",
  },
});
