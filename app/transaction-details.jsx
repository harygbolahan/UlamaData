import PinPrintModal from '@/components/pin-print-modal';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { useTransactions } from '@/contexts/transactions-context';
import api from '@/services/api';
import { extractElectricityDetails } from '@/services/electricity';
import { generateElectricityReceiptHTML } from '@/services/electricity-receipt';
import { sharePdfFromHtml } from '@/services/share-pdf';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

export default function TransactionDetails() {
    const { colors, fonts, isDark } = useTheme();
    const { fetchTransactionDetails, loading } = useTransactions();
    const { showToast } = useToast();
    const params = useLocalSearchParams();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const [transactionData, setTransactionData] = useState(null);
    const [error, setError] = useState(null);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showPinPrintModal, setShowPinPrintModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [resendModalVisible, setResendModalVisible] = useState(false);
    const [resendStatus, setResendStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [resendMessage, setResendMessage] = useState('');
    const receiptRef = useRef(null);

    useEffect(() => {
        loadTransactionDetails();
    }, [params.transactionRef]);

    const loadTransactionDetails = async () => {
        try {
            const transactionRef = params.transactionRef;
            const transactionDate = params.transactionDate || '';

            if (!transactionRef) {
                setError('Transaction reference not found');
                return;
            }

            const data = await fetchTransactionDetails(transactionRef, transactionDate);
            setTransactionData(data);
        } catch (err) {
            console.error('Error loading transaction details:', err);
            setError(err.message || 'Failed to load transaction details');
        }
    };

    // Map API data to UI format
    const mapTransactionData = (data) => {
        if (!data) return null;

        const serviceName = data.servicename || 'Unknown';
        const provider = data.provider || 'Unknown';
        const amount = parseFloat(data.amount || 0);
        const oldBalance = parseFloat(data.oldbal || 0);
        const newBalance = parseFloat(data.newbal || 0);
        const profit = parseFloat(data.profit || 0);

        // Extract phone number from servicedesc
        const phoneMatch = data.servicedesc?.match(/\d{11}/);
        const phone = phoneMatch ? phoneMatch[0] : 'N/A';

        // Extract plan from servicedesc
        const planMatch = data.servicedesc?.match(/Purchase of (.+?) for/);
        const plan = planMatch ? planMatch[1] : 'N/A';

        // Parse api_response_log for special cases
        let pinData = null;
        let serialData = null;
        let electricityToken = null;
        let allPins = []; // Array to store all PINs
        let logObj = null;

        try {
            if (data.api_response_log) {
                // Check if api_response_log is already an object or needs parsing
                let logData;
                if (typeof data.api_response_log === 'string') {
                    try {
                        logData = JSON.parse(data.api_response_log);
                    } catch (parseErr) {
                        // If parsing fails, it's just a plain string message, skip processing
                        console.log('api_response_log is a plain string, not JSON:', data.api_response_log);
                        logData = null;
                    }
                } else {
                    logData = data.api_response_log;
                }

                logObj = logData;

                if (logData) {
                    // Handle Airtime PIN and Exam PIN (multiple pins)
                    if (logData.pins && Array.isArray(logData.pins) && logData.pins.length > 0) {
                        // Store all pins for printing
                        allPins = logData.pins.map(p => ({
                            pin: p.pin || p.token || '',
                            serial: p.serial || '',
                            ref: data.transref || ''
                        }));

                        // Keep first pin for display
                        const firstPin = logData.pins[0];
                        pinData = firstPin.pin || firstPin.token || null;
                        serialData = firstPin.serial || null;
                    }

                    // Also check direct pin/serial fields
                    if (!pinData && logData.pin) {
                        pinData = logData.pin;
                        if (!allPins.length) {
                            allPins = [{
                                pin: logData.pin,
                                serial: logData.serial || '',
                                ref: data.transref || ''
                            }];
                        }
                    }
                    if (!serialData && logData.serial) {
                        serialData = logData.serial;
                    }

                    // Handle Electricity token (might be in different format)
                    if (serviceName.toLowerCase().includes('electric')) {
                        electricityToken = logData.token || logData.meterToken || null;
                    }
                }
            }
        } catch (err) {
            console.error('Error processing api_response_log:', err);
        }

        // Parse date
        const dateObj = new Date(data.date);
        const date = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const time = dateObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Map status
        let status = 'Processing';
        const tStatusLower = data.tStatus?.toLowerCase();
        const statusCode = String(data.status);

        if (tStatusLower === 'completed' || statusCode === '0') {
            status = 'Completed';
        } else if (tStatusLower === 'refund' || tStatusLower === 'refunded' || statusCode === '3') {
            status = 'Refund';
        } else if (tStatusLower === 'failed' || statusCode === "2") {
            status = 'Failed';
        }

        // Map service to icon and color
        let icon = 'cube';
        let color = '#2196F3';
        let category = 'General Services';

        if (serviceName.toLowerCase().includes('data')) {
            icon = 'wifi';
            color = '#2196F3';
            category = 'Mobile Services';
        } else if (serviceName.toLowerCase().includes('airtime')) {
            icon = 'phone-portrait';
            color = '#4CAF50';
            category = 'Mobile Services';
        } else if (serviceName.toLowerCase().includes('cable') || serviceName.toLowerCase().includes('tv')) {
            icon = 'tv';
            color = '#FF9800';
            category = 'Entertainment';
        } else if (serviceName.toLowerCase().includes('electric')) {
            icon = 'flash';
            color = '#F44336';
            category = 'Utilities';
        } else if (serviceName.toLowerCase().includes('education') || serviceName.toLowerCase().includes('exam')) {
            icon = 'school';
            color = '#9C27B0';
            category = 'Education';
        } else if (serviceName.toLowerCase().includes('pin')) {
            icon = 'card';
            color = '#00BCD4';
            category = 'Vouchers';
        }

        // Electricity details live in api_response_log; `token` is only a display string
        const isElectricity = serviceName.toLowerCase().includes('electric');
        const electricity = isElectricity ? extractElectricityDetails(data) : null;

        // Calculate breakdown
        const vat = amount * 0.075; // 7.5% VAT
        const fee = profit;
        const subtotal = amount - vat - fee;

        return {
            id: data.tId,
            type: serviceName,
            category: category,
            provider: provider,
            amount: `₦${amount.toLocaleString()}`,
            status: status,
            date: date,
            time: time,
            ref: data.transref,
            sessionId: data.tId,
            phone: phone,
            plan: plan,
            validity: '30 Days',
            icon: icon,
            color: color,
            fee: `₦${fee.toFixed(2)}`,
            discount: '₦0.00',
            vat: `₦${vat.toFixed(2)}`,
            subtotal: `₦${subtotal.toFixed(2)}`,
            total: `₦${amount.toLocaleString()}`,
            paymentMethod: 'Wallet Balance',
            walletBalanceBefore: `₦${oldBalance.toLocaleString()}`,
            walletBalanceAfter: `₦${newBalance.toLocaleString()}`,
            description: data.servicedesc || 'N/A',
            beneficiary: electricity?.meterNumber || phone,
            beneficiaryName: 'N/A',
            channel: 'Mobile App',
            deviceInfo: 'Mobile Device',
            ipAddress: 'N/A',
            location: 'Nigeria',
            apiResponse: data.api_response || 'N/A',
            retryCount: 0,
            processingTime: 'N/A',
            // Special fields
            pin: pinData,
            serial: serialData,
            isElectricity,
            electricityToken: electricity?.token || electricityToken,
            units: electricity?.units || null,
            disco: electricity?.disco || null,
            allPins: allPins, // All PINs for printing
            customerAddress: electricity ? electricity.customerAddress : extractAddress(data) || data.customerAddress || data.customer_address || data.address || logObj?.customerAddress || logObj?.customer_address || logObj?.address || null,
            customerName: electricity ? electricity.customerName : data.customerName || data.customer_name || logObj?.customerName || logObj?.customer_name || null,
        };
    };

    const extractAddress = (data) => {
        if (!data) return null;
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return extractAddress(parsed);
            } catch (e) {
                const match = data.match(/(?:^|[^a-z0-9_])(?:customer_?address|address)\s*[:=]\s*["']?([^"'\n\r,}]+)/i);
                if (match && match[1]) {
                    const val = match[1].trim();
                    if (!val.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && !val.includes('@')) {
                        return val;
                    }
                }
                return null;
            }
        }
        if (typeof data === 'object') {
            const addressKeys = ['customerAddress', 'customer_address', 'address', 'Address', 'customer_Address', 'user_address'];
            for (const key of addressKeys) {
                if (data[key] && typeof data[key] === 'string' && data[key].trim().length > 0) {
                    const val = data[key].trim();
                    if (!val.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && !val.includes('@')) {
                        return val;
                    }
                }
            }
            const containerKeys = ['api_response', 'api_response_log', 'data', 'details', 'log', 'response', 'result'];
            for (const key of containerKeys) {
                if (data[key]) {
                    const found = extractAddress(data[key]);
                    if (found) return found;
                }
            }
        }
        return null;
    };

    const transaction = mapTransactionData(transactionData);

    // The print modal fetches PINs by transaction ref, so only the ref and the purchase type matter here
    const isPinPurchase = /(airtime|data).*pin|recharge/i.test(transaction?.type || '');
    const canPrintPins = !!transaction?.ref && transaction?.status !== 'Failed'
        && (isPinPurchase || (transaction.allPins?.length ?? 0) > 0);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleCopy = async (text, label) => {
        await Clipboard.setStringAsync(text);
        showToast('success', `${label} copied to clipboard`);
    };

    const handleShare = () => {
        setShowShareModal(true);
    };

    const handleResend = () => {
        setResendStatus('idle');
        setResendMessage('Are you sure you want to resend this transaction?');
        setResendModalVisible(true);
    };

    const confirmResend = async () => {
        setResendStatus('loading');
        try {
            const refToUse = transaction.ref || transactionData?.transref || transactionData?.transaction_id || transactionData?.reference;
            const response = await api.post('/resend-transaction', {
                transref: refToUse,
                pin: "12345"
            });
            console.log('Resend Response:', response);
            
            const resData = response.data || response;
            const statusStr = (resData.status || resData.Status || '').toLowerCase();
            const isSuccess = statusStr === 'success' || statusStr === 'successful';
            
            setResendStatus(isSuccess ? 'success' : 'error');
            setResendMessage(resData.message || resData.api_response || resData.response || 'Transaction processed.');
        } catch (error) {
            console.error('Error resending transaction:', error);
            setResendStatus('error');
            setResendMessage(error.message || 'Could not resend transaction.');
        }
    };


    const shareAsImage = async () => {
        try {
            setIsDownloading(true);
            setShowShareModal(false);

            // Set capturing state to hide amount and balance
            setIsCapturing(true);

            // Wait for UI to update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture the receipt view as image
            const uri = await captureRef(receiptRef, {
                format: 'png',
                quality: 1,
            });

            // Share the image
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Receipt',
                    UTI: 'public.png',
                });
            }
        } catch (error) {
            console.error('Error sharing as image:', error);
            showToast('error', 'Failed to share receipt as image');
        } finally {
            setIsCapturing(false);
            setIsDownloading(false);
        }
    };

    const shareAsPDF = async () => {
        try {
            setIsDownloading(true);
            setShowShareModal(false);

            // Generate HTML for PDF (reuse the same HTML from downloadAsPDF)
            const html = generateReceiptHTML();

            await sharePdfFromHtml(html, { fileName: `Receipt-${transaction.ref}`, dialogTitle: 'Share Receipt' });
        } catch (error) {
            console.error('Error sharing as PDF:', error);
            showToast('error', 'Failed to share receipt as PDF');
        } finally {
            setIsDownloading(false);
        }
    };



    const handleDownload = () => {
        setShowDownloadModal(true);
    };

    const downloadAsImage = async () => {
        try {
            setIsDownloading(true);
            setShowDownloadModal(false);

            // Set capturing state to hide amount and balance
            setIsCapturing(true);

            // Wait for UI to update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture the receipt view as image
            const uri = await captureRef(receiptRef, {
                format: 'png',
                quality: 1,
            });

            // Share the image directly
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Save Receipt',
                    UTI: 'public.png',
                });
            }

            showToast('success', 'Receipt saved as image');
        } catch (error) {
            console.error('Error downloading as image:', error);
            showToast('error', 'Failed to download receipt as image');
        } finally {
            setIsCapturing(false);
            setIsDownloading(false);
        }
    };

    const generateReceiptHTML = () => {
        if (transaction.isElectricity) {
            return generateElectricityReceiptHTML({
                token: transaction.electricityToken,
                units: transaction.units,
                meterNumber: transaction.beneficiary,
                disco: transaction.disco,
                customerName: transaction.customerName,
                customerAddress: transaction.customerAddress,
                amount: transactionData?.amount,
                reference: transaction.ref,
                date: `${transaction.date} • ${transaction.time}`,
                status: transaction.status,
            }, colors.primary);
        }
        return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            padding: 60px 40px;
                            background: #fff;
                            color: #000;
                        }
                        .receipt {
                            max-width: 600px;
                            margin: 0 auto;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 48px;
                        }
                        .logo {
                            font-size: 32px;
                            font-weight: 700;
                            color: #000;
                            margin-bottom: 8px;
                            letter-spacing: -0.5px;
                        }
                        .subtitle {
                            font-size: 13px;
                            color: #666;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        .status-section {
                            text-align: center;
                            padding: 32px 24px;
                            background: #fafafa;
                            border-radius: 16px;
                            margin-bottom: 40px;
                        }
                        .status-badge {
                            display: inline-block;
                            padding: 6px 16px;
                            background: ${transaction.status === 'Completed' ? '#10B981' : transaction.status === 'Failed' ? '#EF4444' : transaction.status === 'Refund' ? '#2196F3' : '#F59E0B'};
                            color: #fff;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 16px;
                        }
                        .date {
                            font-size: 13px;
                            color: #666;
                        }
                        .divider {
                            height: 1px;
                            background: #e5e5e5;
                            margin: 32px 0;
                        }
                        .info-grid {
                            display: grid;
                            gap: 16px;
                            margin-bottom: 32px;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            padding: 12px 0;
                        }
                        .info-label {
                            font-size: 13px;
                            color: #666;
                            font-weight: 500;
                        }
                        .info-value {
                            font-size: 14px;
                            font-weight: 600;
                            text-align: right;
                            max-width: 60%;
                            word-break: break-word;
                        }
                        .token-section {
                            background: linear-gradient(135deg, ${colors.primary}08 0%, ${colors.primary}15 100%);
                            border: 2px solid ${colors.primary}20;
                            border-radius: 16px;
                            padding: 32px 24px;
                            text-align: center;
                            margin-bottom: 32px;
                        }
                        .token-label {
                            font-size: 12px;
                            color: ${colors.primary};
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            margin-bottom: 12px;
                        }
                        .token-value {
                            font-size: 28px;
                            font-weight: 700;
                            color: ${colors.primary};
                            letter-spacing: 3px;
                            font-family: 'Courier New', monospace;
                        }
                        .token-serial {
                            margin-top: 16px;
                            padding-top: 16px;
                            border-top: 1px solid ${colors.primary}20;
                        }
                        .token-serial-label {
                            font-size: 11px;
                            color: ${colors.primary};
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 6px;
                        }
                        .token-serial-value {
                            font-size: 16px;
                            font-weight: 600;
                            color: ${colors.primary};
                            letter-spacing: 1.5px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 48px;
                            padding-top: 24px;
                            border-top: 1px solid #e5e5e5;
                        }
                        .footer-brand {
                            font-size: 14px;
                            font-weight: 600;
                            color: #000;
                            margin-bottom: 8px;
                        }
                        .footer-note {
                            font-size: 11px;
                            color: #999;
                            line-height: 1.6;
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="header">
                            <div class="logo">UlamaData</div>
                            <div class="subtitle">Transaction Receipt</div>
                        </div>

                        <div class="status-section">
                            <div class="status-badge">${transaction.status}</div>
                            <div class="date">${transaction.date} • ${transaction.time}</div>
                        </div>

                        <div class="info-grid">
                            <div class="info-row">
                                <div class="info-label">Service</div>
                                <div class="info-value">${transaction.type}</div>
                            </div>
                        
                            <div class="info-row">
                                <div class="info-label">Beneficiary</div>
                                <div class="info-value">${transaction.beneficiary}</div>
                            </div>
                            ${transaction.plan !== 'N/A' ? `
                            <div class="info-row">
                                <div class="info-label">Plan</div>
                                <div class="info-value">${transaction.plan}</div>
                            </div>
                            ` : ''}
                            ${transaction.customerName && transaction.customerName !== 'N/A' ? `
                            <div class="info-row">
                                <div class="info-label">Customer Name</div>
                                <div class="info-value">${transaction.customerName}</div>
                            </div>
                            ` : ''}
                            ${transaction.customerAddress && transaction.customerAddress !== 'N/A' ? `
                            <div class="info-row">
                                <div class="info-label">Address</div>
                                <div class="info-value">${transaction.customerAddress}</div>
                            </div>
                            ` : ''}
                            <div class="info-row">
                                <div class="info-label">Reference</div>
                                <div class="info-value">${transaction.ref}</div>
                            </div>
                        </div>

                        ${transactionData?.token && !transaction.isElectricity ? `
                        <div class="divider"></div>
                        <div class="token-section">
                            <div class="token-label">Exam Token</div>
                            <div class="token-value">${transactionData.token}</div>
                        </div>
                        ` : ''}

                        ${transaction.pin ? `
                        <div class="divider"></div>
                        <div class="token-section">
                            <div class="token-label">Airtime PIN</div>
                            <div class="token-value">${transaction.pin}</div>
                            ${transaction.serial ? `
                            <div class="token-serial">
                                <div class="token-serial-label">Serial Number</div>
                                <div class="token-serial-value">${transaction.serial}</div>
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}

                        ${transaction.electricityToken ? `
                        <div class="divider"></div>
                        <div class="token-section" style="background: linear-gradient(135deg, #EF444408 0%, #EF444415 100%); border-color: #EF444420;">
                            <div class="token-label" style="color: #EF4444;">Meter Token</div>
                            <div class="token-value" style="color: #EF4444;">${transaction.electricityToken}</div>
                        </div>
                        ` : ''}

                        <div class="footer">
                            <div class="footer-brand">UlamaData</div>
                            <div class="footer-note">
                                This is a computer-generated receipt.<br>
                                For support, contact us through the app.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;
    };

    const downloadAsPDF = async () => {
        try {
            setIsDownloading(true);
            setShowDownloadModal(false);

            // Generate HTML for PDF
            const html = generateReceiptHTML();

            await sharePdfFromHtml(html, { fileName: `Receipt-${transaction.ref}`, dialogTitle: 'Save Receipt' });

            showToast('success', 'Receipt saved as PDF');
        } catch (error) {
            console.error('Error downloading as PDF:', error);
            showToast('error', 'Failed to download receipt as PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDispute = () => {
        setShowDisputeModal(true);
    };

    const handleContactSupport = () => {
        setShowDisputeModal(false);
        setTimeout(() => {
            router.push('/support');
        }, 300);
    };

    const getStatusColor = () => {
        if (!transaction) return colors.icon;
        switch (transaction.status) {
            case 'Completed': return colors.success;
            case 'Processing': return colors.warning;
            case 'Failed': return colors.error;
            case 'Refund': return '#2196F3'; // Blue for Refund
            default: return colors.icon;
        }
    };

    if (loading || !transaction) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Transaction Details
                    </Text>
                    <View style={styles.shareButton} />
                </View>
                <View style={styles.loadingContainer}>
                    {error ? (
                        <>
                            <View style={[styles.errorIconContainer, { backgroundColor: colors.error + '10' }]}>
                                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                            </View>
                            <Text style={[styles.errorTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Failed to load transaction
                            </Text>
                            <Text style={[styles.errorText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                                onPress={loadTransactionDetails}
                            >
                                <Text style={[styles.retryButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                    Retry
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Loading transaction details...
                            </Text>
                        </>
                    )}
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                    Transaction Details
                </Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Ionicons name="share-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Receipt Container for Screenshot */}
                <View ref={receiptRef} collapsable={false} style={{ backgroundColor: colors.background }}>
                    {/* Status Card */}
                    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={[styles.statusCard, {
                            backgroundColor: isDark ? '#1a1a1a' : '#fff',
                        }]}>
                            <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor() + '15' }]}>
                                <Ionicons
                                    name={transaction.status === 'Completed' ? 'checkmark-circle' : transaction.status === 'Processing' ? 'time' : transaction.status === 'Refund' ? 'refresh-circle' : 'close-circle'}
                                    size={36}
                                    color={getStatusColor()}
                                />
                            </View>
                            <Text style={[styles.statusLabel, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {transaction.status === 'Completed' ? 'Transaction Successful' : transaction.status === 'Processing' ? 'Transaction Processing' : transaction.status === 'Refund' ? 'Transaction Refunded' : 'Transaction Failed'}
                            </Text>
                            {!isCapturing && (
                                <Text style={[styles.statusAmount, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                    {transaction.amount}
                                </Text>
                            )}
                            <Text style={[styles.statusDate, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {transaction.date} • {transaction.time}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Details Section */}
                    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Transaction Details
                        </Text>

                        <View style={[styles.detailCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                            <DetailRow label="Service" value={transaction.type} colors={colors} fonts={fonts} />
                            <DetailRow label="Category" value={transaction.category} colors={colors} fonts={fonts} />
                            <DetailRow label="Description" value={transaction.description} colors={colors} fonts={fonts} multiline />
                            <DetailRow label={transaction.isElectricity ? 'Meter Number' : 'Phone Number'} value={transaction.beneficiary} colors={colors} fonts={fonts} />
                            {transaction.units && (
                                <DetailRow label="Units" value={`${transaction.units} kWh`} colors={colors} fonts={fonts} />
                            )}
                            {transaction.plan !== 'N/A' && (
                                <DetailRow label="Plan" value={transaction.plan} colors={colors} fonts={fonts} />
                            )}
                            {transaction.customerName && transaction.customerName !== 'N/A' && (
                                <DetailRow label="Customer Name" value={transaction.customerName} colors={colors} fonts={fonts} />
                            )}
                            {transaction.customerAddress && transaction.customerAddress !== 'N/A' && (
                                <DetailRow label="Address" value={transaction.customerAddress} colors={colors} fonts={fonts} multiline />
                            )}
                            <DetailRow label="Reference" value={transaction.ref} colors={colors} fonts={fonts} copyable onCopy={() => handleCopy(transaction.ref, 'Reference')} />
                            {/* <DetailRow label="Session ID" value={transaction.sessionId} colors={colors} fonts={fonts} copyable onCopy={() => handleCopy(transaction.sessionId, 'Session ID')} /> */}
                        </View>
                    </Animated.View>

                    {/* Token/PIN Section - Exam Token */}
                    {transactionData?.token && !transaction.isElectricity && (
                        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Exam Token
                            </Text>

                            <View style={[styles.tokenCard, {
                                backgroundColor: colors.primary + '10',
                                borderColor: colors.primary + '30',
                            }]}>
                                <View style={styles.tokenHeader}>
                                    <Ionicons name="key" size={18} color={colors.primary} />
                                    <Text style={[styles.tokenLabel, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                                        Your Token
                                    </Text>
                                </View>
                                <Text style={[styles.tokenValue, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                    {transactionData.token}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.copyTokenButton, { backgroundColor: colors.primary }]}
                                    onPress={() => handleCopy(transactionData.token, 'Token')}
                                >
                                    <Ionicons name="copy-outline" size={18} color="#fff" />
                                    <Text style={[styles.copyTokenText, { fontFamily: fonts.inter.semiBold }]}>
                                        Copy Token
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* PIN/Serial Section - Airtime PIN */}
                    {canPrintPins && (
                        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                            <View style={styles.sectionHeader}>
                                <TouchableOpacity
                                    style={[styles.printBadge, { backgroundColor: colors.primary }]}
                                    onPress={() => setShowPinPrintModal(true)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="print" size={14} color="#fff" />
                                    <Text style={[styles.printBadgeText, { fontFamily: fonts.inter.semiBold }]}>
                                        Print {transaction.allPins?.length > 1 ? `${transaction.allPins.length} PINs` : 'PIN'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* <View style={[styles.tokenCard, { 
                            backgroundColor: '#00BCD4' + '10',
                            borderColor: '#00BCD4' + '30',
                        }]}>
                            <View style={styles.tokenHeader}>
                                <Ionicons name="card" size={18} color="#00BCD4" />
                                <Text style={[styles.tokenLabel, { color: '#00BCD4', fontFamily: fonts.inter.medium }]}>
                                    PIN {transaction.allPins && transaction.allPins.length > 1 ? `(1 of ${transaction.allPins.length})` : ''}
                                </Text>
                            </View>
                            <Text style={[styles.tokenValue, { color: '#00BCD4', fontFamily: fonts.inter.bold }]}>
                                {transaction.pin}
                            </Text>
                            {transaction.serial && (
                                <>
                                    <View style={[styles.serialDivider, { backgroundColor: '#00BCD4' + '20' }]} />
                                    <View style={styles.serialContainer}>
                                        <Text style={[styles.serialLabel, { color: '#00BCD4', fontFamily: fonts.inter.medium }]}>
                                            Serial Number
                                        </Text>
                                        <Text style={[styles.serialValue, { color: '#00BCD4', fontFamily: fonts.inter.semiBold }]}>
                                            {transaction.serial}
                                        </Text>
                                    </View>
                                </>
                            )}
                            <TouchableOpacity 
                                style={[styles.copyTokenButton, { backgroundColor: '#00BCD4' }]}
                                onPress={() => handleCopy(`PIN: ${transaction.pin}\nSerial: ${transaction.serial || 'N/A'}`, 'PIN Details')}
                            >
                                <Ionicons name="copy-outline" size={18} color="#fff" />
                                <Text style={[styles.copyTokenText, { fontFamily: fonts.inter.semiBold }]}>
                                    Copy Details
                                </Text>
                            </TouchableOpacity>
                        </View> */}
                        </Animated.View>
                    )}

                    {/* Electricity Token Section */}
                    {transaction.electricityToken && transaction.electricityToken !== null && transaction.electricityToken !== '' && (
                        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Electricity Token
                            </Text>

                            <View style={[styles.tokenCard, {
                                backgroundColor: '#F44336' + '10',
                                borderColor: '#F44336' + '30',
                            }]}>
                                <View style={styles.tokenHeader}>
                                    <Ionicons name="flash" size={18} color="#F44336" />
                                    <Text style={[styles.tokenLabel, { color: '#F44336', fontFamily: fonts.inter.medium }]}>
                                        Meter Token
                                    </Text>
                                </View>
                                <Text style={[styles.tokenValue, { color: '#F44336', fontFamily: fonts.inter.bold }]}>
                                    {transaction.electricityToken}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.copyTokenButton, { backgroundColor: '#F44336' }]}
                                    onPress={() => handleCopy(transaction.electricityToken, 'Electricity Token')}
                                >
                                    <Ionicons name="copy-outline" size={18} color="#fff" />
                                    <Text style={[styles.copyTokenText, { fontFamily: fonts.inter.semiBold }]}>
                                        Copy Token
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* API Response */}
                    {transaction.apiResponse && transaction.apiResponse !== 'N/A' && (
                        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Response
                            </Text>

                            <View style={[styles.detailCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                                <Text style={[styles.responseText, { color: colors.text, fontFamily: fonts.inter.regular }]}>
                                    {transaction.apiResponse}
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Wallet Balance */}
                    {!isCapturing && (
                        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                Wallet Balance
                            </Text>

                            <View style={[styles.detailCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                                <DetailRow label="Before" value={transaction.walletBalanceBefore} colors={colors} fonts={fonts} />
                                <DetailRow label="After" value={transaction.walletBalanceAfter} colors={colors} fonts={fonts} />
                            </View>
                        </Animated.View>
                    )}

                    {/* Actions */}
                    {!isCapturing && (
                        <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                onPress={handleResend}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={[styles.actionButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                    Resend Transaction
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.actionButtonSecondary, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                                    onPress={handleDownload}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="download-outline" size={20} color={colors.text} />
                                    <Text style={[styles.actionButtonSecondaryText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        Download
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButtonSecondary, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                                    onPress={handleDispute}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="help-circle-outline" size={20} color={colors.text} />
                                    <Text style={[styles.actionButtonSecondaryText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                        Support
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    <View style={{ height: 30 }} />
                </View>
                {/* End Receipt Container */}
            </ScrollView>

            {/* Download Modal */}
            <Modal
                visible={showDownloadModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDownloadModal(false)}
            >
                <View style={modalStyles.overlay}>
                    <View style={[modalStyles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                        <View style={[modalStyles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="download" size={48} color={colors.primary} />
                        </View>

                        <Text style={[modalStyles.title, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Download Receipt
                        </Text>

                        <Text style={[modalStyles.message, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Choose your preferred format to download the receipt
                        </Text>

                        <View style={modalStyles.downloadOptions}>
                            <TouchableOpacity
                                style={[modalStyles.downloadOption, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                onPress={downloadAsImage}
                                activeOpacity={0.7}
                                disabled={isDownloading}
                            >
                                <Ionicons name="image-outline" size={32} color={colors.primary} />
                                <Text style={[modalStyles.downloadOptionText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Image (PNG)
                                </Text>
                                <Text style={[modalStyles.downloadOptionDesc, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Save as image file
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[modalStyles.downloadOption, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                onPress={downloadAsPDF}
                                activeOpacity={0.7}
                                disabled={isDownloading}
                            >
                                <Ionicons name="document-text-outline" size={32} color={colors.error} />
                                <Text style={[modalStyles.downloadOptionText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    PDF Document
                                </Text>
                                <Text style={[modalStyles.downloadOptionDesc, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Save as PDF file
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.cancelButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                            onPress={() => setShowDownloadModal(false)}
                            activeOpacity={0.7}
                            disabled={isDownloading}
                        >
                            <Text style={[modalStyles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Share Modal */}
            <Modal
                visible={showShareModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowShareModal(false)}
            >
                <View style={modalStyles.overlay}>
                    <View style={[modalStyles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                        <View style={[modalStyles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="share-social" size={48} color={colors.primary} />
                        </View>

                        <Text style={[modalStyles.title, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Share Receipt
                        </Text>

                        <Text style={[modalStyles.message, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Choose how you want to share this receipt
                        </Text>

                        <View style={modalStyles.shareOptions}>

                            <TouchableOpacity
                                style={[modalStyles.shareOption, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                onPress={shareAsImage}
                                activeOpacity={0.7}
                                disabled={isDownloading}
                            >
                                <Ionicons name="image-outline" size={28} color={colors.primary} />
                                <Text style={[modalStyles.shareOptionText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    Image
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[modalStyles.shareOption, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                onPress={shareAsPDF}
                                activeOpacity={0.7}
                                disabled={isDownloading}
                            >
                                <Ionicons name="document-text-outline" size={28} color={colors.error} />
                                <Text style={[modalStyles.shareOptionText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    PDF
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.cancelButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                            onPress={() => setShowShareModal(false)}
                            activeOpacity={0.7}
                            disabled={isDownloading}
                        >
                            <Text style={[modalStyles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Resend Modal */}
            <Modal
                visible={resendModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (resendStatus !== 'loading') {
                        setResendModalVisible(false);
                    }
                }}
            >
                <View style={modalStyles.overlay}>
                    <View style={[modalStyles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                        {resendStatus === 'loading' ? (
                            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[modalStyles.message, { color: colors.text, fontFamily: fonts.inter.medium, marginTop: 16 }]}>
                                    Resending transaction...
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={[
                                    modalStyles.iconContainer, 
                                    { 
                                        backgroundColor: resendStatus === 'success' 
                                            ? (colors.success || '#10B981') + '15' 
                                            : resendStatus === 'error' 
                                                ? colors.error + '15' 
                                                : colors.primary + '15' 
                                    }
                                ]}>
                                    <Ionicons 
                                        name={
                                            resendStatus === 'success' 
                                                ? "checkmark-circle" 
                                                : resendStatus === 'error' 
                                                    ? "alert-circle" 
                                                    : "refresh"
                                        } 
                                        size={48} 
                                        color={
                                            resendStatus === 'success' 
                                                ? (colors.success || '#10B981') 
                                                : resendStatus === 'error' 
                                                    ? colors.error 
                                                    : colors.primary
                                        } 
                                    />
                                </View>

                                <Text style={[modalStyles.title, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    {
                                        resendStatus === 'success' 
                                            ? "Success" 
                                            : resendStatus === 'error' 
                                                ? "Transaction Failed" 
                                                : "Resend Transaction"
                                    }
                                </Text>

                                <Text style={[modalStyles.message, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    {resendMessage}
                                </Text>

                                {resendStatus === 'idle' ? (
                                    <View style={modalStyles.buttonContainer}>
                                        <TouchableOpacity
                                            style={[modalStyles.button, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                            onPress={() => setResendModalVisible(false)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[modalStyles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                                Cancel
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[modalStyles.button, { backgroundColor: colors.primary }]}
                                            onPress={confirmResend}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[modalStyles.cancelButtonText, { color: '#fff', fontFamily: fonts.inter.medium }]}>
                                                Resend
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[modalStyles.button, { backgroundColor: colors.primary, width: '100%' }]}
                                        onPress={() => setResendModalVisible(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[modalStyles.cancelButtonText, { color: '#fff', fontFamily: fonts.inter.medium }]}>
                                            Close
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* PIN Print Modal */}
            {canPrintPins && (
                <PinPrintModal
                    visible={showPinPrintModal}
                    onClose={() => setShowPinPrintModal(false)}
                    pinRef={transaction.ref}
                    provider={transaction.provider}
                    serviceName={transaction.type}
                    amount={transaction.amount}
                />
            )}

            {/* Dispute Modal */}
            <Modal
                visible={showDisputeModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDisputeModal(false)}
            >
                <View style={modalStyles.overlay}>
                    <View style={[modalStyles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                        <View style={[modalStyles.iconContainer, { backgroundColor: colors.warning + '15' }]}>
                            <Ionicons name="help-circle" size={48} color={colors.warning} />
                        </View>

                        <Text style={[modalStyles.title, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Dispute Transaction
                        </Text>

                        <Text style={[modalStyles.message, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Need help with this transaction? Contact our support team and we'll assist you right away.
                        </Text>

                        <View style={modalStyles.buttonContainer}>
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.cancelButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                onPress={() => setShowDisputeModal(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={[modalStyles.cancelButtonText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.confirmButton, { backgroundColor: colors.primary }]}
                                onPress={handleContactSupport}
                                activeOpacity={0.7}
                            >
                                <Text style={[modalStyles.confirmButtonText, { fontFamily: fonts.inter.semiBold }]}>
                                    Contact Support
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Helper Components
const DetailRow = ({ label, value, colors, fonts, copyable, onCopy, multiline }) => (
    <View style={[detailRowStyles.container, multiline && detailRowStyles.containerMultiline]}>
        <Text style={[detailRowStyles.label, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
            {label}
        </Text>
        <View style={[detailRowStyles.valueContainer, multiline && detailRowStyles.valueContainerMultiline]}>
            <Text
                style={[
                    detailRowStyles.value,
                    { color: colors.text, fontFamily: fonts.inter.medium },
                    multiline && detailRowStyles.valueMultiline
                ]}
                numberOfLines={multiline ? undefined : 1}
            >
                {value}
            </Text>
            {copyable && (
                <TouchableOpacity onPress={onCopy} style={detailRowStyles.copyButton}>
                    <Ionicons name="copy-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
            )}
        </View>
    </View>
);

const detailRowStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    containerMultiline: {
        alignItems: 'flex-start',
    },
    label: {
        fontSize: 14,
        flex: 0.4,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 0.6,
        justifyContent: 'flex-end',
    },
    valueContainerMultiline: {
        alignItems: 'flex-start',
    },
    value: {
        fontSize: 14,
        textAlign: 'right',
    },
    valueMultiline: {
        textAlign: 'right',
        lineHeight: 20,
    },
    copyButton: {
        padding: 4,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        flex: 1,
        textAlign: 'center',
    },
    shareButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    statusCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    statusIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statusLabel: {
        fontSize: 14,
        marginBottom: 6,
    },
    statusAmount: {
        fontSize: 28,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    statusDate: {
        fontSize: 12,
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 15,
        marginBottom: 10,
    },
    printBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
    },
    printBadgeText: {
        color: '#fff',
        fontSize: 12,
    },
    detailCard: {
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    actionsContainer: {
        paddingHorizontal: 20,
        marginTop: 0,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButtonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionButtonSecondaryText: {
        fontSize: 13,
    },
    responseText: {
        fontSize: 12,
        lineHeight: 18,
        padding: 12,
    },
    tokenCard: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    tokenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    tokenLabel: {
        fontSize: 14,
    },
    tokenValue: {
        fontSize: 24,
        letterSpacing: 2,
        marginBottom: 12,
    },
    tokenActions: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    copyTokenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    copyTokenText: {
        color: '#fff',
        fontSize: 13,
    },
    serialDivider: {
        height: 1,
        width: '100%',
        marginVertical: 10,
    },
    serialContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    serialLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    serialValue: {
        fontSize: 14,
        letterSpacing: 1.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
    },
    errorIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 15,
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    downloadOptions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 16,
    },
    downloadOption: {
        flex: 1,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadOptionText: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    downloadOptionDesc: {
        fontSize: 11,
        marginTop: 4,
        textAlign: 'center',
    },
    shareOptions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 16,
    },
    shareOption: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareOptionText: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        // backgroundColor set dynamically
    },
    confirmButton: {
        // backgroundColor set dynamically
    },
    cancelButtonText: {
        fontSize: 15,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 15,
    },
});
