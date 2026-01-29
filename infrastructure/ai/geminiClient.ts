
import { GoogleGenAI, Type, Schema, Tool } from "@google/genai";

class GeminiClient {
  // Use pro-preview for complex reasoning/coding tasks
  private modelPro = 'gemini-3-pro-preview';
  // Use pro-image-preview for image generation and tasks requiring search grounding
  private modelImage = 'gemini-3-pro-image-preview';
  
  private _totalTokenUsage = 0;

  constructor() {}

  /**
   * Always create a new instance before a call to ensure the latest API key from the environment/dialog is used.
   */
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  get totalTokenUsage() {
    return this._totalTokenUsage;
  }

  private trackUsage(response: any) {
      if (response.usageMetadata?.totalTokenCount) {
          this._totalTokenUsage += response.usageMetadata.totalTokenCount;
      }
  }

  /**
   * Robust Retry Wrapper
   */
  private async withRetry<T>(operation: () => Promise<T>, signal?: AbortSignal, retries = 3, delay = 1000): Promise<T> {
      try {
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
          return await operation();
      } catch (error: any) {
          if (error.name === 'AbortError' || signal?.aborted) {
              throw error;
          }

          // Handle "Requested entity was not found" by signaling a key reset might be needed
          if (error.message?.includes("Requested entity was not found")) {
              console.error("API Key error detected. Resetting session might be required.");
          }

          if (retries <= 0) throw error;
          
          const isRetryable = error.status === 503 || error.status === 429 || error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('xhr');
          
          if (isRetryable) {
              console.warn(`Gemini API error (xhr/network/busy). Retrying in ${delay}ms... (${retries} left)`);
              await new Promise((res, rej) => {
                  const timer = setTimeout(() => {
                      signal?.removeEventListener('abort', onAbort);
                      res(true);
                  }, delay);
                  const onAbort = () => {
                      clearTimeout(timer);
                      rej(new DOMException("Aborted", "AbortError"));
                  };
                  signal?.addEventListener('abort', onAbort);
              });
              
              return this.withRetry(operation, signal, retries - 1, delay * 2);
          }
          throw error;
      }
  }

  async generateTextWithSearch(prompt: string, signal?: AbortSignal): Promise<{ text: string, sources: string[] }> {
    return this.withRetry(async () => {
        const ai = this.getAI();
        const tools: Tool[] = [{ googleSearch: {} }];
        
        // Use gemini-3-pro-image-preview for search grounding tasks as per requirements
        const response = await ai.models.generateContent({
            model: this.modelImage,
            contents: prompt,
            config: {
                tools: tools,
            }
        });
        
        this.trackUsage(response);

        const sources: string[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web?.uri) sources.push(chunk.web.title || chunk.web.uri);
            });
        }

        return { 
            text: response.text || '', 
            sources: [...new Set(sources)]
        };
    }, signal);
  }

  async generateStructured<T>(prompt: string, schema: Schema, usePro = true, signal?: AbortSignal): Promise<T> {
    return this.withRetry(async () => {
        const ai = this.getAI();
        const response = await ai.models.generateContent({
            model: usePro ? this.modelPro : 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        this.trackUsage(response);
        const text = response.text;
        if (!text) throw new Error("Empty response from AI");
        return JSON.parse(text) as T;
    }, signal);
  }

  async generateText(prompt: string, usePro = true, signal?: AbortSignal): Promise<string> {
    return this.withRetry(async () => {
        const ai = this.getAI();
        const response = await ai.models.generateContent({
            model: usePro ? this.modelPro : 'gemini-3-flash-preview',
            contents: prompt,
        });
        this.trackUsage(response);
        return response.text || '';
    }, signal);
  }

  async generateImage(prompt: string, aspectRatio: "16:9" | "9:16" = "16:9", signal?: AbortSignal): Promise<string | null> {
    const attempt = async (retryCount: number): Promise<string | null> => {
        try {
            if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

            const ai = this.getAI();
            const response = await ai.models.generateContent({
                model: this.modelImage,
                contents: { parts: [{ text: prompt }] },
                config: {
                    // UPGRADE: Use 2K resolution for sharper UI text
                    imageConfig: { imageSize: "2K", aspectRatio: aspectRatio }
                }
            });
            this.trackUsage(response);
            
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return part.inlineData.data;
                    }
                }
            }
            throw new Error("No image data in response");
        } catch (error: any) {
            if (error.name === 'AbortError' || signal?.aborted) throw error;
            console.warn(`Image generation failed. Retries left: ${retryCount}. Error:`, error);
            if (retryCount > 0) {
                await new Promise((res, rej) => {
                     const t = setTimeout(res, 2000);
                     signal?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException("Aborted", "AbortError")); });
                });
                return attempt(retryCount - 1);
            }
            return null;
        }
    };

    return attempt(2);
  }
}

export const aiClient = new GeminiClient();
