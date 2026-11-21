import { sonnarClient } from './esg-sonnar-client';
import { adminDb } from '@/lib/firebase-admin';

export interface DocumentCollectionProgress {
  totalRequired: number;
  collected: number;
  pending: number;
  categories: {
    energy: { collected: number, required: number };
    water: { collected: number, required: number };
    waste: { collected: number, required: number };
    social: { collected: number, required: number };
  };
}

export interface EnterpriseContext {
  companyName: string;
  industry: string;
  employeeCount: number;
  revenue: string;
  headquarters: string;
  sustainabilityGoals: string[];
  documentProgress: DocumentCollectionProgress;
}

export async function fetchEnterpriseData(companyId: string): Promise<EnterpriseContext> {
  try {
    const docRef = await adminDb.collection('enterprises')?.doc(companyId)?.get();
    if (docRef?.exists) {
      const data = docRef.data();
      return {
        companyName: data?.companyName || '未知企業',
        industry: data?.industry || '未知產業',
        employeeCount: data?.employeeCount || 0,
        revenue: data?.revenue || '0',
        headquarters: data?.headquarters || '未知地點',
        sustainabilityGoals: data?.sustainabilityGoals || [],
        documentProgress: data?.documentProgress || {
          totalRequired: 0,
          collected: 0,
          pending: 0,
          categories: {
            energy: { collected: 0, required: 0 },
            water: { collected: 0, required: 0 },
            waste: { collected: 0, required: 0 },
            social: { collected: 0, required: 0 },
          }
        }
      } as EnterpriseContext;
    }
  } catch (error) {
    console.warn('[EnterpriseData] Firebase Admin read failed, falling back to ESGSonnar', error);
  }

  // Fallback: Use ESGSonnar as the powerful backend database
  const profile = await sonnarClient.query({
    companyId,
    queryType: 'enterprise_profile'
  });

  const progress = await sonnarClient.query({
    companyId,
    queryType: 'document_progress'
  });

  return {
    ...profile,
    documentProgress: progress
  };
}
