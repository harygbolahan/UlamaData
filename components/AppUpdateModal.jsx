import { useDashboard } from '@/contexts/dashboard-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import {
  BackHandler,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppUpdateModal() {
  const { updateInfo, dismissUpdateModal } = useDashboard();
  const { colors, fonts, isDark } = useTheme();

  const {
    needsUpdate,
    forceUpdate,
    appVersion,
    androidAppUrl,
    iosAppUrl,
    isDismissed,
  } = updateInfo || {};

  // Intercept Android hardware back button when force update is active
  useEffect(() => {
    if (needsUpdate && forceUpdate) {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          // Return true to prevent default back button action (prevents closing modal)
          return true;
        }
      );
      return () => backHandler.remove();
    }
  }, [needsUpdate, forceUpdate]);

  // If no update is required, or if soft update was dismissed, do not render
  if (!needsUpdate || (!forceUpdate && isDismissed)) {
    return null;
  }

  const handleUpdatePress = async () => {
    const defaultAndroidUrl =
      'https://play.google.com/store/apps/details?id=com.ulamadatanigeria.ulamadata';
    const defaultIosUrl =
      'https://apps.apple.com/app/ulamadata/id6760598685';

    const targetUrl = Platform.OS === 'ios'
      ? (iosAppUrl || defaultIosUrl)
      : (androidAppUrl || defaultAndroidUrl);

    try {
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
      } else {
        await Linking.openURL(targetUrl);
      }
    } catch (error) {
      console.error('Error opening app store URL:', error);
    }
  };

  // FULL SCREEN FORCED UPDATE BANNER
  if (forceUpdate) {
    return (
      <Modal
        visible={true}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          // Do nothing to prevent back button from closing modal
        }}
      >
        <SafeAreaView
          style={[
            styles.fullScreenContainer,
            { backgroundColor: isDark ? '#0b0f19' : '#ffffff' },
          ]}
        >
          <View style={styles.fullScreenContent}>
            {/* Header / Icon Badge */}
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: (colors?.primary || '#002db3') + '15' },
              ]}
            >
              <Ionicons
                name="cloud-download-outline"
                size={54}
                color={colors?.primary || '#002db3'}
              />
            </View>

            {/* Title */}
            <Text
              style={[
                styles.fullScreenTitle,
                {
                  color: colors?.text || (isDark ? '#ffffff' : '#111827'),
                  fontFamily: fonts?.inter?.bold || 'System',
                },
              ]}
            >
              Update Required
            </Text>

            {/* Subtitle / Version Info */}
            {appVersion && (
              <View
                style={[
                  styles.versionBadge,
                  { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' },
                ]}
              >
                <Text
                  style={[
                    styles.versionBadgeText,
                    {
                      color: colors?.primary || '#002db3',
                      fontFamily: fonts?.inter?.bold || 'System',
                    },
                  ]}
                >
                  Version {appVersion}
                </Text>
              </View>
            )}

            {/* Message Body */}
            <Text
              style={[
                styles.fullScreenMessage,
                {
                  color: isDark ? '#9ca3af' : '#4b5563',
                  fontFamily: fonts?.inter?.regular || 'System',
                },
              ]}
            >
              A mandatory update for UlamaData is available. To keep your account secure and continue using all app services smoothly, please update your application now.
            </Text>

            {/* Big Action Button */}
            <TouchableOpacity
              style={[
                styles.fullScreenButton,
                { backgroundColor: colors?.primary || '#002db3' },
              ]}
              activeOpacity={0.8}
              onPress={handleUpdatePress}
            >
              <Ionicons name="download-outline" size={22} color="#ffffff" style={{ marginRight: 8 }} />
              <Text
                style={[
                  styles.fullScreenButtonText,
                  { fontFamily: fonts?.inter?.bold || 'System' },
                ]}
              >
                Update Now
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // SOFT UPDATE MODAL
  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={dismissUpdateModal}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={dismissUpdateModal}
        />
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' },
          ]}
        >
          {/* Drawer Handle Indicator */}
          <View
            style={[
              styles.modalHandle,
              { backgroundColor: isDark ? '#3a3a3a' : '#e5e5e5' },
            ]}
          />

          <View style={styles.modalHeader}>
            <View
              style={[
                styles.modalIconContainer,
                { backgroundColor: '#FF980015' },
              ]}
            >
              <Ionicons
                name="cloud-download-outline"
                size={24}
                color="#FF9800"
              />
            </View>
            <Text
              style={[
                styles.modalTitle,
                {
                  color: colors?.text || (isDark ? '#ffffff' : '#000000'),
                  fontFamily: fonts?.inter?.bold || 'System',
                  fontSize: 18,
                  flex: 1,
                },
              ]}
            >
              New Update Available!
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={dismissUpdateModal}
            >
              <Ionicons
                name="close"
                size={20}
                color={colors?.text || (isDark ? '#ffffff' : '#000000')}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text
              style={[
                styles.modalMessage,
                {
                  color: isDark ? '#d1d5db' : '#4b5563',
                  fontFamily: fonts?.inter?.regular || 'System',
                  fontSize: 14,
                  lineHeight: 22,
                },
              ]}
            >
              A new version ({appVersion || 'latest'}) of UlamaData is available. Update now to enjoy new features, security enhancements, and optimal performance.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5', flex: 1 },
              ]}
              onPress={dismissUpdateModal}
            >
              <Text
                style={[
                  styles.dismissButtonText,
                  {
                    fontFamily: fonts?.inter?.bold || 'System',
                    color: colors?.text || (isDark ? '#ffffff' : '#111827'),
                    fontSize: 16,
                  },
                ]}
              >
                Later
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors?.primary || '#002db3', flex: 2 },
              ]}
              onPress={handleUpdatePress}
            >
              <Text
                style={[
                  styles.updateButtonText,
                  {
                    fontFamily: fonts?.inter?.bold || 'System',
                    color: '#ffffff',
                    fontSize: 16,
                  },
                ]}
              >
                Update Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Full-screen Forced Banner Styles
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fullScreenContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  fullScreenTitle: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 10,
  },
  versionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  versionBadgeText: {
    fontSize: 14,
  },
  fullScreenMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: 12,
  },
  fullScreenButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullScreenButtonText: {
    color: '#ffffff',
    fontSize: 17,
  },

  // Soft Update Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalMessage: {
    fontSize: 14,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {},
  updateButtonText: {},
});
