/**
 * API Usage Examples
 * 
 * This file demonstrates how to use the AuthContext and API service
 * in your components.
 */

// ============================================
// Example 1: Using AuthContext in a component
// ============================================

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';

function LoginScreen() {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  
  const handleLogin = async () => {
    const result = await login({
      email: 'hundredkey7@gmail.com',
      password: 'mmmmmmmm'
    });
    
    if (result.success) {
      // Navigate to home screen
      // router.replace('/(tabs)');
    }
  };
  
  return (
    // Your UI here
  );
}

// ============================================
// Example 2: Registration
// ============================================

function SignupScreen() {
  const { register } = useAuth();
  
  const handleRegister = async () => {
    const result = await register({
      name: 'John',
      surname: 'Doe',
      phone: '08012345678',
      email: 'johndoe@example.com',
      password: 'secret123',
      password_confirmation: 'secret123',
      accesspin: '1234',
      refer_by: 'REF12345'
    });
    
    if (result.success) {
      // Navigate to home or verification screen
    }
  };
}

// ============================================
// Example 3: Using Toast notifications
// ============================================

function SomeComponent() {
  const { showToast } = useToast();
  
  const handleAction = () => {
    // Success toast
    showToast('success', 'Operation completed successfully!');
    
    // Error toast
    showToast('error', 'Something went wrong!');
    
    // Warning toast
    showToast('warning', 'Please check your input');
    
    // Info toast (default)
    showToast('info', 'Here is some information');
    
    // Custom duration (default is 3000ms)
    showToast('success', 'This will show for 5 seconds', 5000);
  };
}

// ============================================
// Example 4: Accessing user data
// ============================================

function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <Text>Please login</Text>;
  }
  
  return (
    <View>
      <Text>Name: {user.name} {user.surname}</Text>
      <Text>Email: {user.email}</Text>
      <Text>Phone: {user.phone}</Text>
      <Text>Wallet: ₦{user.wallet}</Text>
      <Text>Cashback: ₦{user.cashback}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}

// ============================================
// Example 5: Making custom API calls
// ============================================

import { get, post } from '@/services/api';
// OR import the default export
// import api from '@/services/api';

async function fetchUserTransactions() {
  try {
    // GET request - using named export
    const transactions = await get('/transactions');
    return transactions;
    
    // OR using default export
    // const transactions = await api.get('/transactions');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function purchaseAirtime(data) {
  try {
    // POST request - using named export
    const result = await post('/buy-airtime', {
      phone: '08012345678',
      amount: 1000,
      network: 'MTN'
    });
    return result;
    
    // OR using default export
    // const result = await api.post('/buy-airtime', {...});
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// Example 6: Protected route check
// ============================================

function ProtectedScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);
  
  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  
  return (
    // Your protected content
  );
}
