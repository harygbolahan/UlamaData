// Nigerian mobile network detection from the phone number prefix.

const NETWORK_PREFIXES = {
  MTN: ['0702', '0703', '0704', '0706', '0707', '0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916'],
  AIRTEL: ['0701', '0708', '0802', '0808', '0812', '0901', '0902', '0904', '0907', '0911', '0912'],
  GLO: ['0705', '0805', '0807', '0811', '0815', '0905', '0915'],
  '9MOBILE': ['0809', '0817', '0818', '0908', '0909'],
};

// Accepts "0803...", "803...", "234803..." or "+234803..." and returns the local "0803..." form.
const toLocalDigits = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  if (digits.startsWith('234')) return '0' + digits.substring(3);
  if (digits.length > 0 && !digits.startsWith('0')) return '0' + digits;
  return digits;
};

// Returns 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE', or 'UNKNOWN' when the prefix is not recognised.
export const detectNetwork = (phoneNumber) => {
  const prefix = toLocalDigits(phoneNumber).substring(0, 4);
  if (prefix.length < 4) return 'UNKNOWN';
  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return network;
  }
  return 'UNKNOWN';
};
