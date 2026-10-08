import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Render HTML to a PDF and open the share sheet for it.
 *
 * expo-print writes to a location the share sheet is not always allowed to read
 * ("Not allowed to read file under given URL"), so the PDF is copied into the app cache
 * under a readable name first. If sharing still fails, the system print dialog is shown,
 * which can "Save as PDF".
 *
 * @returns {'shared' | 'printed'}
 */
export const sharePdfFromHtml = async (html, { fileName = 'Receipt', dialogTitle = 'Share PDF' } = {}) => {
    const { uri } = await Print.printToFileAsync({ html });

    try {
        const safeName = String(fileName).replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'Receipt';
        const target = new File(Paths.cache, `${safeName}.pdf`);
        await new File(uri).copy(target, { overwrite: true });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
            return 'shared';
        }
    } catch (error) {
        console.error('Could not share PDF, falling back to the print dialog:', error);
    }

    await Print.printAsync({ html });
    return 'printed';
};
