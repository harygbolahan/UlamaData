import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The backend binds each account to a device signature: "vicom_" + hash of a persistent hardware ID.
const SIGNATURE_PREFIX = 'vicom_';
const FALLBACK_ID_KEY = 'device_fallback_id';

let cachedSignature = null;

const getHardwareId = async () => {
  try {
    if (Platform.OS === 'android') return Application.getAndroidId();
    if (Platform.OS === 'ios') return await Application.getIosIdForVendorAsync();
  } catch (error) {
    // fall through to the stored fallback
  }
  return null;
};

// Used only when the OS gives no hardware ID. Stays stable until the app data is cleared.
const getFallbackId = async () => {
  try {
    let id = await SecureStore.getItemAsync(FALLBACK_ID_KEY);
    if (!id) {
      id = Crypto.randomUUID();
      await SecureStore.setItemAsync(FALLBACK_ID_KEY, id);
    }
    return id;
  } catch (error) {
    return Crypto.randomUUID();
  }
};

export const getDeviceSignature = async () => {
  if (cachedSignature) return cachedSignature;
  const rawId = (await getHardwareId()) || (await getFallbackId());
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${Platform.OS}:${rawId}`);
  cachedSignature = `${SIGNATURE_PREFIX}${hash.substring(0, 32)}`;
  return cachedSignature;
};

// Friendly name the backend stores next to the signature, e.g. "Samsung SM-A546B".
export const getDeviceInfo = () => {
  const name = [Device.brand, Device.modelName].filter(Boolean).join(' ');
  return name || Platform.OS;
};
