import { useServices } from '@/contexts/services-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/contexts/toast-context';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NETWORK_LOGOS = {
    mtn: require('@/assets/networks/mtn.png'),
    airtel: require('@/assets/networks/airtel.png'),
    glo: require('@/assets/networks/glo.png'),
    '9mobile': require('@/assets/networks/9mobile.png'),
};

export default function PinPrintModal({ visible, onClose, pinRef, provider, serviceName, amount }) {
    const { colors, fonts, isDark } = useTheme();
    const { fetchPrintPins } = useServices();
    const { showToast } = useToast();
    const [printMode, setPrintMode] = useState('bluetooth');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pins, setPins] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (visible && pinRef) {
            loadPins();
        }
    }, [visible, pinRef]);

    const loadPins = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetchPrintPins(pinRef);
            
            if (response && Array.isArray(response)) {
                setPins(response);
            } else if (response && response.pins) {
                setPins(response.pins);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error loading pins:', err);
            setError(err.message || 'Failed to load pins');
            showToast('error', 'Failed to load PIN details');
        } finally {
            setIsLoading(false);
        }
    };

    const getNetworkLogo = () => {
        // Get network from pins data if available
        const network = getNetworkFromPins();
        
        if (network.includes('mtn')) return NETWORK_LOGOS.mtn;
        if (network.includes('airtel')) return NETWORK_LOGOS.airtel;
        if (network.includes('glo')) return NETWORK_LOGOS.glo;
        if (network.includes('9mobile')) return NETWORK_LOGOS['9mobile'];
        return NETWORK_LOGOS.mtn;
    };

    const getNetworkFromPins = () => {
        // Get network from the first pin in the array
        if (pins.length > 0 && pins[0].network) {
            return pins[0].network.toLowerCase();
        }
        return provider?.toLowerCase() || 'mtn';
    };

    const getImageBase64 = async () => {
        const network = getNetworkFromPins();
        
        // Map network to asset and get resolved source
        let assetModule;
        if (network.includes('mtn')) {
            assetModule = require('@/assets/networks/mtn.png');
        } else if (network.includes('airtel')) {
            assetModule = require('@/assets/networks/airtel.png');
        } else if (network.includes('glo')) {
            assetModule = require('@/assets/networks/glo.png');
        } else if (network.includes('9mobile')) {
            assetModule = require('@/assets/networks/9mobile.png');
        } else {
            assetModule = require('@/assets/networks/mtn.png');
        }
        
        // Embed the logo as a data URI. In release builds the bundled asset URI is not loadable
        // from the print HTML, so linking to it leaves a broken image on the cards.
        try {
            const asset = Asset.fromModule(assetModule);
            if (!asset.localUri) await asset.downloadAsync();
            const base64 = await new File(asset.localUri || asset.uri).base64();
            return `data:image/png;base64,${base64}`;
        } catch (err) {
            console.error('Could not embed network logo:', err);
            // 1x1 transparent pixel so the card still renders without the logo
            return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }
    };

    const generatePinHTML = async () => {
        const isBluetoothMode = printMode === 'bluetooth';
        
        // Use real pins for PDF generation
        const pinsToUse = pins;
        
        if (isBluetoothMode) {
            // Bluetooth/POS mode - full width, single column, centered
            const logoDataUri = await getImageBase64();
            
            return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Courier New', Courier, monospace; padding: 4mm; background: #fff; color: #000; width: 58mm; display: flex; flex-direction: column; align-items: center; }
.pin-card { width: 100%; max-width: 50mm; margin: 0 auto 6mm auto; border: 2px dashed #333; padding: 3mm; background: #fff; page-break-inside: avoid; position: relative; }
.card-header { display: flex; align-items: center; justify-content: center; gap: 2mm; border-bottom: 1px dashed #666; padding-bottom: 2mm; margin-bottom: 2mm; }
.logo-container { width: 24px; height: 24px; border-radius: 50%; overflow: hidden; background: #fff; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.network-logo { width: 22px; height: 22px; object-fit: contain; }
.card-name { font-size: 14px; font-weight: bold; color: #000; text-transform: capitalize; }
.card-body { font-size: 11px; line-height: 1.5; }
.info-row { display: flex; margin: 1.5mm 0; align-items: flex-start; }
.label { font-weight: bold; color: #000; flex-shrink: 0; min-width: 35px; }
.value { word-break: break-all; color: #000; flex: 1; }
.pin-value { font-size: 12px; font-weight: bold; letter-spacing: 0.5px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2mm; padding-top: 2mm; border-top: 1px dashed #666; }
.footer-text { font-size: 9px; color: #333; flex: 1; }
.amount-value { font-size: 13px; font-weight: bold; color: #000; }
@media print { body { padding: 2mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .pin-card { page-break-inside: avoid; } }
</style>
</head>
<body>
${pinsToUse.map((pin) => `<div class="pin-card">
<div class="card-header">
<div class="logo-container"><img src="${logoDataUri}" class="network-logo" alt="${provider}" /></div>
<div class="card-name">${pin.name || 'Customer'}</div>
</div>
<div class="card-body">
<div class="info-row"><span class="label">REF:</span><span class="value">${pin.id || 'N/A'}</span></div>
<div class="info-row"><span class="label">PIN:</span><span class="value pin-value">${pin.token || pin.pin || 'N/A'}</span></div>
<div class="info-row"><span class="label">S/N:</span><span class="value">${pin.serial || pin.serialNumber || 'N/A'}</span></div>
<div class="info-row"><span class="label">Date:</span><span class="value">${pin.sold_at || new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</span></div>
</div>
<div class="card-footer"><div class="footer-text">Dial *311*PIN# | Care Line: 300</div><div class="amount-value">N${pin.amount || '100'}</div></div>
</div>`).join('')}
</body>
</html>`;
        }
        
        // Printer/A4 mode - 4 columns × 10 rows
        const columns = 4;
        const rowsPerPage = 10;
        
        const pages = [];
        for (let i = 0; i < pinsToUse.length; i += (columns * rowsPerPage)) {
            pages.push(pinsToUse.slice(i, i + (columns * rowsPerPage)));
        }

        const cardWidth = '23%';
        const cardMargin = '0 1% 2px 1%';
        const logoDataUri = await getImageBase64();

        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Courier New', Courier, monospace; padding: 8mm 10mm; background: #fff; color: #000; }
.page { page-break-after: always; }
.page:last-child { page-break-after: avoid; }
.cards-container { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 0; }
.pin-card { width: ${cardWidth}; margin: ${cardMargin}; border: 1.5px dashed #333; padding: 5px 4px; background: #fff; page-break-inside: avoid; position: relative; }
.card-header { display: flex; align-items: center; justify-content: center; gap: 2px; border-bottom: 1px dashed #666; padding-bottom: 3px; margin-bottom: 3px; }
.logo-container { width: 16px; height: 16px; border-radius: 50%; overflow: hidden; background: #fff; border: 0.5px solid #ddd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.network-logo { width: 15px; height: 15px; object-fit: contain; }
.card-name { font-size: 8.5px; font-weight: bold; color: #000; text-transform: capitalize; }
.card-body { font-size: 6.5px; line-height: 1.25; }
.info-row { display: flex; margin: 1px 0; align-items: flex-start; }
.label { font-weight: bold; color: #000; flex-shrink: 0; min-width: 26px; }
.value { word-break: break-all; color: #000; flex: 1; }
.pin-value { font-size: 7.5px; font-weight: bold; letter-spacing: 0.3px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #666; }
.footer-text { font-size: 5.5px; color: #333; flex: 1; }
.amount-value { font-size: 8px; font-weight: bold; color: #000; }
@media print { body { padding: 6mm 8mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { page-break-after: always; } .page:last-child { page-break-after: avoid; } .pin-card { page-break-inside: avoid; } }
</style>
</head>
<body>
${pages.map((pagePins, pageIndex) => `<div class="page"${pageIndex === pages.length - 1 ? ' style="page-break-after: avoid;"' : ''}><div class="cards-container">${pagePins.map((pin) => `<div class="pin-card">
<div class="card-header">
<div class="logo-container"><img src="${logoDataUri}" class="network-logo" alt="${provider}" /></div>
<div class="card-name">${pin.name || 'Customer'}</div>
</div>
<div class="card-body">
<div class="info-row"><span class="label">REF:</span><span class="value">${pin.id || 'N/A'}</span></div>
<div class="info-row"><span class="label">PIN:</span><span class="value pin-value">${pin.token || pin.pin || 'N/A'}</span></div>
<div class="info-row"><span class="label">S/N:</span><span class="value">${pin.serial || pin.serialNumber || 'N/A'}</span></div>
<div class="info-row"><span class="label">Date:</span><span class="value">${pin.sold_at || new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</span></div>
</div>
<div class="card-footer"><div class="footer-text">Dial *311*PIN# | Care Line: 300</div><div class="amount-value">N${pin.amount || '100'}</div></div>
</div>`).join('')}</div></div>`).join('')}
</body>
</html>`;
    };

    const handleDownloadPDF = async () => {
        try {
            setIsGenerating(true);
            const html = await generatePinHTML();
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            try {
                // Copy to a named file in the app cache so the share sheet gets a readable
                // path (and a sensible file name) regardless of where the printer wrote it
                const target = new File(Paths.cache, `PIN-Cards-${String(pinRef).replace(/[^\w-]/g, '')}.pdf`);
                await new File(uri).copy(target, { overwrite: true });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', dialogTitle: 'Save PIN Cards', UTI: 'com.adobe.pdf' });
                    showToast('success', 'PDF generated successfully');
                    return;
                }
            } catch (shareError) {
                console.error('Could not share PDF, falling back to the print dialog:', shareError);
            }

            // Sharing is unavailable or refused the file: the system print dialog can still "Save as PDF"
            await Print.printAsync({ html });
        } catch (error) {
            console.error('Error generating PDF:', error);
            showToast('error', 'Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = async () => {
        try {
            setIsGenerating(true);
            const html = await generatePinHTML();
            await Print.printAsync({ html });
            showToast('success', 'Printing...');
        } catch (error) {
            console.error('Error printing:', error);
            showToast('error', 'Failed to print');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>Print PIN Cards</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Loading PIN details...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                            <Text style={[styles.errorText, { color: colors.text, fontFamily: fonts.inter.medium }]}>{error}</Text>
                            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadPins}>
                                <Text style={[styles.retryButtonText, { fontFamily: fonts.inter.semiBold }]}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : pins.length === 0 ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="document-outline" size={48} color={colors.icon} />
                            <Text style={[styles.errorText, { color: colors.text, fontFamily: fonts.inter.medium }]}>No PINs available</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.modeContainer}>
                                <Text style={[styles.sectionLabel, { color: colors.icon, fontFamily: fonts.inter.medium }]}>Print Mode</Text>
                                <View style={styles.modeButtons}>
                                    <TouchableOpacity style={[styles.modeButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }, printMode === 'bluetooth' && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setPrintMode('bluetooth')} activeOpacity={0.7}>
                                        <Ionicons name="bluetooth" size={24} color={printMode === 'bluetooth' ? '#fff' : colors.text} />
                                        <Text style={[styles.modeButtonText, { color: printMode === 'bluetooth' ? '#fff' : colors.text, fontFamily: fonts.inter.medium }]}>Bluetooth</Text>
                                        <Text style={[styles.modeButtonDesc, { color: printMode === 'bluetooth' ? '#fff' : colors.icon, fontFamily: fonts.inter.regular }]}>1 column • 58mm</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.modeButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }, printMode === 'printer' && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setPrintMode('printer')} activeOpacity={0.7}>
                                        <Ionicons name="print" size={24} color={printMode === 'printer' ? '#fff' : colors.text} />
                                        <Text style={[styles.modeButtonText, { color: printMode === 'printer' ? '#fff' : colors.text, fontFamily: fonts.inter.medium }]}>Printer</Text>
                                        <Text style={[styles.modeButtonDesc, { color: printMode === 'printer' ? '#fff' : colors.icon, fontFamily: fonts.inter.regular }]}>4 columns • A4</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.infoCard, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}>
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Total PINs:</Text>
                                    <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>{pins.length}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Pages:</Text>
                                    <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>{printMode === 'bluetooth' ? 1 : Math.ceil(pins.length / 40)}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: colors.icon, fontFamily: fonts.inter.regular }]}>Layout:</Text>
                                    <Text style={[styles.infoValue, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>{printMode === 'bluetooth' ? '1 column' : '4 columns × 10 rows'}</Text>
                                </View>
                            </View>

                            <ScrollView style={styles.previewContainer} showsVerticalScrollIndicator={false}>
                                <Text style={[styles.sectionLabel, { color: colors.icon, fontFamily: fonts.inter.medium, marginBottom: 12 }]}>Preview</Text>
                                
                                {printMode === 'bluetooth' ? (
                                    /* Bluetooth/POS Preview - Full Width */
                                    <View style={[styles.posPreview, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                                        <View style={[styles.posRoll, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                                            {pins.map((pin, index) => (
                                                <View key={index} style={[styles.posCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: '#666' }]}>
                                                    <View style={[styles.posCardHeader, { borderBottomColor: '#666' }]}>
                                                        <View style={styles.posLogoContainer}>
                                                            <Image source={getNetworkLogo()} style={styles.posLogo} />
                                                        </View>
                                                        <Text style={[styles.posCardTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>{pin.name || 'Customer'}</Text>
                                                    </View>
                                                    <View style={styles.posCardBody}>
                                                        <View style={styles.posRow}>
                                                            <Text style={[styles.posLabel, { color: colors.text, fontFamily: fonts.inter.bold }]}>REF:</Text>
                                                            <Text style={[styles.posValue, { color: colors.text, fontFamily: fonts.inter.regular }]} numberOfLines={1}>{pin.id || 'N/A'}</Text>
                                                        </View>
                                                        <View style={styles.posRow}>
                                                            <Text style={[styles.posLabel, { color: colors.text, fontFamily: fonts.inter.bold }]}>PIN:</Text>
                                                            <Text style={[styles.posValueBold, { color: colors.text, fontFamily: fonts.inter.bold }]} numberOfLines={1}>{pin.token || pin.pin || 'N/A'}</Text>
                                                        </View>
                                                        <View style={styles.posRow}>
                                                            <Text style={[styles.posLabel, { color: colors.text, fontFamily: fonts.inter.bold }]}>S/N:</Text>
                                                            <Text style={[styles.posValue, { color: colors.text, fontFamily: fonts.inter.regular }]} numberOfLines={1}>{pin.serial || 'N/A'}</Text>
                                                        </View>
                                                        <View style={styles.posRow}>
                                                            <Text style={[styles.posLabel, { color: colors.text, fontFamily: fonts.inter.bold }]}>Date:</Text>
                                                            <Text style={[styles.posValue, { color: colors.text, fontFamily: fonts.inter.regular }]} numberOfLines={1}>{pin.sold_at || '01-01-2025'}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={[styles.posFooter, { borderTopColor: '#666' }]}>
                                                        <Text style={[styles.posFooterText, { color: colors.icon, fontFamily: fonts.inter.regular }]} numberOfLines={2}>Dial *311*PIN# | Care Line: 300</Text>
                                                        <Text style={[styles.posAmount, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>N{pin.amount || '100'}</Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    /* A4 Page Preview */
                                    <View style={[styles.a4Preview, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                                        <View style={[styles.a4Page, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                                            <View style={styles.a4Grid}>
                                                {pins.map((pin, index) => (
                                                    <View key={index} style={[styles.a4Card, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: '#999' }]}>
                                                        <View style={[styles.a4CardHeader, { borderBottomColor: '#999' }]}>
                                                            <View style={styles.a4LogoContainer}>
                                                                <Image source={getNetworkLogo()} style={styles.a4Logo} />
                                                            </View>
                                                            <Text style={[styles.a4CardTitle, { color: colors.text, fontFamily: fonts.inter.semiBold }]} numberOfLines={1}>{pin.name || 'Customer'}</Text>
                                                        </View>
                                                        <View style={styles.a4CardBody}>
                                                            <View style={styles.a4Row}>
                                                                <Text style={[styles.a4Label, { color: colors.text, fontFamily: fonts.inter.bold }]}>REF:</Text>
                                                                <Text style={[styles.a4Value, { color: colors.text, fontFamily: fonts.inter.regular }]} numberOfLines={1}>{pin.id || 'N/A'}</Text>
                                                            </View>
                                                            <View style={styles.a4Row}>
                                                                <Text style={[styles.a4Label, { color: colors.text, fontFamily: fonts.inter.bold }]}>PIN:</Text>
                                                                <Text style={[styles.a4ValueBold, { color: colors.text, fontFamily: fonts.inter.bold }]} numberOfLines={1}>{pin.token || pin.pin || 'N/A'}</Text>
                                                            </View>
                                                            <View style={styles.a4Row}>
                                                                <Text style={[styles.a4Label, { color: colors.text, fontFamily: fonts.inter.bold }]}>S/N:</Text>
                                                                <Text style={[styles.a4Value, { color: colors.text, fontFamily: fonts.inter.regular }]} numberOfLines={1}>{pin.serial || 'N/A'}</Text>
                                                            </View>
                                                            <View style={styles.a4Row}>
                                                                <Text style={[styles.a4Label, { color: colors.text, fontFamily: fonts.inter.bold }]}>Date:</Text>
                                                                <Text style={[styles.a4Value, { color: colors.text, fontFamily: fonts.inter.regular }]} numberOfLines={1}>{pin.sold_at || '01-01-2025'}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={[styles.a4Footer, { borderTopColor: '#999' }]}>
                                                            <Text style={[styles.a4FooterText, { color: colors.icon, fontFamily: fonts.inter.regular }]} numberOfLines={1}>Dial *311*PIN#</Text>
                                                            <Text style={[styles.a4Amount, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>N{pin.amount || '100'}</Text>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.actionButton, styles.secondaryButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]} onPress={handleDownloadPDF} disabled={isGenerating} activeOpacity={0.7}>
                                    {isGenerating ? <ActivityIndicator size="small" color={colors.text} /> : (
                                        <>
                                            <Ionicons name="download-outline" size={20} color={colors.text} />
                                            <Text style={[styles.actionButtonText, { color: colors.text, fontFamily: fonts.inter.semiBold }]}>Download PDF</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handlePrint} disabled={isGenerating} activeOpacity={0.7}>
                                    {isGenerating ? <ActivityIndicator size="small" color="#fff" /> : (
                                        <>
                                            <Ionicons name="print" size={20} color="#fff" />
                                            <Text style={[styles.actionButtonText, { color: '#fff', fontFamily: fonts.inter.semiBold }]}>Print Now</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    container: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 30, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20 },
    closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    errorText: { fontSize: 14, textAlign: 'center', marginTop: 16, marginBottom: 20 },
    retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryButtonText: { color: '#fff', fontSize: 15 },
    sectionLabel: { fontSize: 13, marginBottom: 8 },
    modeContainer: { marginBottom: 20 },
    modeButtons: { flexDirection: 'row', gap: 12 },
    modeButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    modeButtonText: { fontSize: 15, marginTop: 8 },
    modeButtonDesc: { fontSize: 11, marginTop: 4 },
    infoCard: { padding: 16, borderRadius: 12, marginBottom: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    infoLabel: { fontSize: 14 },
    infoValue: { fontSize: 14 },
    previewContainer: { maxHeight: 400, marginBottom: 20 },
    posPreview: { padding: 12, borderRadius: 12, alignItems: 'center' },
    posRoll: { width: 200, borderRadius: 8, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    posCard: { width: '100%', marginBottom: 12, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 6, padding: 10, position: 'relative' },
    posCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderBottomWidth: 1, borderStyle: 'dashed', paddingBottom: 6, marginBottom: 6 },
    posLogoContainer: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    posLogo: { width: 22, height: 22, resizeMode: 'contain' },
    posCardTitle: { fontSize: 12 },
    posCardBody: { gap: 4 },
    posRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    posLabel: { fontSize: 10, minWidth: 35 },
    posValue: { fontSize: 10, flex: 1, textAlign: 'right' },
    posValueBold: { fontSize: 11, letterSpacing: 0.5 },
    posFooter: { borderTopWidth: 1, borderStyle: 'dashed', paddingTop: 6, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    posFooterText: { fontSize: 8, flex: 1 },
    posAmount: { fontSize: 12, marginLeft: 4 },
    a4Preview: { padding: 12, borderRadius: 12, alignItems: 'center' },
    a4Page: { width: '100%', aspectRatio: 210/297, borderRadius: 8, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    a4Grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    a4Card: { width: '23.5%', marginBottom: 2, borderWidth: 0.5, borderStyle: 'dashed', borderRadius: 2, padding: 2, position: 'relative' },
    a4CardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1, borderBottomWidth: 0.5, borderStyle: 'dashed', paddingBottom: 1, marginBottom: 1 },
    a4LogoContainer: { width: 7, height: 7, borderRadius: 3.5, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 0.3, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    a4Logo: { width: 6.5, height: 6.5, resizeMode: 'contain' },
    a4CardTitle: { fontSize: 4, lineHeight: 5 },
    a4CardBody: { gap: 0.5 },
    a4Row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    a4Label: { fontSize: 3, minWidth: 12 },
    a4Value: { fontSize: 3, flex: 1, textAlign: 'right' },
    a4ValueBold: { fontSize: 3.5, letterSpacing: 0.2 },
    a4Footer: { borderTopWidth: 0.5, borderStyle: 'dashed', paddingTop: 1, marginTop: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    a4FooterText: { fontSize: 2.5, flex: 1 },
    a4Amount: { fontSize: 3.5, marginLeft: 2 },
    previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    previewGridBluetooth: { flexDirection: 'column' },
    previewCard: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 10, marginBottom: 8, position: 'relative' },
    previewLogoContainer: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
    previewCardHeader: { alignItems: 'center', borderBottomWidth: 1, borderStyle: 'dashed', paddingBottom: 8, marginBottom: 8 },
    previewCardTitle: { fontSize: 11 },
    previewLogo: { width: 30, height: 30, resizeMode: 'contain' },
    previewCardBody: { gap: 4 },
    previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    previewLabel: { fontSize: 9, minWidth: 35 },
    previewValue: { fontSize: 9, flex: 1, textAlign: 'right' },
    previewValueBold: { fontSize: 10, letterSpacing: 0.5 },
    previewFooter: { borderTopWidth: 1, borderStyle: 'dashed', paddingTop: 6, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    previewFooterText: { fontSize: 8, flex: 1 },
    previewAmount: { fontSize: 10, marginLeft: 4 },
    moreText: { fontSize: 12, textAlign: 'center', marginTop: 12 },
    demoNote: { fontSize: 11, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
    actions: { flexDirection: 'row', gap: 12 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
    secondaryButton: {},
    primaryButton: {},
    actionButtonText: { fontSize: 15 },
});
