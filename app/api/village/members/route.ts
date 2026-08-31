import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';

export async function GET() {
  try {
    // @deprecated - Village now uses real-time Firebase listeners on the client.
    // This API route remains as a fallback or for external integrations.
    
    // Fallback data if NCBDB returns empty or fails
    const fallbackMembers = [
      { user_id: 'u_01', name: 'Alice W.', title: '永續領航者', points: 24500, avatar: 'AW' },
      { user_id: 'u_02', name: 'Bob C.', title: '循環實踐家', points: 18200, avatar: 'BC' },
      { user_id: 'u_03', name: 'Charlie D.', title: '綠能先行者', points: 15400, avatar: 'CD' },
      { user_id: 'u_04', name: 'Diana P.', title: '生態守護者', points: 12050, avatar: 'DP' },
      { user_id: 'u_05', name: 'Eve S.', title: '減碳達人', points: 9800, avatar: 'ES' },
    ];

    return jsonResponse(fallbackMembers);
  } catch (error) {
    console.error('Village Members GET Error:', error);
    return jsonErrorInternal(error);
  }
}
