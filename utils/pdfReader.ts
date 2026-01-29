
import * as pdfjsLib from "pdfjs-dist";

// Define version to match package.json
const PDF_WORKER_VERSION = '5.4.530';

// Construct CDN URLs
// We use unpkg for all resources to ensure version alignment and avoid bundler resolution issues.
const BASE_CDN = `https://unpkg.com/pdfjs-dist@${PDF_WORKER_VERSION}`;
const WORKER_URL = `${BASE_CDN}/build/pdf.worker.min.mjs`;
const CMAP_URL = `${BASE_CDN}/cmaps/`;
const STANDARD_FONT_DATA_URL = `${BASE_CDN}/standard_fonts/`;

// Use a CDN for the worker to avoid Vite build issues with the worker file.
pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

/**
 * 读取 PDF 文件并提取文本
 */
export const readPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    // Explicitly provide paths to external resources (CMaps, Fonts) to avoid "Invalid URL" errors
    // when the library attempts to resolve them relative to a restricted import.meta.url
    const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: CMAP_URL,
        cMapPacked: true,
        standardFontDataUrl: STANDARD_FONT_DATA_URL,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // @ts-ignore
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
    
    return fullText;
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    const msg = error.message || "Unknown error";
    
    if (msg.includes("Worker") || msg.includes("version")) {
        throw new Error(`PDF Worker 版本冲突。请尝试清理浏览器缓存。`);
    }
    throw new Error(`PDF 解析失败: ${msg}`);
  }
};
