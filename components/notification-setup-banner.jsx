import { useNotification } from '@/contexts/notification-context';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Banner component that shows when push notifications are not supported
 * (e.g., running in Expo Go instead of development build)
 */
export default function NotificationSetupBanner() {
  const { isSupported, error } = useNotification();

  // Don't show banner if notifications are supported
  if (isSupported) {
    return null;
  }

  const handleLearnMore = () => {
    Linking.openURL('https://docs.expo.dev/develop/development-builds/create-a-build/');
  };

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Push Notifications Unavailable</Text>
          <Text style={styles.message}>
            Create a development build to enable push notifications
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLearnMore}>
        <Text style={styles.buttonText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#f39c12',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
