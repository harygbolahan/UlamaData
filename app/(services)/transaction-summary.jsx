import BiometricSetupModal from '@/components/services/BiometricSetupModal';
import SaveBeneficiaryModal from '@/components/services/SaveBeneficiaryModal';
import TransactionPinModal from '@/components/services/TransactionPinModal';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/contexts/auth-context';
import { useBeneficiaries } from '@/contexts/beneficiary-context';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { authenticateWithBiometric, isBiometricAvailable, isBiometricEnabled } from '@/services/biometric';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionSummaryScreen() {
    const params = useLocalSearchParams();
    const { colors, fonts, isDark } = useTheme();
    const { purchaseData, purchaseAirtime, purchaseCable, purchaseElectricity, purchaseExam, purchaseBulkSMS, purchaseDataPin, purchaseAirtimePin, purchaseBulkData, purchaseBulkAirtime, scheduleDataPurchase, scheduleAirtimePurchase } = useServices();
    const { showToast } = useToast();
    const { user, updateUser, refreshUser } = useAuth();
    const { addBeneficiary } = useBeneficiaries();
    const [useCashback, setUseCashback] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showBiometricSetup, setShowBiometricSetup] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [showSaveBeneficiaryModal, setShowSaveBeneficiaryModal] = useState(false);

    const {
        service = 'Data Subscription',
        serviceType,
        beneficiary = '08038295877',
        amount = '400',
        bonus = '0.50%',
        network ,
        planSize,
        validity,
        meterType,
        provider,
        providerId,
        planId,
        planName,
        planType,
        networkId,
        airtimeType,
        customerName,
        customerAddress,
        outstandingAmount,
        quantity,
        examName,
        senderName,
        subject,
        phoneNumbers,
        message,
        pinSize,
        bulkPhones,
        bulkType,
        isBulk,
        scheduleType,
        scheduleFrequency,
        scheduleDate,
        isSchedule,
    } = params;

    useEffect(() => {
        const fetchUserData = async () => {
            await refreshUser();
            setLoadingUser(false);
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const checkBiometric = async () => {
            try {
                const available = await isBiometricAvailable();
                const enabled = await isBiometricEnabled();
                setBiometricAvailable(available);
                setBiometricEnabled(enabled);
            } catch (error) {
                console.error('Error checking biometric:', error);
                setBiometricAvailable(false);
                setBiometricEnabled(false);
            }
        };
        checkBiometric();
    }, []);

    const additionalDetails = [];

    if (planSize) {
        additionalDetails.push({ label: 'Plan', value: planSize });
    }
    if (validity) {
        additionalDetails.push({ label: 'Validity', value: validity });
    }
    if (meterType) {
        additionalDetails.push({ label: 'Meter Type', value: meterType });
    }
    if (provider) {
        additionalDetails.push({ label: 'Provider', value: provider });
    }

    const userBalance = user?.balance ? parseFloat(user.balance) : 0;
    const transactionAmount = parseFloat(amount);
    const cashbackAmount = user?.cashback ? parseFloat(user.cashback) : 0;
    const balance = userBalance - transactionAmount;
    const hasInsufficientBalance = userBalance < transactionAmount;

    const handleBiometric = async () => {
        // Check if biometric is enabled (PIN stored)
        if (!biometricEnabled) {
            // First time - show setup modal
            setShowBiometricSetup(true);
            return;
        }

        // Biometric is enabled - authenticate and get stored PIN
        setProcessing(true);
        const result = await authenticateWithBiometric();
        
        if (result.success && result.pin) {
            // Auto-submit with stored PIN
            await handlePinConfirm(result.pin);
        } else if (result.useFallback) {
            // User chose to use PIN instead
            setProcessing(false);
            setShowPinModal(true);
        } else if (result.cancelled) {
            // User cancelled
            setProcessing(false);
            showToast('info', 'Authentication cancelled');
        } else {
            // Authentication failed
            setProcessing(false);
            showToast('error', result.error || 'Biometric authentication failed');
            setShowPinModal(true);
        }
    };

    const handleBiometricSetupSuccess = async () => {
        setBiometricEnabled(true);
        showToast('success', 'Biometric authentication enabled successfully!');
    };

    const handlePinConfirm = async (pin) => {
        if (isSchedule === 'true' && service === 'Schedule Data' && planId && scheduleType && scheduleDate) {
            const success = await processScheduleDataPurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (isSchedule === 'true' && service === 'Schedule Airtime' && scheduleType && scheduleDate) {
            const success = await processScheduleAirtimePurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (isBulk === 'true' && service === 'Bulk Data' && planId && bulkType && bulkPhones) {
            const success = await processBulkDataPurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (isBulk === 'true' && service === 'Bulk Airtime' && bulkType && bulkPhones) {
            const success = await processBulkAirtimePurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (service === 'Data Subscription' && planId && planType) {
            const success = await processDataPurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (service === 'Data Pin' && planId && planType && quantity) {
            const success = await processDataPinPurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (service === 'Airtime Pin' && pinSize && quantity) {
            const success = await processAirtimePinPurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (service === 'airtime' && network && airtimeType) {
            const success = await processAirtimePurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (service === 'cable' && provider && planId) {
            const success = await processCablePurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (service === 'electricity' && providerId && meterType) {
            const success = await processElectricityPurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (service === 'exam' && planId && quantity) {
            const success = await processExamPurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else if (service === 'Bulk SMS' && senderName && subject && phoneNumbers && message) {
            const success = await processBulkSMSPurchase(pin);
            if (success) {
                setShowPinModal(false);
            }
            return success;
        } else {
            setShowPinModal(false);
            handleSuccess();
            return true;
        }
    };

    const processDataPurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseData(
                network,
                planType,
                parseInt(planId),
                beneficiary,
                amount,
                pin
            );

            if (response.user) {
                await updateUser(response.user);
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Data purchase successful!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processAirtimePurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseAirtime(
                network,
                airtimeType,
                parseFloat(amount),
                beneficiary,
                pin
            );

            // Update user balance
            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            
            // Show api_response as toast if available
            const successMessage = response.api_response || response.message || 'Airtime purchase successful!';
            showToast('success', successMessage);
            
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processCablePurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseCable(
                provider,
                planId, // Send plan name (e.g., "GOtv Smallie - monthly N1900")
                beneficiary,
                pin,
                amount // Include amount/price in the payload
            );

            // Update user balance
            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Cable TV subscription successful!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processElectricityPurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseElectricity(
                providerId,
                meterType.toLocaleLowerCase(),
                beneficiary,
                parseFloat(amount),
                pin,
                user?.phone || ''
            );

            // Update user balance
            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Electricity token purchase successful!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processExamPurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseExam(
                parseInt(planId),
                parseInt(quantity),
                amount,
                pin
            );

            // Update user balance
            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Exam PIN purchase successful!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processBulkSMSPurchase = async (pin) => {
        setProcessing(true);
        try {
            // Convert phone numbers from newline-separated to comma-separated
            const bulkPhones = phoneNumbers
                .split('\n')
                .filter(n => n.trim().length > 0)
                .join(',');

            const response = await purchaseBulkSMS(
                senderName || 'Default',
                subject,
                message,
                amount,
                bulkPhones,
                pin
            );

            // Update user balance
            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Bulk SMS sent successfully!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processDataPinPurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseDataPin(
                network,
                planType,
                planId,
                parseInt(quantity),
                amount,
                pin
            );

            if (response.user) {
                await updateUser(response.user);
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Data PIN purchase successful!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processAirtimePinPurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseAirtimePin(
                network,
                pinSize,
                amount,
                parseInt(quantity),
                pin
            );

            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Airtime PIN purchase successful!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processBulkDataPurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseBulkData(
                network,
                bulkType,
                parseInt(planId),
                amount,
                bulkPhones,
                pin
            );

            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Bulk data purchase successful!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processBulkAirtimePurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await purchaseBulkAirtime(
                network,
                bulkType,
                parseFloat(amount),
                bulkPhones,
                pin
            );

            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Bulk airtime purchase successful!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Purchase failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processScheduleDataPurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await scheduleDataPurchase(
                network,
                scheduleType,
                parseInt(planId),
                amount,
                beneficiary,
                pin,
                scheduleFrequency,
                scheduleDate
            );

            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Data purchase scheduled successfully!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Schedule failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const processScheduleAirtimePurchase = async (pin) => {
        setProcessing(true);
        try {
            const response = await scheduleAirtimePurchase(
                network,
                scheduleType,
                parseFloat(amount),
                beneficiary,
                pin,
                scheduleFrequency,
                scheduleDate
            );

            if (response.user) {
                await updateUser(response.user);
            } else if (response.new_balance) {
                await updateUser({ ...user, balance: response.new_balance });
            } else if (response.balance) {
                await updateUser({ ...user, balance: response.balance });
            }

            setProcessing(false);
            showToast('success', response.message || 'Airtime purchase scheduled successfully!');
            handleSuccess(response);
            return true;
        } catch (error) {
            setProcessing(false);
            setShowPinModal(false);
            
            const errorMessage = error.message || 'Schedule failed. Please try again.';
            showToast('error', errorMessage);
            
            return false;
        }
    };

    const handleSuccess = (response = null) => {
        const successParams = { 
            service: service === 'airtime' ? 'Airtime Purchase' : service === 'electricity' ? 'Electricity Bill' : service === 'exam' ? 'Education Service' : (serviceType || service), 
            beneficiary, 
            amount, 
            network: network || provider,
            transactionId: response?.transaction_id || Date.now().toString()
        };

        // Add API response data if available
        if (response) {
            if (response['request-id']) successParams.requestId = response['request-id'];
            if (response.api_response) successParams.apiResponse = response.api_response;
            if (response.data_size) successParams.dataSize = response.data_size;
            if (response.data_type) successParams.dataType = response.data_type;
            if (response.old_balance) successParams.oldBalance = response.old_balance.toString();
            if (response.new_balance) successParams.newBalance = response.new_balance.toString();
            
            // Add airtime-specific fields
            if (response.airtime_type) successParams.airtimeType = response.airtime_type;
            if (response.phone) successParams.phone = response.phone;
            
            // Add cable-specific fields
            if (response.cable_plan) successParams.cablePlan = response.cable_plan;
            if (response.iuc) successParams.iuc = response.iuc;
            
            // Add electricity-specific fields
            if (response.token) successParams.token = response.token;
            if (response.units) successParams.units = response.units;
            if (response.meter_number) successParams.meterNumber = response.meter_number;
            if (response.disco_name) successParams.discoName = response.disco_name;
            if (response.meter_type) successParams.meterType = response.meter_type;
            
            // Add exam-specific fields
            if (response.pins) successParams.pins = JSON.stringify(response.pins);
            if (response.exam_name) successParams.examName = response.exam_name;
            
            // Add data pin-specific fields
            if (response.data_pins) successParams.dataPins = JSON.stringify(response.data_pins);
            
            // Add airtime pin-specific fields
            if (response.serial) successParams.serial = response.serial;
            if (response.pin) successParams.airtimePin = response.pin;
            if (response.pinsize) successParams.pinSize = response.pinsize;
        }

        // Add additional details
        if (planSize) successParams.planSize = planSize;
        if (validity) successParams.validity = validity;
        if (planName) successParams.planName = planName;
        if (customerName) successParams.customerName = customerName;
        if (meterType) successParams.meterType = meterType;
        if (customerAddress) successParams.customerAddress = customerAddress;
        if (quantity) successParams.quantity = quantity;
        if (examName) successParams.examName = examName;

        router.push({
            pathname: '/(services)/transaction-success',
            params: successParams
        });
    };



    if (hasInsufficientBalance) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                        Summary
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    <View style={[styles.insufficientCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FF5252' + '20' }]}>
                            <Ionicons name="wallet-outline" size={48} color="#FF5252" />
                        </View>
                        
                        <Text style={[styles.insufficientTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Insufficient Balance
                        </Text>
                        
                        <Text style={[styles.insufficientText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            You need ₦{transactionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to complete this transaction
                        </Text>

                        <View style={styles.balanceInfo}>
                            <View style={styles.balanceRow}>
                                <Text style={[styles.balanceLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Current Balance
                                </Text>
                                <Text style={[styles.balanceValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    ₦{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={styles.balanceRow}>
                                <Text style={[styles.balanceLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Required Amount
                                </Text>
                                <Text style={[styles.balanceValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                    ₦{transactionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.icon + '20' }]} />
                            <View style={styles.balanceRow}>
                                <Text style={[styles.balanceLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                    Amount Needed
                                </Text>
                                <Text style={[styles.balanceValue, { color: '#FF5252', fontFamily: fonts.inter.bold }]}>
                                    ₦{(transactionAmount - userBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Fund Wallet"
                        onPress={() => router.push('/fund-wallet')}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Summary
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.amount, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    ₦{transactionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>

                <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Service
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {service === 'airtime' ? 'Airtime Purchase' : service}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Beneficiary
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            {beneficiary}
                        </Text>
                    </View>

                    {network && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Network
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {network}
                            </Text>
                        </View>
                    )}

                    {additionalDetails.map((detail, index) => (
                        <View key={index} style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {detail.label}
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {detail.value}
                            </Text>
                        </View>
                    ))}

                    {customerName && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Customer Name
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {customerName}
                            </Text>
                        </View>
                    )}

                    {customerAddress && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Address
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {customerAddress}
                            </Text>
                        </View>
                    )}

                    {outstandingAmount && parseFloat(outstandingAmount) > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Outstanding
                            </Text>
                            <Text style={[styles.summaryValue, { color: '#FF5252', fontFamily: fonts.inter.semiBold }]}>
                                ₦{parseFloat(outstandingAmount).toLocaleString()}
                            </Text>
                        </View>
                    )}

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Balance After
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            ₦{balance.toFixed(2)}
                        </Text>
                    </View>

                    {/* <View style={styles.summaryRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Use Cashback
                            </Text>
                            <Text style={[styles.cashbackAmount, { color: colors.primary, fontFamily: fonts.inter.semiBold }]}>
                                ₦{cashbackAmount.toFixed(2)} available
                            </Text>
                        </View>
                        <Switch
                            value={useCashback}
                            onValueChange={setUseCashback}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor="#fff"
                            disabled={cashbackAmount <= 0}
                        />
                    </View> */}
                </View>

                {/* Save Beneficiary Button - Show for data, airtime, cable, and electricity services */}
                {(service === 'Data Subscription' || service === 'airtime' || service === 'cable' || service === 'electricity') && beneficiary && beneficiary.length >= 10 && (network || provider) && (
                    <TouchableOpacity
                        style={[styles.saveBeneficiaryButton, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}
                        onPress={() => setShowSaveBeneficiaryModal(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="bookmark-outline" size={16} color={colors.primary} />
                        <Text style={[styles.saveBeneficiaryText, { color: colors.primary, fontFamily: fonts.inter.medium }]}>
                            Save Beneficiary
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={styles.authContainer}>
                    {biometricAvailable && (
                        <TouchableOpacity
                            style={styles.biometricButton}
                            onPress={handleBiometric}
                            activeOpacity={0.7}
                            disabled={processing}
                        >
                            <View style={[styles.biometricIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="finger-print" size={64} color={colors.primary} />
                            </View>
                            <Text style={[styles.biometricText, { color: colors.text, fontFamily: fonts.inter.medium }]}>
                                {biometricEnabled ? 'Authenticate with Biometric' : 'Set Up Biometric'}
                            </Text>
                            <Text style={[styles.biometricSubtext, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                {biometricEnabled 
                                    ? 'Quick and secure authentication' 
                                    : 'Enable for faster transactions'
                                }
                            </Text>
                        </TouchableOpacity>
                    )}

                    {biometricAvailable && (
                        <View style={styles.dividerContainer}>
                            <View style={[styles.dividerLine, { backgroundColor: colors.icon + '30' }]} />
                            <Text style={[styles.dividerText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                or
                            </Text>
                            <View style={[styles.dividerLine, { backgroundColor: colors.icon + '30' }]} />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.pinButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowPinModal(true)}
                        activeOpacity={0.8}
                        disabled={processing}
                    >
                        <Ionicons name="keypad-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={[styles.pinButtonText, { fontFamily: fonts.inter.semiBold }]}>
                            Continue with PIN
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <TransactionPinModal
                visible={showPinModal}
                onClose={() => {
                    setShowPinModal(false);
                    setProcessing(false);
                }}
                onConfirm={handlePinConfirm}
                onError={() => {
                    showToast('error', 'Incorrect PIN. Please try again.');
                }}
            />

            <BiometricSetupModal
                visible={showBiometricSetup}
                onClose={() => setShowBiometricSetup(false)}
                onSuccess={handleBiometricSetupSuccess}
            />

            <SaveBeneficiaryModal
                visible={showSaveBeneficiaryModal}
                onClose={() => setShowSaveBeneficiaryModal(false)}
                onSave={async (name) => {
                    try {
                        // Determine beneficiary type based on service
                        let beneficiaryType = 'topup';
                        if (service === 'cable') {
                            beneficiaryType = 'cable';
                        } else if (service === 'electricity') {
                            beneficiaryType = 'electricity';
                        }
                        
                        await addBeneficiary(beneficiary, name, beneficiaryType);
                    } catch (error) {
                        // Error toast is already shown in the context
                    }
                }}
                phoneNumber={beneficiary}
            />

            {(loadingUser || processing) && <LoadingOverlay visible={true} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18 },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    insufficientCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    insufficientTitle: {
        fontSize: 20,
        marginBottom: 8,
    },
    insufficientText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    balanceInfo: {
        width: '100%',
        gap: 12,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
    },
    balanceValue: {
        fontSize: 14,
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    amount: {
        fontSize: 36,
        textAlign: 'center',
        marginBottom: 24,
    },
    summaryCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        gap: 16,
        marginBottom: 32,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: { fontSize: 14 },
    summaryValue: { fontSize: 14, textAlign: 'right', flex: 1, marginLeft: 16 },
    cashbackAmount: { fontSize: 12, marginTop: 2 },
    authContainer: {
        paddingHorizontal: 20,
        gap: 16,
    },
    biometricButton: {
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    biometricIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    biometricText: {
        fontSize: 15,
    },
    biometricSubtext: {
        fontSize: 12,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        marginHorizontal: 12,
    },
    pinButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinButtonText: {
        fontSize: 16,
        color: '#fff',
    },
    saveBeneficiaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveBeneficiaryText: {
        fontSize: 14,
    },
});
