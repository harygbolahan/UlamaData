# Push Notifications Implementation Guide

## Overview
This document describes the push notifications implementation for DataBeta using Expo's push notification service.

## Architecture

### Files Structure
```
├── services/
│   └── notification-service.js      # Core notification functions
├── contexts/
│   └── notification-context.jsx     # Notification state management
├── app/
│   ├── _layout.jsx                  # NotificationProvider integration
│   └── (tabs)/
│       └── notifications-test.jsx   # Test screen for notifications
└── app.json                         # Expo config with plugin
```

## Setup Completed

### 1. Libraries Installed
- ✅ `expo-notifications` - Push notification handling
- ✅ `expo-device` - Device type detection
- ✅ `expo-constants` - Project ID access

### 2. Configuration
- ✅ Added `expo-notifications` plugin to app.json
- ✅ Project ID configured: `1a4cbff5-85f4-4374-b079-7fdf15ded29d`

### 3. Services Created
- ✅ `notification-service.js` - Handles registration, sending, and scheduling
- ✅ `notification-context.jsx` - Global state management for notifications

### 4. Integration
- ✅ NotificationProvider added to app root
- ✅ Test screen created for development

## Next Steps (Required)

### Phase 3: Credentials Setup

#### For Android (FCM Setup)
1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project or use existing
   - Add Android app with package: `com.yourname.databeta`

2. **Enable FCM V1 API**
   - In Firebase Console → Project Settings → Cloud Messaging
   - Enable Cloud Messaging API (V1)
   - Download service account JSON

3. **Configure EAS**
   ```bash
   eas credentials
   ```
   - Select Android
   - Choose "Set up FCM V1 credentials"
   - Upload service account JSON

#### For iOS (APNs Setup)
1. **Register Device**
   ```bash
   eas device:create
   ```

2. **Build with Credentials**
   ```bash
   eas build --profile development --platform ios
   ```
   - Answer "yes" to setup push notifications
   - Answer "yes" to generate Apple Push Notification key

### Phase 4: Build & Test

1. **Create Development Build**
   ```bash
   # For Android
   eas build --profile development --platform android

   # For iOS
   eas build --profile development --platform ios
   ```

2. **Install on Physical Device**
   - Download and install the build
   - Launch the app
   - Grant notification permissions

3. **Test Notifications**
   - Navigate to the notifications test screen
   - Copy your Expo Push Token
   - Use the test button or visit https://expo.dev/notifications
   - Send a test notification

## Usage in Your App

### Get Push Token
```javascript
import { useNotification } from '@/contexts/notification-context';

function MyComponent() {
  const { expoPushToken } = useNotification();
  
  // Send token to your backend
  useEffect(() => {
    if (expoPushToken) {
      // TODO: Send to your API
      fetch('YOUR_API/users/push-token', {
        method: 'POST',
        body: JSON.stringify({ token: expoPushToken }),
      });
    }
  }, [expoPushToken]);
}
```

### Send Notification from Backend
```javascript
// Example Node.js backend code
async function sendPushNotification(userToken, title, body, data) {
  const message = {
    to: userToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

// Usage
await sendPushNotification(
  userPushToken,
  'Transaction Complete',
  'Your ₦500 data purchase was successful',
  { 
    type: 'transaction',
    transactionId: '12345',
    amount: 500
  }
);
```

### Handle Notification Tap
Update `contexts/notification-context.jsx`:
```javascript
const handleNotificationResponse = (response) => {
  const data = response.notification.request.content.data;
  
  if (data.type === 'transaction') {
    // Navigate to transaction details
    router.push(`/transaction-details?id=${data.transactionId}`);
  }
};
```

## Notification Types

### Transaction Notifications
```javascript
{
  title: 'Transaction Complete',
  body: 'Your ₦500 data purchase was successful',
  data: {
    type: 'transaction',
    transactionId: '12345',
    amount: 500,
    service: 'data'
  }
}
```

### Promotional Notifications
```javascript
{
  title: 'Special Offer!',
  body: 'Get 20% off on all data bundles today',
  data: {
    type: 'promotion',
    promoCode: 'DATA20',
    expiresAt: '2024-12-31'
  }
}
```

### Payment Reminders
```javascript
{
  title: 'Payment Reminder',
  body: 'Your wallet balance is low. Top up now!',
  data: {
    type: 'reminder',
    action: 'fund_wallet'
  }
}
```

## Testing Checklist

- [ ] Physical device available (Android/iOS)
- [ ] Notification permissions granted
- [ ] Push token generated successfully
- [ ] Test notification received in foreground
- [ ] Test notification received in background
- [ ] Test notification received when app is killed
- [ ] Notification tap opens correct screen
- [ ] Sound and vibration working
- [ ] Badge count updating (iOS)

## Troubleshooting

### No Push Token Generated
- Ensure you're on a physical device (not simulator)
- Check notification permissions in device settings
- Verify project ID in app.json

### Notifications Not Received
- Check FCM/APNs credentials are configured
- Verify push token is valid
- Check device internet connection
- Review Expo push notification status at https://expo.dev/notifications

### iOS Specific Issues
- Ensure Apple Developer account is active
- Verify push notification capability is enabled
- Check provisioning profile includes push notifications

### Android Specific Issues
- Verify FCM V1 API is enabled
- Check service account JSON is valid
- Ensure notification channel is created

## Production Considerations

1. **Store Push Tokens**
   - Save tokens in your database
   - Associate with user accounts
   - Update when tokens change

2. **Handle Token Refresh**
   - Tokens can expire or change
   - Re-register on app updates
   - Sync with backend regularly

3. **Notification Scheduling**
   - Use local notifications for reminders
   - Schedule based on user timezone
   - Respect quiet hours

4. **Analytics**
   - Track notification delivery rates
   - Monitor open rates
   - A/B test notification content

5. **User Preferences**
   - Allow users to opt-out
   - Provide notification settings
   - Respect user choices

## Resources

- [Expo Push Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [FCM Setup Guide](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [APNs Setup Guide](https://docs.expo.dev/push-notifications/push-notifications-setup/)
