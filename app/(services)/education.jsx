import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EducationScreen() {
    const { colors, fonts, isDark } = useTheme();
    const { fetchExamTypes } = useServices();
    const { showToast } = useToast();
    const [quantity, setQuantity] = useState('1');
    const [selectedExam, setSelectedExam] = useState(null);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExamTypes();
    }, []);

    const loadExamTypes = async () => {
        setLoading(true);
        try {
            const data = await fetchExamTypes();
            setExams(data);
        } catch (error) {
            showToast('error', 'Failed to load exam types');
            console.error('Error loading exam types:', error);
        } finally {
            setLoading(false);
        }
    };

    const getExamColor = (name) => {
        const colors = {
            'WAEC': '#00A859',
            'NECO': '#0066CC',
            'NABTEB': '#FF6B00',
            'JAMB': '#FF0000'
        };
        return colors[name] || '#666666';
    };

    const getExamIcon = (name) => {
        const icons = {
            'WAEC': 'school',
            'NECO': 'book',
            'NABTEB': 'library',
            'JAMB': 'newspaper'
        };
        return icons[name] || 'document-text';
    };

    const incrementQuantity = () => {
        const current = parseInt(quantity) || 0;
        setQuantity((current + 1).toString());
    };

    const decrementQuantity = () => {
        const current = parseInt(quantity) || 0;
        if (current > 1) {
            setQuantity((current - 1).toString());
        }
    };

    const handleProceed = () => {
        if (!selectedExam) {
            showToast('error', 'Please select an exam type');
            return;
        }

        if (!quantity || parseInt(quantity) < 1) {
            showToast('error', 'Please enter a valid quantity');
            return;
        }

        const qty = parseInt(quantity);
        const totalAmount = selectedExam.price * qty;

        router.push({
            pathname: '/(services)/transaction-summary',
            params: {
                service: 'exam',
                serviceType: 'Education Service',
                beneficiary: `${qty} PIN(s)`,
                amount: totalAmount.toString(),
                provider: selectedExam.name,
                planSize: `${selectedExam.name} PIN`,
                planId: selectedExam.id.toString(),
                quantity: qty.toString(),
                examName: selectedExam.name,
            }
        });
    };

    const qty = parseInt(quantity) || 1;
    const totalAmount = selectedExam ? selectedExam.price * qty : 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                    Education Services
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.primary, fontFamily: fonts.inter.regular }]}>
                        Purchase exam PINs for WAEC, NECO, NABTEB, and JAMB
                    </Text>
                </View>

                {/* Exam Type Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                        Select Exam Type
                    </Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Loading exam types...
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.examGrid}>
                            {exams.map((exam) => {
                                const isSelected = selectedExam?.id === exam.id;
                                const examColor = getExamColor(exam.name);
                                
                                return (
                                    <TouchableOpacity
                                        key={exam.id}
                                        style={[
                                            styles.examCard,
                                            { 
                                                backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
                                                borderWidth: 2,
                                                borderColor: isSelected ? examColor : 'transparent'
                                            }
                                        ]}
                                        onPress={() => setSelectedExam(exam)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.examIconContainer, { backgroundColor: examColor + '20' }]}>
                                            <Ionicons name={getExamIcon(exam.name)} size={28} color={examColor} />
                                        </View>
                                        <Text style={[styles.examName, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                            {exam.name}
                                        </Text>
                                        <Text style={[styles.examPrice, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                            ₦{exam.price.toLocaleString()}
                                        </Text>
                                        <Text style={[styles.examPriceLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                            per PIN
                                        </Text>
                                        {isSelected && (
                                            <View style={[styles.selectedBadge, { backgroundColor: examColor }]}>
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Quantity Selection */}
                {selectedExam && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                            Number of PINs
                        </Text>
                        
                        <View style={[styles.quantityCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                            <View style={styles.quantityControls}>
                                <TouchableOpacity
                                    style={[styles.quantityButton, { backgroundColor: colors.primary + '20' }]}
                                    onPress={decrementQuantity}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="remove" size={24} color={colors.primary} />
                                </TouchableOpacity>
                                
                                <View style={styles.quantityInputContainer}>
                                    <TextInput
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        keyboardType="numeric"
                                        style={[styles.quantityInput, { color: colors.text, fontFamily: fonts.inter.bold }]}
                                        textAlign="center"
                                    />
                                    <Text style={[styles.quantityLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                        PIN(s)
                                    </Text>
                                </View>
                                
                                <TouchableOpacity
                                    style={[styles.quantityButton, { backgroundColor: colors.primary + '20' }]}
                                    onPress={incrementQuantity}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Summary */}
                {selectedExam && (
                    <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Exam Type
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {selectedExam.name}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Price per PIN
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                ₦{selectedExam.price.toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Quantity
                            </Text>
                            <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>
                                {qty} PIN(s)
                            </Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.icon + '20' }]} />
                        <View style={styles.summaryRow}>
                            <Text style={[styles.totalLabel, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                                Total Amount
                            </Text>
                            <Text style={[styles.totalValue, { color: colors.primary, fontFamily: fonts.inter.bold }]}>
                                ₦{totalAmount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Proceed Button */}
            {selectedExam && (
                <View style={[styles.footer, { backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={[styles.proceedButton, { backgroundColor: colors.primary }]}
                        onPress={handleProceed}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.proceedButtonText, { fontFamily: fonts.inter.bold }]}>
                            Proceed to Payment
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            {loading && <LoadingOverlay visible={true} />}
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
    scrollContent: {
        paddingBottom: 20,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        gap: 10,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: { 
        fontSize: 16, 
        paddingHorizontal: 20, 
        marginBottom: 16 
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: { fontSize: 14 },
    examGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
        gap: 12,
    },
    examCard: {
        width: '47%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        position: 'relative',
    },
    examIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    examName: {
        fontSize: 16,
        marginBottom: 8,
    },
    examPrice: {
        fontSize: 18,
        marginBottom: 2,
    },
    examPriceLabel: {
        fontSize: 11,
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityInputContainer: {
        alignItems: 'center',
        gap: 4,
    },
    quantityInput: {
        fontSize: 32,
        minWidth: 80,
    },
    quantityLabel: {
        fontSize: 12,
    },
    summaryCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
    totalLabel: {
        fontSize: 16,
    },
    totalValue: {
        fontSize: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    proceedButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    proceedButtonText: {
        fontSize: 16,
        color: '#fff',
    },
});
