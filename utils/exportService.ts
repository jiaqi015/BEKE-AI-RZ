
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import * as docx from 'docx';
import { PipelineContext, Artifacts } from '../types';
import { db } from '../infrastructure/db/projectDB';

/**
 * Helper to yield control back to the main thread to keep UI responsive.
 */
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// --- 1. DEFINING THE "OFFICIAL DOCUMENT" STYLE SYSTEM ---
// Strictly following Chinese Government Document Standards (GB/T 9704)
const OFFICIAL_STYLES = {
    paragraphStyles: [
        {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: { font: "SimHei", size: 32, bold: true, color: "000000" }, // 黑体 小二 (16pt)
            paragraph: { spacing: { before: 400, after: 240 }, alignment: docx.AlignmentType.CENTER, outlineLevel: 0 },
        },
        {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: { font: "SimHei", size: 28, bold: true, color: "000000" }, // 黑体 三号 (14pt)
            paragraph: { spacing: { before: 240, after: 120 }, alignment: docx.AlignmentType.LEFT, outlineLevel: 1 },
        },
        {
            id: "NormalBody",
            name: "Normal Body",
            basedOn: "Normal",
            run: { font: "SimSun", size: 24, color: "000000" }, // 宋体 小四 (12pt)
            paragraph: { indent: { firstLine: 480 }, spacing: { line: 360, lineRule: docx.LineRuleType.AUTO }, alignment: docx.AlignmentType.JUSTIFIED },
        },
        {
            id: "ListParagraph",
            name: "List Paragraph",
            basedOn: "NormalBody",
            paragraph: { indent: { left: 480, hanging: 360 }, spacing: { line: 360 } }
        },
        {
            id: "CodeBlock",
            name: "Code Block",
            run: { font: "Consolas", size: 21, color: "333333" }, // Consolas 10.5pt
            paragraph: {
                spacing: { line: 240 },
                indent: { left: 0, firstLine: 0 },
                shading: { type: docx.ShadingType.CLEAR, fill: "F5F7FA" }, // Light Gray Background
                border: { 
                    left: { style: docx.BorderStyle.SINGLE, size: 4, space: 8, color: "DDDDDD" },
                    bottom: { style: docx.BorderStyle.SINGLE, size: 4, space: 4, color: "EEEEEE" } 
                }
            }
        },
        {
            id: "ImageCaption",
            name: "Image Caption",
            run: { font: "KaiTi", size: 21, color: "666666" }, // 楷体 五号
            paragraph: { alignment: docx.AlignmentType.CENTER, spacing: { after: 240, before: 60 }, indent: { firstLine: 0 } }
        }
    ]
};

// --- 2. DOCX COMPILER ENGINE ---

class DocxCompiler {
    /**
     * Pre-scans content to find all image references.
     * Returns unique keys to fetch from DB.
     */
    private scanImageKeys(content: string): string[] {
        const regex = />\s*\[INSERT_IMAGE::(.*?)\]/g;
        const matches = [...content.matchAll(regex)];
        return [...new Set(matches.map(m => m[1].trim()))];
    }

    /**
     * Compiles Markdown text into a DOCX Blob.
     * Uses Batch Fetching for images to avoid Waterfall IO.
     */
    async compile(content: string, isSourceCode = false): Promise<Blob> {
        // Step 1: Analyze & Prefetch Assets (IO Bound)
        const imageKeys = this.scanImageKeys(content);
        const imageAssets = await db.getBatchContent(imageKeys);

        // Step 2: Parse & Render (CPU Bound)
        const lines = content.split('\n');
        const children: (docx.Paragraph | docx.Table)[] = [];
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Periodically yield to prevent UI freeze during heavy parsing
            if (i % 200 === 0) await yieldToMain();

            // Special handling for Source Code Document (Pure Code)
            if (isSourceCode) {
                 children.push(new docx.Paragraph({ text: line, style: "CodeBlock" }));
                 continue;
            }

            // A. Handle Images (Synchronous lookup from pre-fetched cache)
            // Relaxed Regex: Matches > [INSERT_IMAGE::...] anywhere in the line, no ^ anchor, optional spaces
            const imageMatch = line.match(/>\s*\[INSERT_IMAGE::(.*?)\]/);
            if (imageMatch) {
                const filename = imageMatch[1].trim();
                const imageBlob = imageAssets[filename];
                
                if (imageBlob && imageBlob instanceof Blob) {
                    const imageBuffer = await imageBlob.arrayBuffer();
                    children.push(new docx.Paragraph({
                        children: [
                            new docx.ImageRun({
                                data: imageBuffer,
                                transformation: { width: 450, height: 250 }, 
                                type: "png",
                            }),
                        ],
                        spacing: { before: 240 },
                        alignment: docx.AlignmentType.CENTER,
                    }));
                     children.push(new docx.Paragraph({
                        text: `图：${filename.replace('.png', '').replace(/UI_\d+_/, '')}`,
                        style: "ImageCaption"
                    }));
                } else {
                    children.push(new docx.Paragraph({
                        children: [new docx.TextRun({ text: `[图片缺失: ${filename}]`, color: "FF0000", bold: true })],
                        alignment: docx.AlignmentType.CENTER
                    }));
                }
                continue;
            }

            // B. Handle Headers
            if (line.startsWith('# ')) {
              children.push(new docx.Paragraph({ text: line.replace('# ', '').trim(), style: "Heading1" }));
              continue;
            }
            if (line.startsWith('## ')) {
              children.push(new docx.Paragraph({ text: line.replace('## ', '').trim(), style: "Heading2" }));
              continue;
            }

            // C. Handle Code Blocks in Manuals
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            
            if (inCodeBlock) {
                children.push(new docx.Paragraph({ text: line, style: "CodeBlock" }));
                continue;
            }

            // D. Handle Lists
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                children.push(new docx.Paragraph({ text: line.trim().substring(2), style: "ListParagraph", bullet: { level: 0 } }));
                continue;
            }
            
            // E. Normal Text with Bold parsing
            if (trimmed.length > 0) {
                const parts = line.split(/(\*\*.*?\*\*)/);
                const textRuns = parts.map(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return new docx.TextRun({ text: part.slice(2, -2), bold: true });
                    }
                    return new docx.TextRun({ text: part });
                });
                children.push(new docx.Paragraph({ children: textRuns, style: "NormalBody" }));
            } else {
                children.push(new docx.Paragraph({ text: "" }));
            }
        }

        // Step 3: Pack (CPU Bound)
        const doc = new docx.Document({
            styles: OFFICIAL_STYLES,
            sections: [{
                properties: {
                    page: { margin: { top: 1440, right: 1800, bottom: 1440, left: 1800 } }, // Official Margins
                },
                footers: {
                    default: new docx.Footer({
                        children: [
                            new docx.Paragraph({
                                alignment: docx.AlignmentType.CENTER,
                                children: [
                                    new docx.TextRun({ children: ["第 ", docx.PageNumber.CURRENT, " 页"], size: 21, font: "SimSun" })
                                ],
                            }),
                        ],
                    }),
                },
                children: children 
            }],
        });

        return await docx.Packer.toBlob(doc);
    }
}

// --- SOP EXPORT PIPELINE ---

export type ExportEvent = {
    step: 'INIT' | 'COMPILE' | 'ASSET' | 'AUDIT' | 'COMPRESS' | 'FINISH';
    message: string;
    progress: number;
    detail?: string;
};

export class ExportPipeline {
    private context: PipelineContext;
    private zip: JSZip;
    private folderName: string;
    private root: JSZip;
    private compiler: DocxCompiler;

    constructor(context: PipelineContext) {
        this.context = context;
        this.zip = new JSZip();
        this.folderName = context.registrationInfo?.softwareFullName || 'software-copyright-materials';
        this.root = this.zip.folder(this.folderName)!;
        this.compiler = new DocxCompiler();
    }

    async run(onEvent: (e: ExportEvent) => void) {
        try {
            // Phase 1: Init
            onEvent({ step: 'INIT', message: '初始化交付环境...', progress: 5, detail: 'Connecting to Local IndexedDB...' });
            await yieldToMain();
            
            // Phase 2: Compile Docs (Serial execution for stability, but optimized internally)
            const filesToGenerate = [
                { key: 'appForm', name: '【01】计算机软件著作权登记申请表.docx', isCode: false },
                { key: 'userManual', name: '【02】软件操作说明书.docx', isCode: false },
                { key: 'sourceCode', name: '【03】源程序鉴别材料.docx', isCode: true },
            ];

            const docStepSize = 50 / filesToGenerate.length;

            for (let i = 0; i < filesToGenerate.length; i++) {
                const fileDef = filesToGenerate[i];
                onEvent({ 
                    step: 'COMPILE', 
                    message: `正在编译文档: ${fileDef.name}`, 
                    progress: 10 + (i * docStepSize),
                    detail: fileDef.isCode ? 'Applying Line Numbers & Syntax Styles...' : 'Applying GB/T Standard Styles...'
                });
                
                // Fetch Content text
                let content = await db.getContent(fileDef.key);
                if (!content && typeof this.context.artifacts[fileDef.key as keyof Artifacts] === 'string') {
                    content = this.context.artifacts[fileDef.key as keyof Artifacts] as string;
                }

                if (content && typeof content === 'string') {
                    // Compile using the optimized class
                    const blob = await this.compiler.compile(content, fileDef.isCode);
                    this.root.file(fileDef.name, blob);
                }
                await yieldToMain();
            }

            // Phase 3: Assets (Bulk Archiving)
            const imageKeys = Object.keys(this.context.artifacts.uiImages);
            onEvent({ step: 'ASSET', message: '归档原始高清素材...', progress: 65, detail: `Archiving ${imageKeys.length} UI Screenshots...` });
            
            const imgFolder = this.root.folder("UI_原始截图");
            if (imgFolder && imageKeys.length > 0) {
                // Batch fetch all raw images for archiving
                const allImages = await db.getBatchContent(imageKeys);
                
                let processedCount = 0;
                for(const key of imageKeys) {
                    const blob = allImages[key];
                    if (blob instanceof Blob) {
                        imgFolder.file(key, blob);
                    }
                    processedCount++;
                    if(processedCount % 5 === 0) await yieldToMain();
                }
            }

            // Phase 4: Audit Record
            onEvent({ step: 'AUDIT', message: '封存审计日志...', progress: 80, detail: 'Generating Audit Report...' });
            
            // Generate report from history
            const history = this.context.artifacts.auditHistory;
            if (history && history.length > 0) {
                const latest = history[history.length - 1];
                const reportContent = [
                    `【内部审计报告】`,
                    `轮次: ${latest.round}`,
                    `时间: ${latest.timestamp}`,
                    `得分: ${latest.score}`,
                    `结果: ${latest.passed ? 'PASSED' : 'FAILED'}`,
                    `----------------------------------------`,
                    `摘要: ${latest.summary}`,
                    `----------------------------------------`,
                    `问题清单:`,
                    ...latest.issues.map(i => `[${i.severity}] [${i.category}] ${i.message}\n   建议: ${i.suggestion}`),
                    `----------------------------------------`,
                    `自动修复记录:`,
                    ...(latest.fixSummary || ['无'])
                ].join('\n');
                
                this.root.file('【内部审计】一致性校验报告.txt', reportContent);
            }
            await yieldToMain();

            // Phase 5: Compress
            onEvent({ step: 'COMPRESS', message: '最终封包中...', progress: 85, detail: 'High Ratio DEFLATE Compression...' });
            
            const content = await this.zip.generateAsync({ 
                type: 'blob',
                compression: "DEFLATE",
                compressionOptions: { level: 6 } 
            }, (metadata) => {
                onEvent({ 
                    step: 'COMPRESS', 
                    message: '压缩优化中...', 
                    progress: 85 + (metadata.percent * 0.14),
                    detail: `Processing ${metadata.currentFile || 'stream'}...`
                });
            });

            // Finish
            onEvent({ step: 'FINISH', message: '交付包构建完成', progress: 100 });
            return content;

        } catch (e: any) {
            console.error(e);
            throw new Error(`Export failed: ${e.message}`);
        }
    }
}
