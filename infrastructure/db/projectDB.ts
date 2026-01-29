
import Dexie, { Table } from 'dexie';
import { PipelineContext, PipelineStep, LogEntry } from '../../types';

// ==========================================
// Data Models
// ==========================================

export interface FileRecord {
  key: string;       
  content: Blob | string; 
  mimeType: string;
  createdAt: number;
}

export interface SessionRecord {
  id: string; // 'current_session'
  steps: PipelineStep[];
  context: Partial<PipelineContext>; 
  currentStepId: number;
  logs: LogEntry[]; // Persist logs to survive refresh
  updatedAt: number;
}

// ==========================================
// Database Class (The Infrastructure)
// ==========================================

class ProjectDatabase extends Dexie {
  files!: Table<FileRecord>;
  session!: Table<SessionRecord>;

  // Memory Management: Track active Object URLs to prevent leaks
  private activeObjectUrls: Map<string, string> = new Map();

  constructor() {
    super('ChenXinSoftDB');
    (this as any).version(2).stores({ // Bump version for schema changes if any
      files: '&key, mimeType',
      session: '&id' 
    });
  }

  // --- Resource Lifecycle Management ---

  /**
   * Creates a managed ObjectURL. 
   * If a URL exists for this key, revoke it first to prevent leaks.
   */
  public getManagedUrl(key: string, blob: Blob): string {
      if (this.activeObjectUrls.has(key)) {
          URL.revokeObjectURL(this.activeObjectUrls.get(key)!);
      }
      const url = URL.createObjectURL(blob);
      this.activeObjectUrls.set(key, url);
      return url;
  }

  public revokeAllUrls() {
      this.activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
      this.activeObjectUrls.clear();
  }

  // --- Repository Methods (Public API) ---

  /**
   * Smart save: Handles Base64 string or raw Blob automatically.
   */
  async saveArtifact(key: string, content: string | Blob, mimeType: string = 'text/plain'): Promise<string | null> {
    try {
        let blob: Blob;
        
        if (content instanceof Blob) {
            blob = content;
        } else if (mimeType.startsWith('image/') && typeof content === 'string') {
            // Efficient Base64 -> Blob conversion via fetch (Microtask)
            const dataUri = content.startsWith('data:') ? content : `data:${mimeType};base64,${content}`;
            const res = await fetch(dataUri);
            blob = await res.blob();
        } else {
            // Plain text
            blob = new Blob([content], { type: mimeType });
        }

        await this.files.put({
            key,
            content: blob,
            mimeType,
            createdAt: Date.now()
        });

        // If it's an image, return a displayable URL immediately
        if (mimeType.startsWith('image/')) {
            return this.getManagedUrl(key, blob);
        }
        return null;
    } catch (e) {
        console.error(`[DB] Failed to save artifact [${key}]`, e);
        throw e;
    }
  }

  async getArtifact(key: string): Promise<Blob | string | undefined> {
    const record = await this.files.get(key);
    // Return raw content (Blob or string)
    // Legacy support: some old records might store string directly in content
    return record?.content;
  }

  async getBatchArtifacts(keys: string[]): Promise<Record<string, Blob | string>> {
      if (!keys || keys.length === 0) return {};
      const records = await this.files.bulkGet(keys);
      const result: Record<string, Blob | string> = {};
      records.forEach(r => {
          if (r && r.content) result[r.key] = r.content;
      });
      return result;
  }

  /**
   * Rehydrates all image URLs from Blob storage.
   * Call this on app start.
   */
  async hydrateImageUrls(): Promise<Record<string, string>> {
      this.revokeAllUrls(); // Cleanup previous session
      const images: Record<string, string> = {};
      
      const records = await this.files
          .where('mimeType').startsWith('image/')
          .toArray();
          
      records.forEach(r => {
          if (r.content instanceof Blob) {
              images[r.key] = this.getManagedUrl(r.key, r.content);
          }
      });
      return images;
  }

  // --- Session Persistence ---

  async saveSessionState(
      steps: PipelineStep[], 
      context: PipelineContext, 
      currentStepId: number,
      logs: LogEntry[]
  ) {
    // Light-weight context for DB (remove heavy artifacts)
    const contextToSave = {
        ...context,
        artifacts: {
            ...context.artifacts,
            uiImages: {}, // Don't store URLs or Blobs in JSON, they are in 'files' table
            // We keep text references (sourceCode, etc) if they are small, 
            // but ideally we should only store keys. For now, keep text for simplicity.
        }
    };

    try {
        await this.session.put({
            id: 'current_session',
            steps,
            context: contextToSave,
            currentStepId,
            logs, 
            updatedAt: Date.now()
        });
    } catch (e) {
        console.warn("[DB] Session save failed", e);
    }
  }

  async loadSession(): Promise<SessionRecord | undefined> {
    return await this.session.get('current_session');
  }

  async clearSession() {
    this.revokeAllUrls();
    await this.session.delete('current_session');
    // We also clear files to ensure a fresh start
    await this.files.clear();
  }
}

export const db = new ProjectDatabase();
