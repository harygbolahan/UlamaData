import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_PIN_KEY = 'transaction_pin_biometric';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_LOGIN_ENABLED_KEY = 'biometric_login_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';
const PIN_LOGIN_ENABLED_KEY = 'pin_login_enabled';
const PIN_LOGIN_KEY = 'pin_login';

/**
 * Biometric Service
 * Handles secure PIN storage and biometric authentication
 */

/**
 * Check if device supports biometric authentication
 */
export const isBiometricAvailable = async () => {
    try {
        // Check if LocalAuthentication module is available
        if (!LocalAuthentication || !LocalAuthentication.hasHardwareAsync) {
            console.warn('LocalAuthentication module not available');
            return false;
        }
        
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    } catch (error) {
        console.error('Error checking biometric availability:', error);
        return false;
    }
};

/**
 * Get supported biometric types
 */
export const getSupportedBiometrics = async () => {
    try {
        if (!LocalAuthentication || !LocalAuthentication.supportedAuthenticationTypesAsync) {
            return [];
        }
        
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        return types;
    } catch (error) {
        console.error('Error getting biometric types:', error);
        return [];
    }
};

/**
 * Check if biometric authentication is enabled for transactions
 */
export const isBiometricEnabled = async () => {
    try {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        return enabled === 'true';
    } catch (error) {
        console.error('Error checking biometric enabled status:', error);
        return false;
    }
};

/**
 * Enable biometric authentication and store PIN securely
 * @param {string} pin - The transaction PIN to store
 */
export const enableBiometric = async (pin) => {
    try {
        // First verify biometric is available
        const available = await isBiometricAvailable();
        if (!available) {
            throw new Error('Biometric authentication is not available on this device');
        }

        // Authenticate user before storing PIN
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to enable biometric for transactions',
            fallbackLabel: 'Cancel',
            disableDeviceFallback: true,
        });

        if (!result.success) {
            throw new Error('Biometric authentication failed');
        }

        // Store PIN securely
        await SecureStore.setItemAsync(BIOMETRIC_PIN_KEY, pin);
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

        return { success: true };
    } catch (error) {
        console.error('Error enabling biometric:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Disable biometric authentication and remove stored PIN
 */
export const disableBiometric = async () => {
    try {
        await SecureStore.deleteItemAsync(BIOMETRIC_PIN_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        return { success: true };
    } catch (error) {
        console.error('Error disabling biometric:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Authenticate with biometric and retrieve stored PIN
 * @returns {Object} { success: boolean, pin?: string, error?: string }
 */
export const authenticateWithBiometric = async () => {
    try {
        // Check if biometric is enabled
        const enabled = await isBiometricEnabled();
        if (!enabled) {
            return { success: false, error: 'Biometric authentication is not enabled' };
        }

        // Check if biometric is available
        const available = await isBiometricAvailable();
        if (!available) {
            return { success: false, error: 'Biometric authentication is not available' };
        }

        // Authenticate user
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to complete transaction',
            fallbackLabel: 'Use PIN instead',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (!result.success) {
            if (result.error === 'user_cancel') {
                return { success: false, error: 'Authentication cancelled', cancelled: true };
            } else if (result.error === 'user_fallback') {
                return { success: false, error: 'User chose PIN', useFallback: true };
            }
            return { success: false, error: 'Authentication failed' };
        }

        // Retrieve stored PIN
        const pin = await SecureStore.getItemAsync(BIOMETRIC_PIN_KEY);
        if (!pin) {
            return { success: false, error: 'No PIN stored. Please set up biometric authentication again.' };
        }

        return { success: true, pin };
    } catch (error) {
        console.error('Error authenticating with biometric:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update stored PIN (when user changes their PIN)
 * @param {string} newPin - The new PIN to store
 */
export const updateStoredPin = async (newPin) => {
    try {
        const enabled = await isBiometricEnabled();
        if (enabled) {
            await SecureStore.setItemAsync(BIOMETRIC_PIN_KEY, newPin);
        }
        return { success: true };
    } catch (error) {
        console.error('Error updating stored PIN:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if biometric login is enabled
 */
export const isBiometricLoginEnabled = async () => {
    try {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_LOGIN_ENABLED_KEY);
        return enabled === 'true';
    } catch (error) {
        console.error('Error checking biometric login status:', error);
        return false;
    }
};

/**
 * Enable biometric login and store credentials securely
 * @param {string} email - User email
 * @param {string} password - User password
 */
export const enableBiometricLogin = async (email, password) => {
    try {
        // First verify biometric is available
        const available = await isBiometricAvailable();
        if (!available) {
            throw new Error('Biometric authentication is not available on this device');
        }

        // Authenticate user before storing credentials
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to enable biometric login',
            fallbackLabel: 'Cancel',
            disableDeviceFallback: true,
        });

        if (!result.success) {
            throw new Error('Biometric authentication failed');
        }

        // Store credentials securely
        await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
        await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
        await SecureStore.setItemAsync(BIOMETRIC_LOGIN_ENABLED_KEY, 'true');

        return { success: true };
    } catch (error) {
        console.error('Error enabling biometric login:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Disable biometric login and remove stored credentials
 */
export const disableBiometricLogin = async () => {
    try {
        await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_LOGIN_ENABLED_KEY);
        return { success: true };
    } catch (error) {
        console.error('Error disabling biometric login:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Authenticate with biometric and retrieve stored login credentials
 * @returns {Object} { success: boolean, email?: string, password?: string, error?: string }
 */
export const authenticateForLogin = async () => {
    try {
        // Check if biometric login is enabled
        const enabled = await isBiometricLoginEnabled();
        if (!enabled) {
            return { success: false, error: 'Biometric login is not enabled' };
        }

        // Check if biometric is available
        const available = await isBiometricAvailable();
        if (!available) {
            return { success: false, error: 'Biometric authentication is not available' };
        }

        // Authenticate user
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to login',
            fallbackLabel: 'Use password instead',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (!result.success) {
            if (result.error === 'user_cancel') {
                return { success: false, error: 'Authentication cancelled', cancelled: true };
            } else if (result.error === 'user_fallback') {
                return { success: false, error: 'User chose password', useFallback: true };
            }
            return { success: false, error: 'Authentication failed' };
        }

        // Retrieve stored credentials
        const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
        const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
        
        if (!email || !password) {
            return { success: false, error: 'No credentials stored. Please set up biometric login again.' };
        }

        return { success: true, email, password };
    } catch (error) {
        console.error('Error authenticating for login:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if PIN login is enabled
 */
export const isPinLoginEnabled = async () => {
    try {
        const enabled = await SecureStore.getItemAsync(PIN_LOGIN_ENABLED_KEY);
        return enabled === 'true';
    } catch (error) {
        console.error('Error checking PIN login status:', error);
        return false;
    }
};

/**
 * Enable PIN login and store PIN securely
 * @param {string} pin - 5-digit PIN
 */
export const enablePinLogin = async (pin) => {
    try {
        if (!pin || pin.length !== 5) {
            throw new Error('PIN must be 5 digits');
        }

        // Store PIN securely
        await SecureStore.setItemAsync(PIN_LOGIN_KEY, pin);
        await SecureStore.setItemAsync(PIN_LOGIN_ENABLED_KEY, 'true');

        return { success: true };
    } catch (error) {
        console.error('Error enabling PIN login:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Disable PIN login and remove stored PIN
 */
export const disablePinLogin = async () => {
    try {
        await SecureStore.deleteItemAsync(PIN_LOGIN_KEY);
        await SecureStore.deleteItemAsync(PIN_LOGIN_ENABLED_KEY);
        return { success: true };
    } catch (error) {
        console.error('Error disabling PIN login:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify PIN for login
 * @param {string} pin - PIN to verify
 * @returns {Object} { success: boolean, error?: string }
 */
export const verifyPinForLogin = async (pin) => {
    try {
        const enabled = await isPinLoginEnabled();
        if (!enabled) {
            return { success: false, error: 'PIN login is not enabled' };
        }

        const storedPin = await SecureStore.getItemAsync(PIN_LOGIN_KEY);
        if (!storedPin) {
            return { success: false, error: 'No PIN stored. Please set up PIN login again.' };
        }

        if (pin === storedPin) {
            return { success: true };
        } else {
            return { success: false, error: 'Incorrect PIN' };
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        return { success: false, error: error.message };
    }
};

export default {
    isBiometricAvailable,
    getSupportedBiometrics,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    updateStoredPin,
    isBiometricLoginEnabled,
    enableBiometricLogin,
    disableBiometricLogin,
    authenticateForLogin,
    isPinLoginEnabled,
    enablePinLogin,
    disablePinLogin,
    verifyPinForLogin,
};
