"use server";

import { ApostleSquadManager } from '../services/adk/apostle-squad-manager';
import { dispatchToApostleServer } from '../services/adk/apostle-dispatcher-server';


/**
 * Server action to dispatch a task to an ADK Apostle.
 */
export async function dispatchTaskAction(apostleId: string, input: string) {
  try {
    console.log(`[ADK Action] Dispatching to ${apostleId}...`);
    const result = await dispatchToApostleServer(apostleId, input);
    return { success: true, data: result };

  } catch (error: any) {
    console.error(`[ADK Action] Failed to dispatch task:`, error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Server action to get all Apostle statuses.
 */
export async function getApostleStatusesAction() {
  try {
    const statuses = ApostleSquadManager.getAllStatus();
    return { success: true, data: statuses };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
