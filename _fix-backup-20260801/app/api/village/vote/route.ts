import { rateLimit } from '@/lib/rate-limit';
import { CelestialController } from '@/lib/celestial/implementation';
import { jsonResponse, jsonError, validateParams, validatePositiveNumber, jsonErrorInternal } from '@lib/api-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { projectId, userId, amount, tenantId = 'default_tenant' } = await req.json();

    const paramValidation = validateParams({ projectId, userId, amount });
    if (!paramValidation.valid) {
      return jsonError('INVALID_PARAMS', `缺少必要參數: ${paramValidation.missing}`);
    }

    const amountValidation = validatePositiveNumber(amount, 'amount');
    if (!amountValidation.valid) {
      return jsonError('INVALID_PARAMS', amountValidation.error);
    }

    const rl = await rateLimit(`vote_${tenantId}_${userId}`, 5, 60);
    if (!rl.success) {
      return jsonError('RATE_LIMITED', '投票頻率過高，請稍後再試');
    }

    const cost = amount * amount * 10;
    const power = amount * 10;

    const { adminDb } = await import('@/lib/firebase-admin');
    const projectRef = adminDb.collection('village_projects')?.doc(projectId);
    const memberRef = adminDb.collection('village_members')?.doc(userId);
    const activityRef = adminDb.collection('village_activities')?.doc();

    if (!projectRef || !memberRef) {
      return jsonError('INTERNAL_ERROR', 'Firestore collections unavailable', 503);
    }

    try {
      await adminDb.runTransaction(async (t) => {
        const projectDoc = await t.get(projectRef);
        const memberDoc = await t.get(memberRef);

        if (!projectDoc.exists) {
          throw new Error('PROJECT_NOT_FOUND');
        }
        if (!memberDoc.exists) {
          throw new Error('MEMBER_NOT_FOUND');
        }

        const projectData = projectDoc.data() as { current_points: number; title: string; [key: string]: unknown };
        const memberData = memberDoc.data() as { points: number; name: string; [key: string]: unknown };

        if ((memberData?.points || 0) < cost) {
          throw new Error('INSUFFICIENT_POINTS');
        }

        // 1. Deduct points from user
        t.update(memberRef, {
          points: (memberData?.points || 0) - cost
        });

        // 2. Add points to project
        t.update(projectRef, {
          current_points: (projectData?.current_points || 0) + power
        });

        // 3. Log the activity for transparency (5T)
        const activityData = {
          projectId,
          userId,
          amount,
          cost,
          power,
          message: `${memberData?.name || '某個村民'} 向「${projectData?.title || '專案'}」投了 ${amount} 票 (花費 ${cost} PTS)`,
          created_at: new Date().toISOString()
        };

        const celestial = new CelestialController();
        const purifiedData = await celestial.executeCelestialFlow({
          payload: activityData,
          origin: 'VILLAGE_VOTE'
        });

        // Write the purified and sealed data to Firestore
        if (activityRef) {
          t.set(activityRef, { ...activityData, uuid: purifiedData?.uuid, sealTimestamp: purifiedData?.sealTimestamp });
        }
      });
    } catch (txError) {
      const errorCode = (txError as Error).message;
      if (errorCode === 'PROJECT_NOT_FOUND') {
        return jsonError('PROJECT_NOT_FOUND');
      }
      if (errorCode === 'MEMBER_NOT_FOUND') {
        return jsonError('MEMBER_NOT_FOUND');
      }
      if (errorCode === 'INSUFFICIENT_POINTS') {
        return jsonError('INSUFFICIENT_POINTS');
      }
      throw txError;
    }

    return jsonResponse({ 
      success: true, 
      message: '投票成功，ZKP 憑證已更新',
      cost,
      power
    });
  } catch (error) {
    console.error('Village Vote Error:', error);
    return jsonErrorInternal(error);
  }
}
