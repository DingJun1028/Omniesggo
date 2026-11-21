import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { evidenceVaultApi } from '@lib/ncb-service';

// --- Types ---
export interface INCBDBSyncMetadata {
  id: string;
  title: string;
  driveId?: string;
  webViewLink?: string;
  type: string;
  source: string;
  timestamp?: number;
  hash?: string;
}

// --- Configuration ---
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'ncbdb.json');

// --- Initialization ---
const initializeDB = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ documents: [] }, null, 2));
    }
  } catch (error) {
    console.error('[NCBDB] Initialization failed:', error);
  }
};

// Initialize on module load
initializeDB();

// --- Utility Functions ---
const generateHash = (data: any): string => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const readDB = (): { documents: INCBDBSyncMetadata[] } => {
  try {
    if (!fs.existsSync(DB_PATH)) return { documents: [] };
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[NCBDB] Read failed:', error);
    return { documents: [] };
  }
};

const writeDB = (data: { documents: INCBDBSyncMetadata[] }) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[NCBDB] Write failed:', error);
    throw new Error('Failed to persist data to NCBDB');
  }
};

// --- Core Services ---
/**
 * Saves document metadata to the NCBDB (simulated local JSON and NCBDB).
 * Implements 5T Protocol: Trustworthy (Hash generation).
 */
export async function saveDocumentMetadata(metadata: Omit<INCBDBSyncMetadata, 'timestamp' | 'hash'>): Promise<INCBDBSyncMetadata> {
  const dbContent = readDB();
  
  const timestamp = Date.now();
  const dataToHash = { ...metadata, timestamp };
  const hash = generateHash(dataToHash);
  
  const newRecord: INCBDBSyncMetadata = {
    ...metadata,
    timestamp,
    hash,
  };

  dbContent.documents.push(newRecord);
  writeDB(dbContent);
  
  // Sync to NCBDB
  const { error } = await evidenceVaultApi.insert({
    record_id: newRecord.id,
    type: newRecord.type,
    timestamp: new Date(timestamp).toISOString(),
    hash: hash,
    status: "SEALED",
    variant: "optimal"
  });
    
  if (error) {
    console.warn("[NCBDB] NCBDB sync failed:", error.message || error);
  } else {
    console.log("[NCBDB] Successfully synced to NCBDB.");
  }
  
  console.log(`[NCBDB] Document metadata saved. ID: ${newRecord.id}, Hash: ${newRecord.hash}`);
  return newRecord;
}

/**
 * Retrieves document metadata from the NCBDB by ID.
 */
export async function getDocumentMetadata(id: string): Promise<INCBDBSyncMetadata | undefined> {
  const dbContent = readDB();
  return dbContent.documents.find((doc) => doc.id === id);
}

/**
 * Retrieves all document metadata from the NCBDB.
 */
export async function getAllDocumentMetadata(): Promise<INCBDBSyncMetadata[]> {
  const dbContent = readDB();
  return dbContent.documents;
}
