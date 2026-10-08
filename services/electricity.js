// Helpers for electricity purchases. The backend is inconsistent about where it puts the
// meter details: the real values live in `api_response_log` (a JSON string such as
// {"token":"…","unit":"19.4","name":"…","address":"…"}), while `token` is a display string
// like "Token : 1975-7078-1720-9922-0412 (Unit 8.9)" and `api_response` is a status message.

const STATUS_MESSAGE = /^(transaction\s+)?(successful|success|completed|failed|pending|processing)\.?$/i;

const clean = (value) => {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    return str && str.toLowerCase() !== 'n/a' && str.toLowerCase() !== 'null' ? str : null;
};

// The address field has been seen carrying "TRANSACTION SUCCESSFUL"; never show that as an address
export const isRealAddress = (value) => {
    const str = clean(value);
    return !!str && !STATUS_MESSAGE.test(str);
};

export const parseResponseLog = (log) => {
    if (!log) return null;
    if (typeof log === 'object') return log;
    try {
        const parsed = JSON.parse(log);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

// "Token : 1975-7078-1720-9922-0412 (Unit 8.9)" -> { token: '1975-7078-1720-9922-0412', units: '8.9' }
export const splitTokenString = (raw) => {
    const str = clean(raw);
    if (!str) return { token: null, units: null };
    const unitMatch = str.match(/\(\s*units?\s*:?\s*([^)]*)\)/i);
    const token = str
        .replace(/\(\s*units?[^)]*\)/i, '')
        .replace(/^\s*(meter\s*)?token\s*:?\s*/i, '')
        .trim();
    return { token: token || null, units: clean(unitMatch?.[1]) };
};

// Group a 20-digit token as 1975-7078-1720-9922-0412 for readability
export const formatToken = (token) => {
    const str = clean(token);
    if (!str) return null;
    const digits = str.replace(/[\s-]/g, '');
    return /^\d{12,}$/.test(digits) ? digits.match(/.{1,4}/g).join('-') : str;
};

/**
 * Pull token, units, customer name and address from any electricity payload
 * (purchase response or transaction details). Explicit fallbacks (e.g. values from
 * meter validation) are used only when the payload has nothing better.
 */
export const extractElectricityDetails = (payload, fallbacks = {}) => {
    const data = payload || {};
    const log = parseResponseLog(data.api_response_log) || parseResponseLog(data.api_response) || {};
    const fromTokenString = splitTokenString(data.token);

    const token = formatToken(log.token || log.meterToken || log.Token || fromTokenString.token || fallbacks.token);
    const units = clean(log.unit || log.units || log.Units || data.units || fromTokenString.units || fallbacks.units);

    const name = [log.name, log.customerName, log.customer_name, data.customerName, data.customer_name, data.name, fallbacks.customerName]
        .map(clean)
        .find(Boolean) || null;

    const address = [log.address, log.customerAddress, log.customer_address, data.customerAddress, data.customer_address, data.address, fallbacks.customerAddress]
        .find(isRealAddress) || null;

    // "Purchase of N2000 Ibadan Electric electricity token for meter number 0232210170345"
    const desc = data.servicedesc || '';
    const meterNumber = clean(data.meter_number || data.meterNumber || desc.match(/meter\s*(?:number|no\.?)?\s*:?\s*(\d{6,})/i)?.[1] || fallbacks.meterNumber);
    const disco = clean(data.disco_name || data.discoName || desc.match(/N[\d,.]+\s+(.+?)\s+electricity/i)?.[1] || fallbacks.disco);

    return { token, units, customerName: name ? name.trim() : null, customerAddress: address ? address.trim() : null, meterNumber, disco };
};
