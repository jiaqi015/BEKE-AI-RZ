
import { aiClient } from "../../infrastructure/ai/geminiClient";

/**
 * 创意总监类 (Creative Director Service)
 * 职责：当用户懒得输入时，通过深度推理生成高质量、具有申报价值的产品创意。
 */
class CreativeDirectorService {
  private scenarios = [
    "基于空间计算 (VR/AR) 的贝壳全景智能看房辅助系统",
    "面向极简主义者的 AI 智能家居自动化场景生成器",
    "基于行为预测的二手房交易价格波动分析与谈判模拟器",
    "针对城市流动人口的租房生活质量 (QoL) 动态评估与匹配系统",
    "基于数字孪生的家装设计与施工进度实时监控平台"
  ];

  /**
   * 生成一个极具吸引力且符合软著申报逻辑的产品创意
   */
  async generateIdea(): Promise<string> {
    const randomScenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
    
    const prompt = `
      Role: Speculative Product Futurist & Chief Innovation Officer.
      Context: 贝壳找房 (Beike) 生态系统，旨在利用 AI 提升居住质量。
      
      Task: Brainstorm a High-Concept AI Product Idea.
      Theme: ${randomScenario}
      
      Constraint:
      - **Language**: Chinese (Simplified) ONLY.
      - **Structure**: 
        1. 产品名称 (充满科技感)
        2. 核心痛点 (深刻且具体)
        3. AI 解决方案 (技术上合理且创新，包含生成式 AI、数字孪生等)
        4. 预期价值。
      - **Style**: 紧凑、深刻、具备商业说服力。
      - **Length**: 150-250 字。
      
      Output the idea directly without conversational filler.
    `;
    
    try {
        // 使用 Pro 模型以获得更佳的推理深度
        return await aiClient.generateText(prompt, true);
    } catch (e) {
        console.error("CreativeDirector error:", e);
        return "基于 AI 的智慧社区生活服务管理平台：通过集成深度学习算法，实时分析居民生活习惯，自动优化社区资源分配与安防巡检路径，构建高效、安全的未来社区生态。";
    }
  }
}

export const creativeDirector = new CreativeDirectorService();
