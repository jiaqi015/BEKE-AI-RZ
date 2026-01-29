
import * as pdfjsLib from "pdfjs-dist";

// Define version to match package.json
const PDF_WORKER_VERSION = '5.4.530';

// Use a CDN for the worker to avoid Vite build issues with the worker file.
// This is the most reliable method for PDF.js v5+ in this specific environment.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDF_WORKER_VERSION}/build/pdf.worker.min.mjs`;

/**
 * 读取 PDF 文件并提取文本
 */
export const readPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
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
