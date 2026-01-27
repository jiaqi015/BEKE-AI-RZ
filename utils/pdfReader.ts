import * as pdfjsLib from 'pdfjs-dist';

// 处理 Vite/Webpack 环境下的 ESM 默认导出兼容性问题
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// 【核心修复】强制锁定版本，不再依赖运行时检测
// 必须与 package.json 中的 pdfjs-dist 版本严格一致
const EXACT_VERSION = '3.11.174';

// Debug Log: 确认当前加载的库版本
console.log(`[PDF Loader] Target Worker: ${EXACT_VERSION}, Loaded Lib Version: ${pdfjs.version}`);

// 使用 CDN 加载 Worker，避免 Vite 构建时的复杂文件拷贝配置
// 这一步确保了 Worker (线程) 与主线程 (npm 包) 版本 100% 匹配
const WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${EXACT_VERSION}/pdf.worker.min.js`;

if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
}

/**
 * 读取 PDF 文件并提取文本
 */
export const readPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        // 同样强制使用对应版本的 CMap (字体映射)
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${EXACT_VERSION}/cmaps/`,
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
    
    // 友好的错误提示
    if (msg.includes("version") && msg.includes("match")) {
       throw new Error(`PDF 版本冲突: 检测到库版本为 ${pdfjs.version}，但 Worker 需要 ${EXACT_VERSION}。请确保 index.html 中没有 importmap 干扰。`);
    }
    if (msg.includes("Worker") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        throw new Error("PDF 组件加载失败: 请检查网络连接 (需要访问 cdnjs.cloudflare.com)");
    }
    throw new Error(`PDF 解析失败: ${msg}`);
  }
};