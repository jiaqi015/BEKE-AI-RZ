
import * as pdfjsLib from 'pdfjs-dist';

// Handle ESM/CJS default export inconsistency
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Configure the worker source.
// CRITICAL FIX: We use CDNJS which is highly reliable for raw worker files.
// We set this on MULTIPLE potential targets to ensure the library picks it up
// regardless of how the import was resolved by the bundler/browser.
const WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
} else if ((window as any).pdfjsLib?.GlobalWorkerOptions) {
  // Fallback: sometimes pdfjs mounts itself on window in browser environments
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
}

/**
 * Reads a PDF file and extracts text from all pages.
 */
export const readPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        // Provide standard font maps to resolve text correctly
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
    });
    
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    // Iterate through all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text items and join them
      // @ts-ignore
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      
      // Add a header for structure
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
    
    return fullText;
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    // Improve error message for user
    const msg = error.message || "Unknown error";
    if (msg.includes("Worker") || msg.includes("importScripts") || msg.includes("NetworkError")) {
        throw new Error("PDF Worker Load Failed. This is usually a network strictness issue. Please try refreshing or using a VPN.");
    }
    throw new Error(`Failed to parse PDF file: ${msg}`);
  }
};
