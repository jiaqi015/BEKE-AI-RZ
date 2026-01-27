
import * as pdfjsLib from "pdfjs-dist";

// 【VERSION SYNC】
// 必须与 package.json 中的版本号 5.4.530 严格对齐
const PDF_JS_VERSION = '5.4.530';

// 配置 Worker - 5.x 版本必须使用 .mjs 扩展名
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.worker.mjs`;

/**
 * 读取 PDF 文件并提取文本
 */
export const readPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/cmaps/`,
        cMapPacked: true,
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
        throw new Error(`PDF Worker 版本冲突 (预期 ${PDF_JS_VERSION})。请尝试清理浏览器缓存。`);
    }
    throw new Error(`PDF 解析失败: ${msg}`);
  }
};
