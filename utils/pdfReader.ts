import * as pdfjsLib from "pdfjs-dist";

// 【CRITICAL CONFIGURATION】
// 解决 "Failed to construct 'URL': Invalid URL" 错误。
// 我们直接指向 jsDelivr CDN 上的 Worker 文件。
// 这里的版本号 (pdfjsLib.version) 会动态匹配安装的 npm 包版本 (5.4.530)，确保主线程与 Worker 版本一致。
// 这种方式完全绕过了本地 URL 解析的潜在问题。
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '5.4.530'}/build/pdf.worker.mjs`;

/**
 * 读取 PDF 文件并提取文本
 */
export const readPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    // 同样使用 CDN 加载字体映射文件 (cMaps)
    const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '5.4.530'}/cmaps/`,
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
    
    if (msg.includes("Worker") || msg.includes("version") || msg.includes("Setting up fake worker failed")) {
        throw new Error(`PDF Worker 加载异常 (v${pdfjsLib.version || 'unknown'})。请检查网络是否能访问 cdn.jsdelivr.net。`);
    }
    throw new Error(`PDF 解析失败: ${msg}`);
  }
};