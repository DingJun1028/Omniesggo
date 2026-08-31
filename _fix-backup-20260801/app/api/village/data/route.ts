import { seedVillageData } from '@/lib/village-seeder';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface VillageProject {
  id: string;
  current_points: number;
  [key: string]: unknown;
}

interface VillageMember {
  user_id: string;
  points: number;
  [key: string]: unknown;
}

interface VillageActivity {
  id: string;
  message: string;
  created_at: string;
  [key: string]: unknown;
}

// Firestore DocumentSnapshot type
interface FirestoreDoc {
  id: string;
  data(): Record<string, unknown>;
}

export async function GET() {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    await seedVillageData();

    const projectsSnap = await adminDb.collection('village_projects')?.get();
    const projects = (projectsSnap?.docs ?? []).map((doc: FirestoreDoc) => ({ id: doc.id, ...doc.data() })) as VillageProject[];
    projects.sort((a: VillageProject, b: VillageProject) => b.current_points - a.current_points);

    const membersSnap = await adminDb.collection('village_members')?.orderBy('points', 'desc')?.get();
    const members = (membersSnap?.docs ?? []).map((doc: FirestoreDoc) => ({ user_id: doc.id, ...doc.data() })) as VillageMember[];

    const activitiesSnap = await adminDb.collection('village_activities')?.orderBy('created_at', 'desc')?.limit(10)?.get();
    
    const formatRelativeTime = (isoString: string) => {
      if (!isoString) return '';
      const diff = Date.now() - new Date(isoString).getTime();
      if (diff < 60000) return '剛剝';
      if (diff < 3600000) return `${Math.floor(diff/60000)}分鐘前`;
      if (diff < 86400000) return `${Math.floor(diff/3600000)}小時前`;
      return `${Math.floor(diff/86400000)}天前`;
    };

    const activities = (activitiesSnap?.docs ?? []).map((doc: FirestoreDoc) => {
      const data = doc.data() as VillageActivity;
      return {
        id: doc.id,
        message: data.message,
        time: formatRelativeTime(data.created_at)
      };
    });

    return jsonResponse({
      success: true,
      projects,
      members,
      activities
    });

  } catch (error: unknown) {
    console.error('Village Data Error:', error);
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}
