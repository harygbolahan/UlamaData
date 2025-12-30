import { useAuth } from './auth-context';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('Push notifications require a development build.');
  const [isSupported, setIsSupported] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  const notificationListener = useRef();
  const responseListener = useRef();
  const NotificationsRef = useRef(null); // Store reference for cleanup

  // Sync token with backend when both user and token are available
  useEffect(() => {
    const syncToken = async () => {
      if (user?.id && expoPushToken && !isSynced) {
        try {
          const api = require('../services/api').default;
          await api.savePushToken(user.id, expoPushToken);
          setIsSynced(true);
          console.log('✅ Push token synced with backend for user:', user.id);
        } catch (err) {
          console.error('❌ Failed to sync push token:', err);
        }
      }
    };

    syncToken();
  }, [user?.id, expoPushToken, isSynced]);

  // Reset sync status if user changes
  useEffect(() => {
    setIsSynced(false);
  }, [user?.id]);

  useEffect(() => {
    // Try to load notification modules
    let Notifications = null;
    let Device = null;
    let registerForPushNotificationsAsync = null;

    try {
      Notifications = require('expo-notifications');
      Device = require('expo-device');
      NotificationsRef.current = Notifications; // Store for cleanup

      const notificationService = require('../services/notification-service');
      registerForPushNotificationsAsync = notificationService.registerForPushNotificationsAsync;

      // Check if on physical device
      if (!Device.isDevice) {
        setError('Push notifications require a physical device');
        return;
      }

      setIsSupported(true);
      setError(null);

      // Register for push notifications
      const register = async () => {
        if (isRegistering) return;
        setIsRegistering(true);
        setError(null);

        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setExpoPushToken(token);
            console.log('🚀 Push token obtained:', token);
          } else {
            // Check if it's because of simulator
            if (!Device.isDevice) {
              setError('Push notifications require a physical device');
            } else {
              setError('Failed to get push token. Ensure FCM is configured.');
            }
          }
        } catch (err) {
          console.error('Error registering for notifications:', err);
          setError(err.message);
        } finally {
          setIsRegistering(false);
        }
      };

      // Expose register function to the context value
      registerRef.current = register;

      register();

      // Setup listeners
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        setNotification(notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        const data = response.notification.request.content.data;

        // Handle different notification types
        if (data.type === 'transaction') {
          console.log('Navigate to transaction:', data.transactionId);
        } else if (data.type === 'promotion') {
          console.log('Navigate to promotions');
        }
      });

    } catch (err) {
      console.warn('⚠️ Push notifications not available:', err.message);
      setIsSupported(false);
      setError('Push notifications require a development build.');
    }

    // Cleanup function - runs when component unmounts
    return () => {
      const Notifications = NotificationsRef.current;
      if (Notifications) {
        try {
          if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
          }
          if (responseListener.current) {
            Notifications.removeNotificationSubscription(responseListener.current);
          }
        } catch (err) {
          console.warn('Cleanup error:', err.message);
        }
      }
    };
  }, []);

  const registerRef = useRef(null);

  const registerForNotifications = async () => {
    if (registerRef.current) {
      await registerRef.current();
    } else {
      console.warn('Register function not yet initialized');
    }
  };

  const value = {
    expoPushToken,
    notification,
    isRegistering,
    error,
    isSupported,
    isSynced,
    registerForNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
