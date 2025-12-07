import { useTheme } from "@/contexts/theme-context";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SalesAnalysisScreen() {
  const { colors, fonts } = useTheme();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [error, setError] = useState(null);

  // Custom date range states
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customFromDate, setCustomFromDate] = useState(new Date());
  const [customToDate, setCustomToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const periods = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "year", label: "This Year" },
    { id: "custom", label: "Custom" },
  ];

  useEffect(() => {
    if (selectedPeriod !== "custom") {
      fetchSalesData();
    }
  }, [selectedPeriod]);

  const fetchSalesData = async (fromDate = null, toDate = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};

      if (selectedPeriod === "custom" && fromDate && toDate) {
        // Format dates as YYYY-MM-DD
        params.from = fromDate.toISOString().split("T")[0];
        params.to = toDate.toISOString().split("T")[0];
      } else if (selectedPeriod !== "custom") {
        params.period = selectedPeriod;
      }

      const response = await api.get("/user/sales", { params });
      setSalesData(response);
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError(err.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSelect = (periodId) => {
    setSelectedPeriod(periodId);
    if (periodId === "custom") {
      setShowCustomModal(true);
    }
  };

  const handleCustomDateApply = () => {
    if (customFromDate > customToDate) {
      alert("From date cannot be after To date");
      return;
    }
    setShowCustomModal(false);
    fetchSalesData(customFromDate, customToDate);
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calculateTotal = () => {
    if (!salesData?.summary) return 0;
    const { Data, Airtime, Cable, Exam, Electricity, Airtimepin, Datapin } =
      salesData.summary;
    return (
      (Data?.amount || 0) +
      parseFloat(Airtime || 0) +
      parseFloat(Cable || 0) +
      parseFloat(Exam || 0) +
      parseFloat(Electricity || 0) +
      parseFloat(Airtimepin || 0) +
      parseFloat(Datapin || 0)
    );
  };

  const getServiceIcon = (service) => {
    const icons = {
      Data: "wifi",
      Airtime: "phone-portrait",
      Cable: "tv",
      Exam: "school",
      Electricity: "flash",
      Airtimepin: "wallet",
      Datapin: "card",
    };
    return icons[service] || "cube";
  };

  const getServiceColor = (service) => {
    const colors = {
      Data: "#2196F3",
      Airtime: "#4CAF50",
      Cable: "#FF9800",
      Exam: "#FF5722",
      Electricity: "#F44336",
      Airtimepin: "#E91E63",
      Datapin: "#009688",
    };
    return colors[service] || "#607D8B";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: fonts.inter.bold },
          ]}
        >
          Sales Analysis
        </Text>
        <TouchableOpacity onPress={fetchSalesData}>
          <Ionicons name="refresh" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodContainer}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodChip,
                {
                  backgroundColor:
                    selectedPeriod === period.id
                      ? colors.primary
                      : colors.isDark
                      ? "#1f1f1f"
                      : "#f5f5f5",
                },
              ]}
              onPress={() => handlePeriodSelect(period.id)}
            >
              <Text
                style={[
                  styles.periodText,
                  {
                    color: selectedPeriod === period.id ? "#fff" : colors.text,
                    fontFamily: fonts.inter.medium,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                styles.loadingText,
                {
                  color: colors.textSecondary,
                  fontFamily: fonts.inter.regular,
                },
              ]}
            >
              Loading sales data...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text
              style={[
                styles.errorText,
                { color: colors.error, fontFamily: fonts.inter.medium },
              ]}
            >
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchSalesData}
            >
              <Text
                style={[
                  styles.retryButtonText,
                  { fontFamily: fonts.inter.medium },
                ]}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : salesData ? (
          <>
            {/* Date Range */}
            {salesData.from && salesData.to && (
              <TouchableOpacity
                style={[
                  styles.dateRangeCard,
                  { backgroundColor: colors.isDark ? "#1f1f1f" : "#f5f5f5" },
                ]}
                onPress={() => setShowCustomModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.dateRangeText,
                    {
                      color: colors.textSecondary,
                      fontFamily: fonts.inter.regular,
                    },
                  ]}
                >
                  {new Date(salesData.from).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" - "}
                  {new Date(salesData.to).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.icon} />
              </TouchableOpacity>
            )}

            {/* Total Sales Card */}
            <View
              style={[styles.totalCard, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.totalLabel, { fontFamily: fonts.inter.medium }]}
              >
                Total Sales
              </Text>
              <Text
                style={[styles.totalAmount, { fontFamily: fonts.inter.bold }]}
              >
                {formatCurrency(calculateTotal())}
              </Text>
            </View>

            {/* Services Breakdown */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fonts.inter.semiBold },
                ]}
              >
                Sales by Service
              </Text>

              {salesData.summary &&
                Object.entries(salesData.summary).map(([service, value]) => {
                  const amount =
                    typeof value === "object"
                      ? value.amount
                      : parseFloat(value || 0);
                  if (amount === 0) return null;

                  return (
                    <View
                      key={service}
                      style={[
                        styles.serviceCard,
                        {
                          backgroundColor: colors.isDark
                            ? "#1f1f1f"
                            : "#f5f5f5",
                        },
                      ]}
                    >
                      <View style={styles.serviceHeader}>
                        <View style={styles.serviceLeft}>
                          <View
                            style={[
                              styles.serviceIcon,
                              {
                                backgroundColor:
                                  getServiceColor(service) + "20",
                              },
                            ]}
                          >
                            <Ionicons
                              name={getServiceIcon(service)}
                              size={20}
                              color={getServiceColor(service)}
                            />
                          </View>
                          <Text
                            style={[
                              styles.serviceName,
                              {
                                color: colors.text,
                                fontFamily: fonts.inter.semiBold,
                              },
                            ]}
                          >
                            {service}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.serviceAmount,
                            {
                              color: colors.text,
                              fontFamily: fonts.inter.bold,
                            },
                          ]}
                        >
                          {formatCurrency(amount)}
                        </Text>
                      </View>

                      {/* Data Breakdown */}
                      {service === "Data" &&
                        value.items &&
                        value.items.length > 0 && (
                          <View style={styles.dataBreakdown}>
                            {value.items.map((item, index) => (
                              <View key={index} style={styles.dataItem}>
                                <Text
                                  style={[
                                    styles.dataItemName,
                                    {
                                      color: colors.textSecondary,
                                      fontFamily: fonts.inter.regular,
                                    },
                                  ]}
                                >
                                  {item.data}
                                </Text>
                                <Text
                                  style={[
                                    styles.dataItemAmount,
                                    {
                                      color: colors.textSecondary,
                                      fontFamily: fonts.inter.medium,
                                    },
                                  ]}
                                >
                                  {formatCurrency(item.amount)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                    </View>
                  );
                })}
            </View>
          </>
        ) : null}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Custom Date Range Modal */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontFamily: fonts.inter.bold },
                ]}
              >
                Select Date Range
              </Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* From Date */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.text, fontFamily: fonts.inter.medium },
                  ]}
                >
                  From Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.isDark ? "#1f1f1f" : "#f5f5f5",
                      borderColor: colors.isDark ? "#333" : "#e0e0e0",
                    },
                  ]}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                  <Text
                    style={[
                      styles.dateInputText,
                      { color: colors.text, fontFamily: fonts.inter.regular },
                    ]}
                  >
                    {formatDateForDisplay(customFromDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* To Date */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.text, fontFamily: fonts.inter.medium },
                  ]}
                >
                  To Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.isDark ? "#1f1f1f" : "#f5f5f5",
                      borderColor: colors.isDark ? "#333" : "#e0e0e0",
                    },
                  ]}
                  onPress={() => setShowToPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                  <Text
                    style={[
                      styles.dateInputText,
                      { color: colors.text, fontFamily: fonts.inter.regular },
                    ]}
                  >
                    {formatDateForDisplay(customToDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={handleCustomDateApply}
              >
                <Text
                  style={[
                    styles.applyButtonText,
                    { fontFamily: fonts.inter.semiBold },
                  ]}
                >
                  Apply Date Range
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={customFromDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowFromPicker(Platform.OS === "ios");
            if (selectedDate) {
              setCustomFromDate(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={customToDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowToPicker(Platform.OS === "ios");
            if (selectedDate) {
              setCustomToDate(selectedDate);
            }
          }}
          minimumDate={customFromDate}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
    textAlign: "center",
  },
  periodContainer: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  periodChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  periodText: {
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  dateRangeCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  dateRangeText: {
    fontSize: 13,
  },
  totalCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
  },
  totalAmount: {
    color: "#fff",
    fontSize: 32,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 15,
  },
  serviceAmount: {
    fontSize: 16,
  },
  dataBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  dataItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  dataItemName: {
    fontSize: 13,
    flex: 1,
  },
  dataItemAmount: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
  },
  modalBody: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  dateInputText: {
    fontSize: 14,
    flex: 1,
  },
  applyButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 15,
  },
});
