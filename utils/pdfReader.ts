import * as pdfjsLib from "pdfjs-dist";

// 【CRITICAL FIX】
// PDF.js 5.x uses ES Modules (.mjs). The worker file in node_modules is "pdf.worker.mjs".
// We use Vite's asset URL resolution to bundle the local worker file.
// This ensures the worker version matches the installed npm package version (5.4.530).

try {
  // Check if import.meta.url is available (it should be in Vite/ESM)
  // We use a conditional check to avoid "Invalid URL" TypeError if it's undefined in some environments.
  const baseUrl = import.meta.url;
  
  if (baseUrl) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      baseUrl
    ).toString();
  } else {
    // Should not happen in a valid Vite module environment
    console.error("import.meta.url is missing");
  }
} catch (e) {
  console.error("PDF Worker Configuration Failed:", e);
}

/**
 * 读取 PDF 文件并提取文本
 */
export const readPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    // 使用 Standard Font Data CDN (cMaps) - cMaps 纯数据文件通常跨小版本兼容
    const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";
    
    // 遍历所有页面
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
    
    if (msg.includes("Worker") || msg.includes("version") || msg.includes("Invalid URL")) {
        throw new Error("PDF环境版本不一致 (Worker Mismatch)。请执行: rm -rf node_modules && npm install && npm run build");
    }
    throw new Error(`PDF 解析失败: ${msg}`);
  }
};