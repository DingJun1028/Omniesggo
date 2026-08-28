import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import { EntropyForge } from '@/lib/omni-core/entropy-forge';

// ----------------------------------------------------------------------------
// OmniVillage Projects Database (Mock)
// In production, this data should reside in NCBDB / Firebase Firestore
// and adhere to the 5T Protocol (Traceable, Transparent, etc.)
// ----------------------------------------------------------------------------
const projects = [
  { id: 'p1', title: '建設綠能太陽能板', description: '在村莊屋頂設置太陽能板，預計減碳 15%', votes: 4, cost: 16 },
  { id: 'p2', title: '推動無紙化 OmniNote', description: '所有村莊會議記錄數位化', votes: 10, cost: 100 },
  { id: 'p3', title: '智能電網升級計畫', description: '整合儲能系統以優化能源分配', votes: 2, cost: 4 },
];

export async function GET() {
  return jsonResponse({
    projects,
    timestamp: Date.now()
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, projectId, votesToCast, title, description } = body;

    // ------------------------------------------------------------------------
    // Action: Create Project
    // ------------------------------------------------------------------------
    if (action === 'create') {
      const newProject = {
        id: `p${Date.now()}`,
        title: title ? EntropyForge.purify(title) : '未命名提案',
        description: description ? EntropyForge.purify(description) : '',
        votes: 0,
        cost: 0
      };
      projects.push(newProject);
      return jsonResponse(newProject);
    }

    // ------------------------------------------------------------------------
    // Action: Quadratic Voting
    // ------------------------------------------------------------------------
    if (action === 'vote') {
      const projectIndex = projects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) {
        return jsonError('PROJECT_NOT_FOUND');
      }

      const v = Number(votesToCast);
      if (isNaN(v) || v <= 0) {
        return jsonError('INVALID_PARAMS', 'Invalid vote count');
      }

      // Quadratic Voting Cost Formula: Cost = (Votes)^2
      const cost = v * v;
      
      // Note: In a real system, you MUST deduct the `cost` from the user's
      // Voice Credits balance here. If balance < cost, reject the vote.
      
      projects[projectIndex].votes += v;
      projects[projectIndex].cost += cost;

      return jsonResponse({
        message: `成功投出 ${v} 票。消耗了 ${cost} 點 Voice Credits。 (Cost = Votes^2)`,
        project: projects[projectIndex]
      });
    }

    return jsonError('INVALID_ACTION', 'Invalid action');
  } catch (error) {
    return jsonErrorInternal(error);
  }
}
