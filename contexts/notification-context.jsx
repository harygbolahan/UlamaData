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
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('Push notifications require a development build. Run: eas build --profile development');
  const [isSupported, setIsSupported] = useState(false);

  const notificationListener = useRef();
  const responseListener = useRef();
  const NotificationsRef = useRef(null); // Store reference for cleanup

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
        setIsRegistering(true);
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setExpoPushToken(token);
            console.log('✅ Push token registered:', token);
          } else {
            setError('Failed to get push token');
          }
        } catch (err) {
          console.error('Error registering for notifications:', err);
          setError(err.message);
        } finally {
          setIsRegistering(false);
        }
      };

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
      console.warn('📱 Create a development build to enable notifications: eas build --profile development');
      setIsSupported(false);
      setError('Push notifications require a development build. Run: eas build --profile development');
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
          // Silently fail if cleanup errors occur
          console.warn('Cleanup error:', err.message);
        }
      }
    };
  }, []);

  const registerForNotifications = async () => {
    console.warn('Notifications not available in Expo Go. Create a development build.');
  };

  const value = {
    expoPushToken,
    notification,
    isRegistering,
    error,
    isSupported,
    registerForNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
