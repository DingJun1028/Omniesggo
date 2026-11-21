/**
 * ADK Guardrails
 * Implements safety layers using ADK's callback system.
 * This ensures that Agent inputs and Tool arguments are validated against 
 * Information One's 5T protocol (Truth, Good, Beauty, Trust, Trans).
 */

/**
 * Validates the raw input before it reaches the model.
 * Part of the [善 Good] dimension - preventing harmful or hallucinatory prompts.
 */
export const blockKeywordGuardrail = async (input: string): Promise<string | null> => {
  const forbiddenKeywords = ['hack', 'bypass', 'exploit', 'unauthorized'];
  for (const keyword of forbiddenKeywords) {
    if (input.toLowerCase().includes(keyword)) {
      return `[Guardrail] Input blocked: Contains forbidden term "${keyword}".`;
    }
  }
  return null;
};

/**
 * Validates tool arguments before execution.
 * Part of the [信 Trust] dimension - ensuring tools are used as intended.
 */
export const validateToolArgsGuardrail = async (toolName: string, args: any): Promise<string | null> => {
  console.log(`[Guardrail] Validating tool "${toolName}" with args:`, args);
  
  // Example: Block specific sensitive operations for the EntropyAgent
  if (toolName === 'sacrifice_redundancy' && args.volume > 0.5) {
    return `[Guardrail] Sacrifice volume ${args.volume} exceeds maximal safety threshold (0.5).`;
  }

  return null;
};
