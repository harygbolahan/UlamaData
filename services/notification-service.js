import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the Expo Push Token
 * @see https://docs.expo.dev/push-notifications/push-notifications-setup/
 * @returns {Promise<string|null>} The Expo Push Token or null if registration fails
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  // Check if running on a physical device
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Android-specific notification channel setup
  // Required for Android 8.0 (API level 26) and higher
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        showBadge: true,
      });
    } catch (error) {
      console.error('Error setting notification channel:', error);
    }
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permission not granted for push notifications');
      return null;
    }

    // Get the project ID from app config (required for EAS)
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error('Project ID not found in app config. Ensure EAS is configured.');
      return null;
    }

    // Get the Expo Push Token
    // For FCM v1 (Android), this requires google-services.json configured in app.json
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    token = pushToken.data;
    console.log('✅ Registered Expo Push Token:', token);

    return token;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);

    // Provide more specific error info if possible
    if (error.message?.includes('INVALID_SENDER')) {
      console.error('FCM configuration error: Check your google-services.json and FCM setup.');
    }

    return null;
  }
}

/**
 * Send a test push notification (for development/testing)
 * @param {string} expoPushToken - The Expo Push Token to send notification to
 * @param {object} notificationData - Custom notification data
 */
export async function sendTestPushNotification(expoPushToken, notificationData = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: notificationData.title || 'Test Notification',
    body: notificationData.body || 'This is a test notification from UlamaData',
    data: notificationData.data || { type: 'test' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Schedule a local notification
 * @param {object} content - Notification content
 * @param {object} trigger - Notification trigger (time-based)
 */
export async function scheduleLocalNotification(content, trigger) {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });
    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - The notification ID to cancel
 */
export async function cancelScheduledNotification(notificationId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
    throw error;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    throw error;
  }
}
