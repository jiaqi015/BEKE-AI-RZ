
import Dexie, { Table } from 'dexie';
import { PipelineContext, PipelineStep } from '../../types';

export interface FileRecord {
  key: string;       // Unique ID
  content: Blob | string; 
  mimeType: string;
  createdAt: number;
}

export interface AppStateRecord {
  id: string; // 'current_session'
  steps: PipelineStep[];
  context: Partial<PipelineContext>; 
  currentStepId: number;
  updatedAt: number;
}

class ProjectDatabase extends Dexie {
  files!: Table<FileRecord>;
  appState!: Table<AppStateRecord>;

  // Track active URLs to prevent memory leaks
  private activeObjectUrls: Set<string> = new Set();

  constructor() {
    super('ChenXinSoftDB');
    (this as any).version(1).stores({
      files: '&key, mimeType',
      appState: '&id' 
    });
  }

  /**
   * Optimized: Uses browser's native fetch API to convert Base64 to Blob.
   * This avoids blocking the main thread with heavy CPU loops (atob/charCodeAt).
   */
  async saveBase64Image(key: string, base64Data: string): Promise<string> {
    try {
        // 1. Convert Base64 to Blob efficiently using Fetch API (Microtask)
        // Add prefix if missing to make it a valid Data URI
        const dataUri = base64Data.startsWith('data:') 
            ? base64Data 
            : `data:image/png;base64,${base64Data}`;
            
        const res = await fetch(dataUri);
        const blob = await res.blob();
        
        // 2. Persist to IndexedDB
        await this.files.put({
            key,
            content: blob,
            mimeType: 'image/png',
            createdAt: Date.now()
        });
        
        // 3. Create URL for UI display
        return this.createTrackedUrl(blob);
    } catch (e) {
        console.error("Failed to save image to DB", e);
        throw new Error(`Image persistence failed: ${key}`);
    }
  }

  async saveText(key: string, text: string) {
    try {
        await this.files.put({
            key,
            content: text,
            mimeType: 'text/plain',
            createdAt: Date.now()
        });
    } catch (e) {
        console.error("DB Write Error", e);
    }
  }

  async getContent(key: string): Promise<Blob | string | undefined> {
    const record = await this.files.get(key);
    return record?.content;
  }

  async getBatchContent(keys: string[]): Promise<Record<string, Blob | string>> {
      if (!keys || keys.length === 0) return {};
      const records = await this.files.bulkGet(keys);
      const result: Record<string, Blob | string> = {};
      records.forEach(r => {
          if (r && r.content) result[r.key] = r.content;
      });
      return result;
  }

  async getAllImages(): Promise<Record<string, string>> {
      // Clean up old URLs before loading new ones to avoid leaks
      this.revokeAllUrls();

      const images: Record<string, string> = {};
      const records = await this.files.where('mimeType').equals('image/png').toArray();
      records.forEach(r => {
          if (r.content instanceof Blob) {
              images[r.key] = this.createTrackedUrl(r.content);
          }
      });
      return images;
  }

  async saveSession(steps: PipelineStep[], context: PipelineContext, currentStepId: number) {
    // Optimization: Do not store large artifacts in session JSON state
    // We only store the "Lightweight" state. Heavy assets live in 'files' table.
    const contextToSave = {
        ...context,
        artifacts: {
            ...context.artifacts,
            uiImages: {}, // Regenerated on load
            sourceCode: undefined, 
            appForm: undefined,
            userManual: undefined
        }
    };

    try {
        await this.appState.put({
            id: 'current_session',
            steps,
            context: contextToSave,
            currentStepId,
            updatedAt: Date.now()
        });
    } catch (e) {
        console.warn("Session Auto-save failed", e);
    }
  }

  async loadSession() {
    return await this.appState.get('current_session');
  }

  async clearSession() {
    this.revokeAllUrls();
    await this.appState.delete('current_session');
    await this.files.clear();
  }

  // --- Memory Management Helpers ---

  private createTrackedUrl(blob: Blob): string {
      const url = URL.createObjectURL(blob);
      this.activeObjectUrls.add(url);
      return url;
  }

  private revokeAllUrls() {
      this.activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
      this.activeObjectUrls.clear();
  }
}

export const db = new ProjectDatabase();
