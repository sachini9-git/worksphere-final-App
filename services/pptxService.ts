import JSZip from 'jszip';

/**
 * Extracts raw text from a PPTX file using JSZip to parse the underlying XML structure.
 * It targets the <a:t> tags which contain the actual text blocks in PowerPoint slides.
 */
export const extractTextFromPptx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(arrayBuffer);
        
        let fullText = '';
        
        // Find all slide XML files
        const slideFiles = Object.keys(loadedZip.files).filter(fileName => 
            fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
        );

        // Sort slides by number (slide1.xml, slide2.xml, etc.) to maintain logical order
        slideFiles.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        for (const fileName of slideFiles) {
            const fileData = await loadedZip.files[fileName].async('text');
            
            // Regex to extract text within PowerPoint text node tags <a:t>
            const matches = fileData.match(/<a:t.*?>(.*?)<\/a:t>/g);
            
            if (matches) {
                const slideText = matches.map(match => {
                    // Strip the XML tags to get just the raw text
                    return match.replace(/<.*?>/g, '');
                }).join(' ');
                
                // Add a newline after each slide's content
                fullText += slideText + '\n\n';
            }
        }

        return fullText.trim();
    } catch (err) {
        console.error("Failed to parse PPTX:", err);
        throw new Error("Unable to extract text from this presentation.");
    }
};
