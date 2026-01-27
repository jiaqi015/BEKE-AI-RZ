
import { aiClient } from "../../infrastructure/ai/geminiClient";

/**
 * 创意总监 (Creative Director)
 * 职责：当用户懒得输入时，通过深度推理生成高质量、脑洞大的产品创意。
 */
export const generateRandomIdea = async (): Promise<string> => {
  const prompt = `
    Role: Speculative Product Futurist & Chief Innovation Officer.
    Context: 贝壳找房 (Beike) - China's leading real estate & housing platform.
    
    Task: Brainstorm a "Moonshot" AI Product Idea for Beike.
    
    Constraint:
    - **Language**: Chinese (Simplified) ONLY. No English output.
    - **Deep Reasoning**: Do not just give a generic app idea. Think about the psychological needs of home buyers, the friction of landlords, or the future of urban living.
    - **Tech Stack**: Must involve Generative AI, Spatial Computing (VR/AR), Digital Twin, or Predictive Behavioral Analytics.
    - **Style**: High-concept, Innovative, "Brain hole" (脑洞大), but logically sound.
    - **Length**: A single, dense, persuasive paragraph (150-200 words).
    
    Scenarios (Pick ONE randomly):
    1. A "Time-Travel" viewing experience showing a home's past and future value potential.
    2. An AI Agent that acts as a "Ruthless Negotiator" for introverted buyers.
    3. A "Soul-Matching" rental system that matches roommates/landlords based on lifestyle algorithms, not just budget.
    4. A "Digital Renovation" sandbox that generates construction drawings from voice commands before buying.
    
    Output the idea directly. No "Here is the idea" prefix.
  `;
  
  // Use Pro model for better creativity and reasoning
  return await aiClient.generateText(prompt, true);
};
