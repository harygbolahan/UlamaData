import Button from "@/components/ui/Button";
import { useTheme } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * TransactionConfirmModal - A modal for simple transaction confirmation
 * 
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onConfirm - Callback when transaction is confirmed
 * @param {string} amount - Transaction amount
 * @param {string} service - Service name
 * @param {string} beneficiary - Beneficiary details
 */
export default function TransactionConfirmModal({ 
  visible, 
  onClose, 
  onConfirm,
  amount,
  service,
  beneficiary
}) {
  const { colors, fonts, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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

          <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          </View>

          <Text
            style={[
              styles.modalTitle,
              { color: colors.text, fontFamily: fonts.inter.bold },
            ]}
          >
            Confirm Transaction
          </Text>
          
          <Text
            style={[
              styles.modalSubtitle,
              { color: colors.icon, fontFamily: fonts.inter.regular },
            ]}
          >
            Are you sure you want to proceed with this transaction?
          </Text>

          <View style={[styles.detailsContainer, { backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9" }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Amount</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.bold }]}>₦{amount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Service</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.medium }]}>{service}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>To</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontFamily: fonts.inter.medium }]}>{beneficiary}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: colors.icon + "30" }]} 
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.icon, fontFamily: fonts.inter.medium }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: colors.primary }]} 
              onPress={onConfirm}
            >
              <Text style={[styles.confirmText, { fontFamily: fonts.inter.bold }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  detailsContainer: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButton: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
  },
  confirmText: {
    fontSize: 15,
    color: "#FFFFFF",
  },
});
