import * as SecureStore from 'expo-secure-store';

// SIM transfer PINs for airtime-to-cash, remembered per sender number so the user enters each only once.
// SecureStore keys may only contain letters, digits, ".", "-" and "_".
const keyFor = (phoneNumber) => `swap_transfer_pin_${String(phoneNumber).replace(/\D/g, '')}`;

export const getSavedTransferPin = async (phoneNumber) => {
  try {
    return (await SecureStore.getItemAsync(keyFor(phoneNumber))) || null;
  } catch (error) {
    return null;
  }
};

export const saveTransferPin = async (phoneNumber, pin) => {
  try {
    await SecureStore.setItemAsync(keyFor(phoneNumber), String(pin));
  } catch (error) {
    // Not being able to remember the PIN must never block the swap
  }
};

export const forgetTransferPin = async (phoneNumber) => {
  try {
    await SecureStore.deleteItemAsync(keyFor(phoneNumber));
  } catch (error) {
    // nothing to clean up
  }
};
