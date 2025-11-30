# Notification Integration Examples

## Integrating Notifications with Existing Features

### 1. Transaction Notifications

Update your payment/transaction logic to send notifications:

```javascript
// In your payment-context.jsx or transaction handler

import { useNotification } from '@/contexts/notification-context';

// After successful transaction
const handleTransactionComplete = async (transactionData) => {
  const { expoPushToken } = useNotification();
  
  // Save transaction to database
  await saveTransaction(transactionData);
  
  // Send push token to backend with transaction
  if (expoPushToken) {
    await fetch('YOUR_API/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...transactionData,
        pushToken: expoPushToken,
      }),
    });
  }
  
  // Backend will send notification after processing
};
```

### 2. Backend Notification Service (Node.js Example)

```javascript
// backend/services/notification-service.js

const sendTransactionNotification = async (userId, transaction) => {
  // Get user's push token from database
  const user = await User.findById(userId);
  
  if (!user.pushToken) return;
  
  const message = {
    to: user.pushToken,
    sound: 'default',
    title: 'Transaction Successful',
    body: `Your ${transaction.service} purchase of ₦${transaction.amount} was successful`,
    data: {
      type: 'transaction',
      transactionId: transaction.id,
      amount: transaction.amount,
      service: transaction.service,
      timestamp: new Date().toISOString(),
    },
  };
  
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    console.log('Notification sent:', result);
    
    // Log notification in database
    await NotificationLog.create({
      userId,
      type: 'transaction',
      status: result.status,
      sentAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

// Usage in your transaction endpoint
app.post('/api/transactions', async (req, res) => {
  const transaction = await processTransaction(req.body);
  
  // Send notification asynchronously
  sendTransactionNotification(req.user.id, transaction).catch(console.error);
  
  res.json({ success: true, transaction });
});
```

### 3. Wallet Top-up Notifications

```javascript
// When user funds wallet
const handleWalletTopup = async (amount) => {
  // Process payment
  const result = await processPayment(amount);
  
  if (result.success) {
    // Backend sends notification
    await fetch('YOUR_API/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        pushToken: expoPushToken,
      }),
    });
  }
};

// Backend notification
const sendWalletTopupNotification = async (userId, amount) => {
  const user = await User.findById(userId);
  
  const message = {
    to: user.pushToken,
    title: 'Wallet Funded',
    body: `₦${amount} has been added to your wallet`,
    data: {
      type: 'wallet',
      action: 'topup',
      amount,
    },
  };
  
  await sendPushNotification(message);
};
```

### 4. Low Balance Reminders

```javascript
// Backend cron job (runs daily)
const sendLowBalanceReminders = async () => {
  const usersWithLowBalance = await User.find({
    balance: { $lt: 500 }, // Less than ₦500
    pushToken: { $exists: true },
  });
  
  for (const user of usersWithLowBalance) {
    const message = {
      to: user.pushToken,
      title: 'Low Wallet Balance',
      body: 'Your wallet balance is low. Top up now to continue enjoying our services!',
      data: {
        type: 'reminder',
        action: 'fund_wallet',
        currentBalance: user.balance,
      },
    };
    
    await sendPushNotification(message);
  }
};
```

### 5. Promotional Notifications

```javascript
// Backend - Send to all users or specific segments
const sendPromotionalNotification = async (promotion) => {
  const users = await User.find({
    pushToken: { $exists: true },
    notificationsEnabled: true,
  });
  
  const messages = users.map(user => ({
    to: user.pushToken,
    title: promotion.title,
    body: promotion.message,
    data: {
      type: 'promotion',
      promoCode: promotion.code,
      discount: promotion.discount,
      expiresAt: promotion.expiresAt,
    },
  }));
  
  // Send in batches (Expo recommends max 100 per request)
  const batches = chunkArray(messages, 100);
  
  for (const batch of batches) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });
  }
};
```

### 6. Handling Notification Taps

Update `contexts/notification-context.jsx`:

```javascript
import { useRouter } from 'expo-router';

const handleNotificationResponse = (response) => {
  const router = useRouter();
  const data = response.notification.request.content.data;
  
  switch (data.type) {
    case 'transaction':
      // Navigate to transaction details
      router.push({
        pathname: '/transaction-details',
        params: { id: data.transactionId }
      });
      break;
      
    case 'wallet':
      // Navigate to wallet screen
      router.push('/(tabs)/wallet');
      break;
      
    case 'promotion':
      // Navigate to services with promo code
      router.push({
        pathname: '/(tabs)/services',
        params: { promoCode: data.promoCode }
      });
      break;
      
    case 'reminder':
      if (data.action === 'fund_wallet') {
        router.push('/fund-wallet');
      }
      break;
      
    default:
      // Navigate to home
      router.push('/(tabs)');
  }
};
```

### 7. User Notification Preferences

```javascript
// Add to user settings screen
import { useNotification } from '@/contexts/notification-context';

const NotificationSettings = () => {
  const { expoPushToken } = useNotification();
  const [preferences, setPreferences] = useState({
    transactions: true,
    promotions: true,
    reminders: true,
  });
  
  const updatePreferences = async (newPreferences) => {
    setPreferences(newPreferences);
    
    // Save to backend
    await fetch('YOUR_API/users/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify({
        pushToken: expoPushToken,
        preferences: newPreferences,
      }),
    });
  };
  
  return (
    <View>
      <Switch
        value={preferences.transactions}
        onValueChange={(value) => 
          updatePreferences({ ...preferences, transactions: value })
        }
      />
      {/* Add more switches for other notification types */}
    </View>
  );
};
```

### 8. Scheduled Local Notifications

```javascript
import { scheduleLocalNotification } from '@/services/notification-service';

// Schedule a reminder for pending transaction
const scheduleTransactionReminder = async (transactionId) => {
  await scheduleLocalNotification(
    {
      title: 'Transaction Pending',
      body: 'You have a pending transaction. Complete it now!',
      data: { type: 'transaction', transactionId },
    },
    {
      seconds: 3600, // 1 hour from now
    }
  );
};

// Schedule daily reminder
const scheduleDailyReminder = async () => {
  await scheduleLocalNotification(
    {
      title: 'Check Your Deals',
      body: 'New data bundles available today!',
      data: { type: 'daily_reminder' },
    },
    {
      hour: 9, // 9 AM
      minute: 0,
      repeats: true,
    }
  );
};
```

## Database Schema Examples

### User Model (MongoDB)
```javascript
const userSchema = new Schema({
  name: String,
  email: String,
  phone: String,
  pushToken: String, // Expo Push Token
  notificationsEnabled: { type: Boolean, default: true },
  notificationPreferences: {
    transactions: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
  },
  lastTokenUpdate: Date,
});
```

### Notification Log Model
```javascript
const notificationLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  type: String, // 'transaction', 'promotion', 'reminder'
  title: String,
  body: String,
  data: Object,
  status: String, // 'sent', 'failed', 'delivered', 'opened'
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
});
```

## Testing Your Integration

1. **Test Transaction Flow**
   - Make a test purchase
   - Verify notification is received
   - Tap notification and verify navigation

2. **Test Wallet Top-up**
   - Fund wallet
   - Check notification arrives
   - Verify amount is correct

3. **Test Promotional Notifications**
   - Send from backend
   - Verify all users receive
   - Check promo code works

4. **Test Notification Preferences**
   - Disable transaction notifications
   - Make a purchase
   - Verify no notification received

## Best Practices

1. **Always check for push token before sending**
2. **Handle notification failures gracefully**
3. **Log all notifications for debugging**
4. **Respect user preferences**
5. **Test on both Android and iOS**
6. **Use meaningful notification data**
7. **Keep notification content concise**
8. **Test different app states (foreground, background, killed)**
